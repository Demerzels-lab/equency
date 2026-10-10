// PHASE 01 · R&D — Token Core: one Mind for a newly tokenized stock, reading BOTH sides:
// the underlying company (SEC EDGAR + exchange quote) and its onchain representation on
// Robinhood Chain (4663). Self-contained (no "@/…", no "server-only") so the Next route
// (/api/lab/token-core) and the terminal tool (scripts/token-core.mts) share it.
// Sources, all live: Alchemy RPC (eth_call, alchemy_getAssetTransfers), SEC EDGAR, Yahoo chart.
// Nothing is simulated; anything we cannot read stays null and is shown as unavailable.

export const EXPLORER = "https://robinhoodchain.blockscout.com";
/** Robinhood's stock-token minter: every tokenized stock is first minted to this address. */
export const STOCK_MINTER = "0xcfaece2151502da2a21d47234ae1f08618a60a94";
/** EIP-1967 beacon slot: Robinhood stock tokens are BeaconProxies sharing one implementation. */
const BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
const SEC_UA = { "User-Agent": "EQUENCY research admin@ailesh.plus", Accept: "application/json" };
const DAY = 86_400_000;

// ── JSON-RPC ────────────────────────────────────────────────────────────────────
async function rpcReq<T>(rpc: string, method: string, params: unknown[]): Promise<T | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as { result?: T; error?: { code?: number } };
      if (res.status !== 429 && j.error?.code !== 429) return j.result ?? null;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
  }
  return null;
}
const ethCall = async (rpc: string, to: string, data: string) => {
  const r = await rpcReq<string>(rpc, "eth_call", [{ to, data }, "latest"]);
  return r && r !== "0x" ? r : null;
};
function decodeString(hex: string | null): string | null {
  if (!hex) return null;
  const h = hex.slice(2);
  try {
    if (h.length === 64) return Buffer.from(h, "hex").toString("utf8").replace(/\0+$/, "");
    const len = parseInt(h.slice(64, 128), 16);
    return Buffer.from(h.slice(128, 128 + len * 2), "hex").toString("utf8");
  } catch {
    return null;
  }
}

interface Transfer { from: string; to: string; value: number | null; blockNum: string; hash: string; rawContract: { address: string }; asset: string | null; metadata?: { blockTimestamp: string } }
async function transfers(rpc: string, q: Record<string, unknown>): Promise<{ transfers: Transfer[]; pageKey?: string }> {
  const r = await rpcReq<{ transfers: Transfer[]; pageKey?: string }>(rpc, "alchemy_getAssetTransfers", [
    { fromBlock: "0x0", toBlock: "latest", category: ["erc20"], withMetadata: true, ...q },
  ]);
  return r ?? { transfers: [] };
}

// ── discovery: which stocks were tokenized recently ─────────────────────────────
export interface Tokenization {
  token: string;
  symbol: string;
  company: string;
  /** first mint to the Robinhood minter = the day the stock entered the onchain economy */
  tokenizedAt: string;
  tokenizedDay: number;
  /** days since the company's first US trade; ≤ 365 = the underlying is newly public */
  listedDays: number | null;
}

/** Robinhood token name "<Company> • Robinhood Token" → "<Company>" (share-class noise stripped). */
export const companyOf = (name: string) =>
  name
    .replace(/\s*•\s*Robinhood Token\s*$/i, "")
    .replace(/\s+(Class [A-Z]\b.*|Common Stock.*|Ordinary Shares.*|American Depositary.*)$/i, "")
    .replace(/,?\s+(Corp\.?|Corporation|Inc\.?|Ltd\.?|plc|N\.V\.|Holdings)$/i, "")
    .trim();

async function firstMint(rpc: string, token: string): Promise<string | null> {
  const r = await transfers(rpc, { fromAddress: "0x0000000000000000000000000000000000000000", contractAddresses: [token], maxCount: "0x1", order: "asc" });
  return r.transfers[0]?.metadata?.blockTimestamp ?? null;
}

/**
 * Every tokenized stock, newest first. Walk the minter's mints (newest-first) until no new token
 * shows up for a while, then date each token by its FIRST-ever mint and flag companies that are
 * themselves newly public (first US trade ≤ 365 days, exchange data).
 */
