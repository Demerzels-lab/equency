// PHASE 02 · R&D — Pair Core: a Mind for a token launched against a (tokenized) stock.
//
// Self-contained on purpose (no "@/…" imports, no "server-only"): the Next route
// (/api/lab/pair-core) and the terminal tool (scripts/pair-core.mts) share this file.
// Every number comes from a live source and carries it:
//   · launches + curve/pool state  → shrine.trade public Robinhood Chain API (keyless)
//   · quote asset identity         → ERC-20 name()/symbol()/decimals() on Robinhood Chain (4663)
//   · underlying stock             → Yahoo Finance chart meta (no key)
// Nothing is simulated. Missing data stays missing (null) and the UI says so.

export const SHRINE_HTTP = "https://api.shrine.trade/rh";
export const SHRINE_WS = "wss://api.shrine.trade/rh/api/launches/ws";
export const EXPLORER = "https://robinhoodchain.blockscout.com";

/** Raw event from the live launches feed (new_launch · new_pool · graduation). */
export interface LaunchEvent {
  type: string;
  protocol: string;
  launchpad?: string;
  token: string;
  name: string;
  symbol: string;
  blockNumber: number;
  txHash: string;
  timestamp: number;
  pairToken?: string;
  curve?: string;
  deployer?: string;
  graduationThreshold?: string;
  currency0?: string;
  currency1?: string;
  hooks?: string;
  poolId?: string;
}

export type QuoteKind = "stock" | "stable" | "eth" | "other";

export interface QuoteAsset {
  address: string | null; // null = native ETH
  symbol: string;
  name: string;
  decimals: number;
  kind: QuoteKind;
}

const ZERO = "0x0000000000000000000000000000000000000000";
const STABLES = new Set(["USDG", "USDC", "USDT", "DAI"]);
const WRAPPED_ETH = new Set(["WETH"]);

// ── tiny JSON-RPC (no viem: keeps this file runnable from plain node) ───────────
/** One JSON-RPC request; retries rate limits (HTTP 429 / code 429) with 0.5/1/2 s backoff. */
async function rpcReq<T>(rpc: string, method: string, params: unknown[]): Promise<T | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as { result?: T; error?: { code?: number } };
      const limited = res.status === 429 || j.error?.code === 429;
      if (!limited) return j.result ?? null;
    } catch {
      /* network error → retry */
    }
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
  }
  return null;
}

async function rpcCall(rpc: string, to: string, data: string): Promise<string | null> {
  const r = await rpcReq<string>(rpc, "eth_call", [{ to, data }, "latest"]);
  return r && r !== "0x" ? r : null;
}

function decodeString(hex: string | null): string | null {
  if (!hex) return null;
  const h = hex.slice(2);
  try {
    if (h.length === 64) return Buffer.from(h, "hex").toString("utf8").replace(/\0+$/, ""); // bytes32 style
    const len = parseInt(h.slice(64, 128), 16);
    return Buffer.from(h.slice(128, 128 + len * 2), "hex").toString("utf8");
  } catch {
    return null;
  }
}

const quoteCache = new Map<string, QuoteAsset>();

/** Identify the asset a launch is priced in. Tokenized stocks are "<Company> • Robinhood Token". */
export async function resolveQuote(rpc: string, addr: string | null | undefined): Promise<QuoteAsset> {
  if (!addr || addr === "ETH" || addr.toLowerCase() === ZERO) {
    return { address: null, symbol: "ETH", name: "Ether", decimals: 18, kind: "eth" };
  }
  const key = addr.toLowerCase();
  const hit = quoteCache.get(key);
  if (hit) return hit;
  const [n, s, d] = await Promise.all([
    rpcCall(rpc, addr, "0x06fdde03"),
    rpcCall(rpc, addr, "0x95d89b41"),
    rpcCall(rpc, addr, "0x313ce567"),
  ]);
  const name = decodeString(n) ?? "Unknown";
  const symbol = decodeString(s) ?? "???";
  const up = symbol.toUpperCase();
  const kind: QuoteKind = /robinhood token/i.test(name) ? "stock" : STABLES.has(up) ? "stable" : WRAPPED_ETH.has(up) ? "eth" : "other";
  const q: QuoteAsset = { address: addr, name, symbol, decimals: d ? parseInt(d, 16) : 18, kind };
  if (n && s) quoteCache.set(key, q); // never cache a failed lookup
  return q;
}

/** The quote side of a feed event: Pons gives pairToken; pools give the non-launched currency. */
export function quoteAddressOf(e: LaunchEvent): string | null {
  if (e.pairToken) return e.pairToken === "ETH" ? null : e.pairToken;
  if (e.currency0 && e.currency1) {
    const other = e.currency0.toLowerCase() === e.token.toLowerCase() ? e.currency1 : e.currency0;
    return other.toLowerCase() === ZERO ? null : other;
  }
  return null;
}

