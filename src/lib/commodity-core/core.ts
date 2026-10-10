// PHASE 04 · R&D (Roadmap · conditional) — Commodity Core: one Mind for a tokenized commodity,
// reading BOTH sides: the underlying commodity (futures quote) and its tokenized representations
// — commodity-ETF stock tokens on Robinhood Chain (GLD, SLV, USO) and commodity-backed tokens on
// Ethereum (PAXG, XAUT: 1 token = 1 troy oz of gold). Self-contained like token-core (shared by
// /api/lab/commodity-core and scripts/commodity-core.mts). Every number is read live; anything
// unreadable stays null. Nothing is simulated.
import { getOnchainSide, type OnchainSide } from "../token-core/core.ts";

export type Commodity = "GOLD" | "SILVER" | "OIL";

/** Robinhood Chain stock tokens of commodity ETFs (found by the Phase 01 minter scan). */
export const RH_COMMODITY_TOKENS: Record<Commodity, { symbol: string; fund: string; token: string }> = {
  GOLD: { symbol: "GLD", fund: "SPDR Gold Trust", token: "0xc9a981fee1f9dec688bb123ccdecc63d0debfc4e" },
  SILVER: { symbol: "SLV", fund: "iShares Silver Trust", token: "0x411efb0e7f985935daec3d4c3ebaea0d0ad7d89f" },
  OIL: { symbol: "USO", fund: "United States Oil Fund", token: "0xa30fa36db767ad9ed3f7a60fc79526fb4d56d344" },
};
/** Underlying futures (Yahoo symbols) and units. */
export const UNDERLYING: Record<Commodity, { future: string; unit: string; name: string }> = {
  GOLD: { future: "GC=F", unit: "oz", name: "Gold" },
  SILVER: { future: "SI=F", unit: "oz", name: "Silver" },
  OIL: { future: "CL=F", unit: "bbl", name: "WTI crude" },
};
/** Gold-backed ERC-20s on Ethereum: 1 token redeems for 1 fine troy ounce. */
export const GOLD_TOKENS = [
  { symbol: "PAXG", issuer: "Paxos", token: "0x45804880De22913dAFE09f4980848ECE6EcbAf78", decimals: 18, quote: "PAXG-USD" },
  { symbol: "XAUT", issuer: "Tether", token: "0x68749665FF8D2d112Fa859AA293F07A622782F38", decimals: 6, quote: "XAUT-USD" },
] as const;

// ── pure math (unit-tested in scripts/commodity-core.test.mts) ─────────────────
/** Token price vs the underlying, in % (positive = premium). null when either side is missing. */
export function premiumPct(tokenPrice: number | null, underlying: number | null, unitsPerToken = 1): number | null {
  if (tokenPrice == null || underlying == null || underlying <= 0 || unitsPerToken <= 0) return null;
  return (tokenPrice / (underlying * unitsPerToken) - 1) * 100;
}
/** Implied units of the commodity behind one ETF share (e.g. GLD ≈ 0.09 oz/share). */
export function unitsPerShare(sharePrice: number | null, underlying: number | null): number | null {
  if (sharePrice == null || underlying == null || underlying <= 0) return null;
  return sharePrice / underlying;
}
/** raw uint256 hex → token units. */
export function fromUnits(hex: string | null, decimals: number): number | null {
  if (!hex || hex === "0x") return null;
  const v = BigInt(hex);
  const d = BigInt(10) ** BigInt(decimals);
  return Number(v / d) + Number(v % d) / Number(d);
}
/** Alchemy RH URL → same key on Ethereum mainnet (null for non-Alchemy RPCs). */
export function ethRpcFrom(rpc: string): string | null {
  const m = rpc.match(/^https:\/\/[a-z0-9-]+\.g\.alchemy\.com\/v2\/([A-Za-z0-9_-]+)$/);
  return m ? `https://eth-mainnet.g.alchemy.com/v2/${m[1]}` : null;
}