export async function discoverTokenizations(rpc: string, opts: { maxPages?: number; onStep?: (s: string) => void } = {}): Promise<Tokenization[]> {
  const seen = new Set<string>();
  let key: string | undefined;
  let scanned = 0, idle = 0;
  for (let p = 0; p < (opts.maxPages ?? 40) && idle < 6; p++) {
    const r = await transfers(rpc, { fromAddress: "0x0000000000000000000000000000000000000000", toAddress: STOCK_MINTER, maxCount: "0x3e8", order: "desc", ...(key ? { pageKey: key } : {}) });
    const before = seen.size;
    for (const t of r.transfers) seen.add(t.rawContract.address.toLowerCase());
    idle = seen.size === before ? idle + 1 : 0;
    scanned += r.transfers.length;
    opts.onStep?.(`${scanned.toLocaleString("en-US")} mints scanned · ${seen.size} stock tokens`);
    key = r.pageKey;
    if (!key) break;
  }
  const out: Tokenization[] = [];
  const list = [...seen];
  for (let i = 0; i < list.length; i += 6) {
    await Promise.all(
      list.slice(i, i + 6).map(async (token) => {
        const [at, n, s] = await Promise.all([firstMint(rpc, token), ethCall(rpc, token, "0x06fdde03"), ethCall(rpc, token, "0x95d89b41")]);
        const name = decodeString(n) ?? "";
        const symbol = decodeString(s) ?? "";
        if (!at || !/robinhood token/i.test(name) || !/^[A-Z][A-Z.]{0,5}$/.test(symbol)) return;
        out.push({ token, symbol, company: companyOf(name), tokenizedAt: at, tokenizedDay: Math.floor((Date.now() - Date.parse(at)) / DAY), listedDays: null });
      }),
    );
    opts.onStep?.(`dating first mints · ${Math.min(i + 6, list.length)}/${list.length}`);
  }
  // newly public underlyings (Yahoo firstTradeDate), 8 at a time
  for (let i = 0; i < out.length; i += 8) {
    await Promise.all(out.slice(i, i + 8).map(async (t) => { t.listedDays = await listedDaysOf(t.symbol, t.company); }));
    opts.onStep?.(`checking listing age · ${Math.min(i + 8, out.length)}/${out.length}`);
  }
  return out.sort((a, b) => a.tokenizedDay - b.tokenizedDay || a.symbol.localeCompare(b.symbol));
}

async function listedDaysOf(ticker: string, company: string): Promise<number | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`, { headers: { "user-agent": "Mozilla/5.0 EQUENCY research" }, cache: "no-store" });
    const m = ((await res.json()) as { chart?: { result?: { meta?: Record<string, unknown> }[] } }).chart?.result?.[0]?.meta;
    if (!m || typeof m.firstTradeDate !== "number" || m.instrumentType !== "EQUITY") return null;
    const yName = String(m.longName ?? m.shortName ?? "").toLowerCase();
    const first = company.toLowerCase().split(/[\s,.]+/)[0];
    if (yName && first && !yName.includes(first)) return null;
    return Math.floor((Date.now() / 1000 - m.firstTradeDate) / 86_400);
  } catch {
    return null;
  }
}

/** Resolve a ticker (e.g. "SPCX") to its stock token by scanning the minter's recent mints. */
export async function findStockToken(rpc: string, ticker: string): Promise<string | null> {
  let key: string | undefined;
  for (let p = 0; p < 6; p++) {
    const r = await transfers(rpc, { fromAddress: "0x0000000000000000000000000000000000000000", toAddress: STOCK_MINTER, maxCount: "0x3e8", order: "desc", ...(key ? { pageKey: key } : {}) });
    const hit = r.transfers.find((t) => (t.asset ?? "").toUpperCase() === ticker.toUpperCase());
    if (hit) return hit.rawContract.address;
    key = r.pageKey;
    if (!key) break;
  }
  return null;
}

// ── company side ────────────────────────────────────────────────────────────────
export interface CompanySide {
  ticker: string;
  name: string;
  cik: string | null;
  price: number | null;
  changePct: number | null;
  session: "REGULAR" | "PRE" | "POST" | "CLOSED";
  listedDays: number | null; // days since the first US trade
  exchange: string | null;
  latestFilings: { form: string; date: string }[];
  ipoProspectus: string | null; // date of the 424B4, if the company is newly public
}

let tickerMap: Record<string, { cik_str: number; ticker: string; title: string }> | null = null;

async function secJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: SEC_UA, cache: "no-store" });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function getCompanySide(ticker: string, company: string): Promise<CompanySide> {
  const out: CompanySide = { ticker, name: company, cik: null, price: null, changePct: null, session: "CLOSED", listedDays: null, exchange: null, latestFilings: [], ipoProspectus: null };
  // exchange quote
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=5m&includePrePost=true`, { headers: { "user-agent": "Mozilla/5.0 EQUENCY research" }, cache: "no-store" });
    const m = ((await res.json()) as { chart?: { result?: { meta?: Record<string, unknown> }[] } }).chart?.result?.[0]?.meta;
    const yName = String(m?.longName ?? m?.shortName ?? "").toLowerCase();
    const first = company.toLowerCase().split(/[\s,.]+/)[0];
    if (m && (!yName || !first || yName.includes(first))) {
      const price = typeof m.regularMarketPrice === "number" ? m.regularMarketPrice : null;
      const prev = typeof m.chartPreviousClose === "number" ? m.chartPreviousClose : null;
      out.price = price;
      out.changePct = price != null && prev ? ((price - prev) / prev) * 100 : null;
      out.exchange = typeof m.fullExchangeName === "string" ? m.fullExchangeName : null;
      if (typeof m.firstTradeDate === "number") out.listedDays = Math.floor((Date.now() / 1000 - m.firstTradeDate) / 86_400);
      const p = m.currentTradingPeriod as Record<string, { start: number; end: number }> | undefined;
      const now = Date.now() / 1000;
      if (p) {
        if (now >= p.regular.start && now < p.regular.end) out.session = "REGULAR";
        else if (now >= p.pre.start && now < p.pre.end) out.session = "PRE";
        else if (now >= p.post.start && now < p.post.end) out.session = "POST";
      }
    }
  } catch {
    /* quote stays null */
  }
  // SEC EDGAR
  tickerMap ??= await secJson("https://www.sec.gov/files/company_tickers.json");
  const hit = tickerMap ? Object.values(tickerMap).find((x) => x.ticker?.toUpperCase() === ticker.toUpperCase()) : undefined;
  if (hit) {
    out.cik = String(hit.cik_str).padStart(10, "0");
    out.name = hit.title || company;
    const sub = await secJson<{ filings?: { recent?: { form: string[]; filingDate: string[] } } }>(`https://data.sec.gov/submissions/CIK${out.cik}.json`);
    const rec = sub?.filings?.recent;
    if (rec) {
      out.latestFilings = rec.form.slice(0, 4).map((form, i) => ({ form, date: rec.filingDate[i] }));
      const idx = rec.form.lastIndexOf("424B4");
      if (idx >= 0) {
        const d = rec.filingDate[idx];
        if (Date.now() - Date.parse(d) < 400 * DAY) out.ipoProspectus = d;
      }
    }
  }
  return out;
}