export function launchpadOf(e: LaunchEvent): string {
  return (e.launchpad ?? e.protocol ?? "?").replace("_V4", "").replace("UNISWAP", "UNISWAP v4");
}

// ── token side (curve / pool state) ─────────────────────────────────────────────
export interface TokenState {
  protocol: string;
  venue: string;
  phase: string | null;
  graduated: boolean;
  /** 0..1 share of the sellable curve supply already bought (null when not on a curve). */
  curveProgress: number | null;
  /** Spot price in quote units per token, from curve reserves (null when unknown). */
  priceInQuote: number | null;
  graduationThreshold: number | null; // in quote units
  creatorTaxBps: number | null;
  curveFeeBps: number | null;
  deployer: string | null;
  raw: Record<string, unknown>;
}

const fmtUnits = (v: unknown, dec: number): number | null => {
  if (typeof v !== "string" || !/^\d+$/.test(v)) return null;
  return Number(BigInt(v)) / 10 ** dec;
};

/** shrine.trade token info, retrying rate limits / transient errors (0.4/0.8/1.6 s). */
async function shrineToken(token: string): Promise<Record<string, unknown> | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${SHRINE_HTTP}/api/token/${token}`, { headers: { accept: "application/json" }, cache: "no-store" });
      if (res.ok) return (await res.json()) as Record<string, unknown>;
      if (res.status === 404 || res.status === 400) return null;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
  }
  return null;
}

export async function getTokenState(token: string, quoteDecimals: number): Promise<TokenState | null> {
  try {
    const j = await shrineToken(token);
    if (!j) return null;
    const tokenReserve = fmtUnits(j.tokenReserve, 18);
    const quoteReserve = fmtUnits(j.quoteReserve, quoteDecimals);
    const sellable = fmtUnits(j.sellableTokens, 18);
    const SUPPLY = 1_000_000_000; // Pons launches mint a fixed 1B supply
    let curveProgress: number | null = null;
    if (tokenReserve != null && sellable != null) {
      const sold = Math.max(0, SUPPLY - tokenReserve);
      curveProgress = sold + sellable > 0 ? sold / (sold + sellable) : null;
    }
    return {
      protocol: String(j.protocol ?? "?"),
      venue: String(j.venue ?? "?"),
      phase: (j.phase as string) ?? null,
      graduated: Boolean(j.graduated),
      curveProgress,
      priceInQuote: tokenReserve && quoteReserve ? quoteReserve / tokenReserve : null,
      graduationThreshold: fmtUnits(j.graduationThreshold, quoteDecimals),
      creatorTaxBps: typeof j.creatorTaxBps === "number" ? j.creatorTaxBps : null,
      curveFeeBps: typeof j.curveFeeBps === "number" ? j.curveFeeBps : null,
      deployer: (j.deployer as string) ?? null,
      raw: j,
    };
  } catch {
    return null;
  }
}

// ── stock side (the underlying company) ─────────────────────────────────────────
export interface StockState {
  ticker: string;
  company: string;
  price: number | null;
  changePct: number | null;
  /** US cash session right now: REGULAR | PRE | POST | CLOSED (from Yahoo trading periods). */
  session: "REGULAR" | "PRE" | "POST" | "CLOSED";
  /** Days since the first US trade (exchange data), when known. */
  listedDays: number | null;
  source: "yahoo";
}

export async function getStockState(ticker: string, company: string): Promise<StockState> {
  const out: StockState = { ticker, company, price: null, changePct: null, session: "CLOSED", listedDays: null, source: "yahoo" };
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=5m&includePrePost=true`, {
      headers: { "user-agent": "Mozilla/5.0 EQUENCY research" },
    });
    if (!res.ok) return out;
    const j = (await res.json()) as { chart?: { result?: { meta?: Record<string, unknown> }[] } };
    const m = j.chart?.result?.[0]?.meta;
    if (!m) return out;
    // Same ticker, same company? Guard against a token symbol that maps to a different listing.
    const yName = String(m.longName ?? m.shortName ?? "").toLowerCase();
    const first = company.toLowerCase().split(/[\s,.]+/)[0];
    if (yName && first && !yName.includes(first)) return out;
    const price = typeof m.regularMarketPrice === "number" ? m.regularMarketPrice : null;
    const prev = typeof m.chartPreviousClose === "number" ? m.chartPreviousClose : typeof m.previousClose === "number" ? m.previousClose : null;
    out.price = price;
    if (typeof m.firstTradeDate === "number") out.listedDays = Math.floor((Date.now() / 1000 - m.firstTradeDate) / 86_400);
    out.changePct = price != null && prev ? ((price - prev) / prev) * 100 : null;
    const p = m.currentTradingPeriod as Record<string, { start: number; end: number }> | undefined;
    const now = Date.now() / 1000;
    if (p) {
      if (now >= p.regular.start && now < p.regular.end) out.session = "REGULAR";
      else if (now >= p.pre.start && now < p.pre.end) out.session = "PRE";
      else if (now >= p.post.start && now < p.post.end) out.session = "POST";
    }
  } catch {
    /* stays null: the UI shows "unavailable" */
  }
  return out;
}