// ── live reads ─────────────────────────────────────────────────────────────────
export async function quote(symbol: string): Promise<{ price: number; prev: number | null; at: string } | null> {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`, { headers: { "user-agent": "Mozilla/5.0 EQUENCY research" }, cache: "no-store" });
    const m = ((await r.json()) as { chart?: { result?: { meta?: Record<string, number> }[] } }).chart?.result?.[0]?.meta;
    if (typeof m?.regularMarketPrice !== "number") return null;
    return { price: m.regularMarketPrice, prev: m.chartPreviousClose ?? null, at: new Date((m.regularMarketTime ?? Date.now() / 1000) * 1000).toISOString() };
  } catch {
    return null;
  }
}
async function totalSupply(rpc: string, token: string, decimals: number): Promise<number | null> {
  try {
    const r = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: token, data: "0x18160ddd" }, "latest"] }), cache: "no-store" });
    return fromUnits(((await r.json()) as { result?: string }).result ?? null, decimals);
  } catch {
    return null;
  }
}

export interface Observation { k: string; trust: "VERIFIED" | "DERIVED"; text: string }
export interface BackedToken { symbol: string; issuer: string; token: string; supply: number | null; price: number | null; premiumPct: number | null; marketCapUsd: number | null }
export interface CommodityCore {
  commodity: Commodity;
  underlying: { name: string; future: string; unit: string; price: number | null; changePct: number | null; at: string | null };
  etf: { symbol: string; fund: string; price: number | null; unitsPerShare: number | null; onchain: OnchainSide };
  backed: BackedToken[];
  observations: Observation[];
  builtAt: string;
}

const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { maximumFractionDigits: d });
const usd = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${fmt(n)}`);

export async function buildCommodityCore(rpc: string, commodity: Commodity): Promise<CommodityCore> {
  const u = UNDERLYING[commodity], e = RH_COMMODITY_TOKENS[commodity];
  const eth = commodity === "GOLD" ? ethRpcFrom(rpc) : null;
  const [uq, eq, onchain, backed] = await Promise.all([
    quote(u.future),
    quote(e.symbol),
    getOnchainSide(rpc, e.token),
    Promise.all(
      (commodity === "GOLD" ? GOLD_TOKENS : []).map(async (g) => {
        const [supply, q] = await Promise.all([eth ? totalSupply(eth, g.token, g.decimals) : null, quote(g.quote)]);
        return { symbol: g.symbol, issuer: g.issuer, token: g.token, supply, price: q?.price ?? null, premiumPct: null as number | null, marketCapUsd: supply != null && q ? supply * q.price : null };
      }),
    ),
  ]);
  const spot = uq?.price ?? null;
  for (const b of backed) b.premiumPct = premiumPct(b.price, spot);
  const ups = unitsPerShare(eq?.price ?? null, spot);

  const obs: Observation[] = [];
  if (spot != null) obs.push({ k: "SPOT", trust: "VERIFIED", text: `${u.name} futures ${u.future} at $${fmt(spot)}/${u.unit}${uq?.prev ? ` (${((spot / uq.prev - 1) * 100).toFixed(2)}% vs prior close)` : ""}.` });
  if (ups != null) obs.push({ k: "ETF", trust: "DERIVED", text: `${e.symbol} at $${fmt(eq!.price)} ⇒ one share carries ≈ ${ups.toFixed(4)} ${u.unit} of ${u.name.toLowerCase()}.` });
  if (onchain.supply != null) obs.push({ k: "ONCHAIN", trust: "VERIFIED", text: `${fmt(onchain.supply)} ${e.symbol} shares live on Robinhood Chain${eq ? ` ≈ ${usd(onchain.supply * eq.price)}` : ""}, ${onchain.contractCounterparties} DeFi contracts touch it.` });
  for (const b of backed) {
    if (b.supply != null) obs.push({ k: "BACKED", trust: "VERIFIED", text: `${b.symbol} (${b.issuer}) supply ${fmt(b.supply, 0)} tokens, each redeemable for 1 oz of gold${b.marketCapUsd ? ` ≈ ${usd(b.marketCapUsd)}` : ""}.` });
    if (b.premiumPct != null) obs.push({ k: "SPREAD", trust: "DERIVED", text: `${b.symbol} trades ${b.premiumPct >= 0 ? "+" : ""}${b.premiumPct.toFixed(2)}% vs futures — ${Math.abs(b.premiumPct) < 0.5 ? "tight to the underlying" : "a measurable gap to the underlying"}.` });
  }
  return { commodity, underlying: { name: u.name, future: u.future, unit: u.unit, price: spot, changePct: uq?.prev && spot ? (spot / uq.prev - 1) * 100 : null, at: uq?.at ?? null }, etf: { symbol: e.symbol, fund: e.fund, price: eq?.price ?? null, unitsPerShare: ups, onchain }, backed, observations: obs, builtAt: new Date().toISOString() };
}