// ── onchain side ────────────────────────────────────────────────────────────────
export interface OnchainSide {
  token: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: number | null; // shares represented onchain
  tokenizedAt: string | null;
  tokenizedDay: number | null;
  beacon: string | null; // shared Robinhood implementation beacon
  /** activity over the most recent `sampled` transfers, spanning `sampleHours` */
  sampleHours: number | null;
  activeWallets: number;
  contractCounterparties: number; // pools / curves / vaults touching the token (from recent transfers)
  sampled: number; // how many recent transfers were read
  lastTransfer: string | null;
}

export async function getOnchainSide(rpc: string, token: string): Promise<OnchainSide> {
  const [n, s, d, ts, beaconRaw, mint, recent] = await Promise.all([
    ethCall(rpc, token, "0x06fdde03"),
    ethCall(rpc, token, "0x95d89b41"),
    ethCall(rpc, token, "0x313ce567"),
    ethCall(rpc, token, "0x18160ddd"),
    rpcReq<string>(rpc, "eth_getStorageAt", [token, BEACON_SLOT, "latest"]),
    firstMint(rpc, token),
    transfers(rpc, { contractAddresses: [token], maxCount: "0x3e8", order: "desc" }),
  ]);
  const decimals = d ? parseInt(d, 16) : 18;
  const now = Date.now();
  const list = recent.transfers;
  const oldest = list.at(-1)?.metadata?.blockTimestamp;
  const sampleHours = oldest ? Math.max(0.01, (now - Date.parse(oldest)) / 3_600_000) : null;
  const wallets = new Set<string>();
  for (const t of list) for (const a of [t.from, t.to]) if (a) wallets.add(a.toLowerCase());
  wallets.delete("0x0000000000000000000000000000000000000000");
  wallets.delete(STOCK_MINTER);
  // which counterparties are contracts (pools, curves, vaults…)
  const parties = [...new Set(list.flatMap((t) => [t.from, t.to]).filter(Boolean).map((a) => a.toLowerCase()))].filter((a) => !/^0x0{40}$/.test(a.slice(2)) && a !== STOCK_MINTER).slice(0, 120);
  let contracts = 0;
  for (let i = 0; i < parties.length; i += 10) {
    const codes = await Promise.all(parties.slice(i, i + 10).map((a) => rpcReq<string>(rpc, "eth_getCode", [a, "latest"])));
    contracts += codes.filter((c) => c && c.length > 2).length;
  }
  const beacon = beaconRaw && BigInt(beaconRaw) !== BigInt(0) ? "0x" + beaconRaw.slice(-40) : null;
  return {
    token,
    symbol: decodeString(s) ?? "?",
    name: decodeString(n) ?? "?",
    decimals,
    supply: ts ? Number(BigInt(ts)) / 10 ** decimals : null,
    tokenizedAt: mint,
    tokenizedDay: mint ? Math.floor((now - Date.parse(mint)) / DAY) : null,
    beacon,
    sampleHours,
    activeWallets: wallets.size,
    contractCounterparties: contracts,
    sampled: list.length,
    lastTransfer: list[0]?.metadata?.blockTimestamp ?? null,
  };
}