// ── the Core ───────────────────────────────────────────────────────────────────
export type PairCoreState = "BORN" | "OBSERVING";

export interface PairCoreObservation {
  k: string; // short tag
  text: string;
  trust: "VERIFIED" | "DERIVED";
}

export interface PairCore {
  token: { address: string; name: string; symbol: string; launchpad: string; txHash: string | null; launchedAt: number | null };
  quote: QuoteAsset;
  stock: StockState | null;
  market: TokenState | null;
  /** Token value in USD via the stock it's priced in (DERIVED). */
  priceUsd: number | null;
  state: PairCoreState;
  observations: PairCoreObservation[];
  builtAt: string;
}

/** "Space Exploration Technologies Corp. Class A Common Stock • Robinhood Token" → "Space Exploration Technologies". */
const company = (q: QuoteAsset) =>
  q.name
    .replace(/\s*•\s*Robinhood Token\s*$/i, "")
    .replace(/\s+(Class [A-Z]\b.*|Common Stock.*|Ordinary Shares.*)$/i, "")
    .replace(/,?\s+(Corp\.?|Corporation|Inc\.?|Ltd\.?|plc|N\.V\.|Holdings)$/i, "")
    .trim();
const usd = (n: number) => (n >= 1 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${n.toPrecision(3)}`);

export async function buildPairCore(
  rpc: string,
  input: { token: string; name?: string; symbol?: string; launchpad?: string; quoteAddress?: string | null; txHash?: string | null; launchedAt?: number | null },
): Promise<PairCore> {
  let quoteAddress = input.quoteAddress;
  let market: TokenState | null = null;
  // If we only have the token, shrine tells us what it is priced in.
  if (quoteAddress === undefined) {
    market = await getTokenState(input.token, 18);
    const pt = market?.raw.pairToken as string | undefined;
    quoteAddress = pt && pt !== "ETH" ? pt : null;
  }
  const quote = await resolveQuote(rpc, quoteAddress);
  if (!market || quote.decimals !== 18) market = await getTokenState(input.token, quote.decimals);

  let name = input.name, symbol = input.symbol;
  if (!name || !symbol) {
    const [n, s] = await Promise.all([rpcCall(rpc, input.token, "0x06fdde03"), rpcCall(rpc, input.token, "0x95d89b41")]);
    name = name ?? decodeString(n) ?? "Unknown";
    symbol = symbol ?? decodeString(s) ?? "???";
  }

  const stock = quote.kind === "stock" ? await getStockState(quote.symbol, company(quote)) : null;
  const priceUsd = market?.priceInQuote != null && stock?.price != null ? market.priceInQuote * stock.price : null;

  const obs: PairCoreObservation[] = [];
  if (quote.kind === "stock") {
    obs.push({ k: "PAIR", trust: "VERIFIED", text: `Priced in ${quote.symbol} (${company(quote)}). Trades and fees settle in the stock token.` });
    obs.push({ k: "LINK", trust: "DERIVED", text: `Dollar value = curve price × ${quote.symbol}: ${quote.symbol} +1% → $${symbol} +1%, with zero trades.` });
    if (stock?.listedDays != null && stock.listedDays <= 365)
      obs.push({ k: "ROOT", trust: "VERIFIED", text: `${quote.symbol} first traded ${stock.listedDays} days ago: the underlying is itself newly public (Day ${stock.listedDays}).` });
    if (stock?.price != null)
      obs.push({ k: "STOCK", trust: "VERIFIED", text: `${quote.symbol} ${usd(stock.price)}${stock.changePct != null ? ` (${stock.changePct >= 0 ? "+" : ""}${stock.changePct.toFixed(2)}%)` : ""} · US session ${stock.session}.` });
    if (stock && stock.session !== "REGULAR")
      obs.push({ k: "GAP", trust: "DERIVED", text: `US market ${stock.session === "CLOSED" ? "closed" : "in extended hours"}, onchain pair still trading. The Core watches the gap to the open.` });
  }
  if (market?.curveProgress != null && !market.graduated) {
    const thr = market.graduationThreshold;
    obs.push({
      k: "CURVE",
      trust: "VERIFIED",
      text: `Bonding curve ${(market.curveProgress * 100).toFixed(1)}% filled${thr != null ? ` · graduates at ${thr.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${quote.symbol}${stock?.price != null ? ` (≈ ${usd(thr * stock.price)})` : ""}` : ""}.`,
    });
  }
  if (market?.graduated)
    obs.push({
      k: "POOL",
      trust: "VERIFIED",
      text: market.protocol.startsWith("PONS")
        ? `Graduated: curve sold out, liquidity locked for good in a Uniswap v4 pool against ${quote.symbol}.`
        : `Trades in a Uniswap v4 pool against ${quote.symbol}.`,
    });
  if (market?.creatorTaxBps)
    obs.push({ k: "FEES", trust: "VERIFIED", text: `Creator tax ${(market.creatorTaxBps / 100).toFixed(1)}%${market.curveFeeBps != null ? ` + curve fee ${(market.curveFeeBps / 100).toFixed(1)}%` : ""}, paid in ${quote.symbol}.` });

  return {
    token: {
      address: input.token,
      name: name!,
      symbol: symbol!,
      launchpad: input.launchpad ?? market?.protocol ?? "?",
      txHash: input.txHash ?? null,
      launchedAt: input.launchedAt ?? null,
    },
    quote,
    stock,
    market,
    priceUsd,
    state: obs.length >= 4 ? "OBSERVING" : "BORN",
    observations: obs,
    builtAt: new Date().toISOString(),
  };
}

// ── discovery: recent launches priced in a tokenized stock ──────────────────────
/** Robinhood stock tokens on mainnet (4663) used as discovery seeds; the list of pairs itself is read live. */
export const STOCK_SEEDS: Record<string, string> = {
  NVDA: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
  TSLA: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d",
  SPCX: "0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa",
};


export interface DiscoveredPair {
  token: string;
  symbol: string | null;
  quoteSymbol: string;
  quoteAddress: string;
  protocol: string;
  phase: string | null;
  curveProgress: number | null;
}

/**
 * Find recent Pons curves holding a stock token: stock-token transfer counterparties
 * (alchemy_getAssetTransfers, Alchemy RPC only) → curve.token() → shrine pairToken check.
 */
export async function discoverRecentPairs(rpc: string, opts: { perStock?: number; onCheck?: (n: number) => void } = {}): Promise<DiscoveredPair[]> {
  const parties = new Set<string>();
  for (const addr of Object.values(STOCK_SEEDS)) {
    const r = await rpcReq<{ transfers: { from: string; to: string }[] }>(rpc, "alchemy_getAssetTransfers", [
      { fromBlock: "0x0", toBlock: "latest", contractAddresses: [addr], category: ["erc20"], maxCount: "0x" + (opts.perStock ?? 400).toString(16), order: "desc" },
    ]);
    for (const t of r?.transfers ?? []) {
      if (t.from) parties.add(t.from.toLowerCase());
      if (t.to) parties.add(t.to.toLowerCase());
    }
  }
  const tokens = new Set<string>();
  const list = [...parties];
  let checked = 0;
  for (let i = 0; i < list.length; i += 8) {
    await Promise.all(
      list.slice(i, i + 8).map(async (a) => {
        const r = await rpcCall(rpc, a, "0xfc0c546a"); // token()
        if (r && r.length === 66 && BigInt(r) !== BigInt(0)) tokens.add("0x" + r.slice(-40));
        opts.onCheck?.(++checked);
      }),
    );
  }
  const out: DiscoveredPair[] = [];
  for (const t of tokens) {
    try {
      const j = await shrineToken(t);
      if (!j) continue;
      const pt = j.pairToken as string | undefined;
      if (!pt || pt === "ETH" || !String(j.protocol).startsWith("PONS")) continue;
      const q = await resolveQuote(rpc, pt);
      if (q.kind !== "stock") continue;
      const [st, sym] = await Promise.all([getTokenState(t, q.decimals), rpcCall(rpc, t, "0x95d89b41")]);
      out.push({ token: t, symbol: decodeString(sym), quoteSymbol: q.symbol, quoteAddress: pt, protocol: String(j.protocol), phase: (j.phase as string) ?? null, curveProgress: st?.curveProgress ?? null });
    } catch {
      /* skip */
    }
  }
  return out.sort((a, b) => (b.curveProgress ?? 0) - (a.curveProgress ?? 0));
}

export { usd as formatUsd };