// ── the Core ───────────────────────────────────────────────────────────────────
export interface Observation { k: string; text: string; trust: "VERIFIED" | "DERIVED" }
export interface TokenCore {
  company: CompanySide;
  onchain: OnchainSide;
  onchainValueUsd: number | null;
  state: "BORN" | "OBSERVING";
  observations: Observation[];
  builtAt: string;
}

const usd = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(2)}`);
const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0 });
export { usd as formatUsd, num as formatNum };

export async function buildTokenCore(rpc: string, input: { token?: string; ticker?: string }): Promise<TokenCore | null> {
  const token = input.token ?? (input.ticker ? await findStockToken(rpc, input.ticker) : null);
  if (!token) return null;
  const onchain = await getOnchainSide(rpc, token);
  const company = await getCompanySide(onchain.symbol, companyOf(onchain.name));
  const value = onchain.supply != null && company.price != null ? onchain.supply * company.price : null;

  const obs: Observation[] = [];
  if (onchain.tokenizedDay != null) obs.push({ k: "BORN", trust: "VERIFIED", text: `Tokenized ${onchain.tokenizedDay === 0 ? "today" : `${onchain.tokenizedDay} days ago`}: first ${onchain.symbol} minted on Robinhood Chain ${onchain.tokenizedAt!.slice(0, 10)}.` });
  if (company.listedDays != null) {
    obs.push(
      company.listedDays <= 365
        ? { k: "ROOT", trust: "VERIFIED", text: `The company itself is newly public: first US trade ${company.listedDays} days ago${company.ipoProspectus ? `, IPO prospectus filed ${company.ipoProspectus}` : ""}.` }
        : { k: "ROOT", trust: "VERIFIED", text: `Public for ${Math.round(company.listedDays / 365)}+ years; onchain it is ${onchain.tokenizedDay ?? "?"} days old.` },
    );
  }
  if (company.listedDays != null && onchain.tokenizedDay != null && company.listedDays <= 365) {
    const lag = company.listedDays - onchain.tokenizedDay;
    if (lag >= 0) obs.push({ k: "BRIDGE", trust: "DERIVED", text: `Reached Robinhood Chain ${lag === 0 ? "the same day as" : `${lag} day${lag === 1 ? "" : "s"} after`} its US debut.` });
  }
  if (onchain.supply != null)
    obs.push({ k: "SUPPLY", trust: value != null ? "DERIVED" : "VERIFIED", text: `${num(onchain.supply)} shares live onchain${value != null ? ` ≈ ${usd(value)} at the ${company.session === "REGULAR" ? "live" : "last"} US price` : ""}.` });
  if (onchain.sampled > 0 && onchain.sampleHours != null) {
    const span = onchain.sampleHours < 1 ? `${Math.round(onchain.sampleHours * 60)} min` : onchain.sampleHours < 48 ? `${onchain.sampleHours.toFixed(1)} h` : `${Math.round(onchain.sampleHours / 24)} days`;
    obs.push({ k: "FLOW", trust: "VERIFIED", text: `Last ${num(onchain.sampled)} transfers happened in ${span}, across ${num(onchain.activeWallets)} wallets.` });
  }
  if (onchain.contractCounterparties > 0) obs.push({ k: "DEFI", trust: "DERIVED", text: `${onchain.contractCounterparties} contracts already hold or route it: pools, curves or vaults.` });
  if (company.latestFilings[0]) obs.push({ k: "SEC", trust: "VERIFIED", text: `Latest filing ${company.latestFilings[0].form} on ${company.latestFilings[0].date} (SEC EDGAR).` });
  if (company.session !== "REGULAR") obs.push({ k: "GAP", trust: "DERIVED", text: `US session ${company.session.toLowerCase()}; the token keeps moving. The Core watches both clocks.` });

  return { company, onchain, onchainValueUsd: value, state: obs.length >= 4 ? "OBSERVING" : "BORN", observations: obs, builtAt: new Date().toISOString() };
}
