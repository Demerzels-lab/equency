/**
 * pnpm pair-core [--fast] [--cores N] [--watch SECONDS] [--token 0x…]
 *
 * PHASE 02 · R&D — Pair Core prototype. Gives a token launched against a tokenized stock its
 * own Mind: finds real stock-paired Pons v2 launches on Robinhood Chain (4663), reads both
 * markets (the stock + the onchain token) and prints the Core's first observations.
 * Everything is fetched live (Alchemy RPC, shrine.trade launch feed, Yahoo quote). Read-only.
 *   --token   initialize one Core for a specific token
 *   --cores   how many discovered pairs to initialize (default 2)
 *   --watch   seconds of the live launch stream to show (default 14, 0 = skip)
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  SHRINE_WS, EXPLORER, buildPairCore, discoverRecentPairs, launchpadOf, quoteAddressOf, resolveQuote,
  formatUsd, type DiscoveredPair, type LaunchEvent, type PairCore,
} from "../src/lib/pair-core/core.ts";

const argv = process.argv.slice(2);
const flag = (k: string) => argv.includes(k);
const opt = (k: string, d: string) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const FAST = flag("--fast");
const CORES = Number(opt("--cores", "2"));
const WATCH = Number(opt("--watch", "14"));
const TOKEN = opt("--token", "");

const RPC: string = (() => {
  if (process.env.RH_RPC_MAINNET) return process.env.RH_RPC_MAINNET;
  return JSON.parse(readFileSync(resolve("deployments/robinhood-chain.verified.json"), "utf8")).chains.mainnet.rpcAlchemy;
})();

// ── palette (EQUENCY tokens) ────────────────────────────────────────────────────
const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const fg = (h: string) => (s: string) => { const [r, g, b] = rgb(h); return `\x1b[38;2;${r};${g};${b}m${s}\x1b[0m`; };
const core = fg("#5470ff"), strat = fg("#ff6a33"), mint = fg("#2fe0a2"), ink = fg("#eef1fa"), ink2 = fg("#aab3c9"), ink3 = fg("#6c7590"), line = fg("#283149"), warn = fg("#f5b83d");
const bold = (s: string) => `\x1b[1m${s}\x1b[22m`;
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - strip(s).length));
function grad(s: string, a = "#5470ff", b = "#ff6a33") {
  const A = rgb(a), B = rgb(b);
  return [...s].map((c, i) => { const t = s.length > 1 ? i / (s.length - 1) : 0; const m = A.map((v, k) => Math.round(v + (B[k] - v) * t)); return `\x1b[38;2;${m[0]};${m[1]};${m[2]}m${c}`; }).join("") + "\x1b[0m";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, FAST ? 0 : ms));
const out = (s = "") => process.stdout.write(s + "\n");
async function type(s: string, cps = 90) {
  if (FAST) return out(s);
  // type the visible text, keep ANSI codes intact
  const parts = s.split(/(\x1b\[[0-9;]*m)/);
  for (const p of parts) {
    if (p.startsWith("\x1b")) { process.stdout.write(p); continue; }
    for (const ch of p) { process.stdout.write(ch); await sleep(1000 / cps); }
  }
  process.stdout.write("\n");
}
const SPIN = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
async function task<T>(label: string, fn: (set: (s: string) => void) => Promise<T>, done: (v: T) => string): Promise<T> {
  let extra = "", i = 0;
  const draw = () => process.stdout.write(`\r\x1b[2K  ${core(SPIN[i++ % SPIN.length])} ${pad(ink2(label), 14)}${ink3(extra)}`);
  const t = FAST ? null : setInterval(draw, 80);
  const v = await fn((s) => { extra = s; });
  if (t) clearInterval(t);
  process.stdout.write(`\r\x1b[2K  ${mint("◆")} ${pad(ink(label), 14)}${done(v)}\n`);
  return v;
}
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const W = 122;

// ── header (slim rule, not a logo wall) ─────────────────────────────────────────
async function header() {
  out();
  out("  " + grad("E Q U E N C Y") + ink3("   ▸ lab ▸ ") + ink("phase-02") + ink3(" / ") + strat("pair-core"));
  out("  " + line("─".repeat(W)));
  await type("  " + ink2("Every qualifying stock-paired token gets its own Mind.") + ink3("  · R&D build · not live"), 120);
  out();
}

// ── a Core, rendered ────────────────────────────────────────────────────────────
function bar(p: number, n = 26) { const k = Math.round(p * n); return strat("█".repeat(k)) + line("░".repeat(n - k)); }

async function renderCore(c: PairCore, idx: number) {
  const s = c.stock, m = c.market;
  const top = `┌─ ${bold(ink("PAIR CORE"))} ${ink3("#" + String(idx).padStart(2, "0"))} ${ink3("·")} ${ink("$" + c.token.symbol)} `;
  out("  " + line(strip(top).length ? "" : "") + top.replace(/^┌─/, line("┌─")) + line("─".repeat(Math.max(2, W - strip(top).length - 1)) + "┐"));
  const row = (s: string) => out("  " + line("│") + " " + pad(s, W - 3) + line("│"));
  row("");
  const stockLine = s
    ? `${core("STOCK ")} ${bold(ink(s.ticker.padEnd(5)))} ${ink2(s.company.slice(0, 30).padEnd(30))} ${s.price != null ? ink(formatUsd(s.price)) : ink3("quote unavailable")} ${
        s.changePct != null ? (s.changePct >= 0 ? mint : fg("#ff5470"))(`${s.changePct >= 0 ? "+" : ""}${s.changePct.toFixed(2)}%`) : ""
      }   ${ink3("US session")} ${s.session === "REGULAR" ? mint(s.session) : warn(s.session)}`
    : ink3("STOCK  —");
  row(stockLine); await sleep(260);
  row(`${ink3("  ↕   ")} ${ink3("priced in")} ${core(c.quote.symbol)} ${ink3("· one asset, two markets")}`); await sleep(260);
  const prog = m?.curveProgress;
  row(`${strat("TOKEN ")} ${bold(ink(("$" + c.token.symbol).padEnd(10)))} ${ink2(c.token.name.slice(0, 18).padEnd(18))} ${ink3((m?.protocol ?? "").replace("_", " ").toLowerCase().padEnd(8))} ${
    m?.graduated ? bar(1) + " " + mint("GRADUATED") : prog != null ? bar(prog) + " " + ink(`${(prog * 100).toFixed(1)}% to graduation`) : ink3("pool")
  }`);
  row(`${" ".repeat(7)}${ink3(short(c.token.address))}${c.priceUsd != null ? ink3("  ·  ") + ink2(`≈ $${c.priceUsd.toPrecision(3)} / token`) : ""}${m?.graduationThreshold && !m.graduated ? ink3("  ·  graduates at ") + ink2(`${m.graduationThreshold} ${c.quote.symbol}`) : ""}`);
  row("");
  // lifecycle
  const steps = ["BORN", "OBSERVE", "RESEARCH", "REMEMBER", "UNDERSTAND", "EVOLVE"];
  const reached = c.state === "OBSERVING" ? 2 : 1;
  row(steps.map((st, i) => (i < reached ? mint("● " + st) : ink3("○ " + st))).join(ink3(" ─ ")));
  row("");
  out("  " + line("├" + "─".repeat(W - 2) + "┤"));
  for (const o of c.observations) {
    const tag = o.trust === "VERIFIED" ? mint("VERIFIED") : core("DERIVED ");
    const txt = `${ink3(o.k.padEnd(6))} ${tag}  `;
    process.stdout.write("  " + line("│") + " " + txt);
    const room = W - 3 - strip(txt).length;
    const words = o.text.length > room ? o.text.slice(0, room - 1) + "…" : o.text;
    if (FAST) process.stdout.write(ink(words));
    else for (const ch of words) { process.stdout.write(ink(ch)); await sleep(9); }
    process.stdout.write(" ".repeat(Math.max(0, room - words.length)) + line("│") + "\n");
    await sleep(140);
  }
  out("  " + line("└" + "─".repeat(W - 2) + "┘"));
  out("  " + ink3(`  ${EXPLORER}/token/${c.token.address}`));
  out();
}

// ── live stream ─────────────────────────────────────────────────────────────────
async function stream(seconds: number) {
  out("  " + ink3("LIVE  ") + ink2("Robinhood Chain launch stream") + ink3("  · every launchpad · filtering for stock pairs"));
  out("  " + line("─".repeat(W)));
  let seen = 0, paired = 0;
  await new Promise<void>((done) => {
    const ws = new WebSocket(SHRINE_WS);
    const end = setTimeout(() => { try { ws.close(); } catch {} done(); }, seconds * 1000);
    ws.onmessage = async (e) => {
      let ev: LaunchEvent;
      try { ev = JSON.parse(String(e.data)); } catch { return; }
      if (!ev.token) return;
      seen++;
      const q = await resolveQuote(RPC, quoteAddressOf(ev));
      const t = new Date(ev.timestamp * 1000).toISOString().slice(11, 19);
      const pad2 = launchpadOf(ev).padEnd(11);
      const sym = ("$" + (ev.symbol?.trim() || ev.name?.trim() || short(ev.token))).slice(0, 14).padEnd(15);
      if (q.kind === "stock") {
        paired++;
        out(`  ${ink3(t)}  ${strat(pad2)} ${bold(ink(sym))} ${ink3("priced in")} ${core(q.symbol.padEnd(5))} ${mint("→ initialize Core")}`);
      } else {
        out(`  ${ink3(t)}  ${ink3(pad2)} ${ink2(sym)} ${ink3("priced in")} ${ink3(q.symbol.padEnd(5))} ${ink3("· skip")}`);
      }
    };
    ws.onerror = () => { clearTimeout(end); done(); };
  });
  out("  " + line("─".repeat(W)));
  out("  " + ink3(`stream  ${seen} launches observed · ${paired} stock-paired`));
  out();
}

// ── main ────────────────────────────────────────────────────────────────────────
await header();

const block = await task("chain", async () => {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }) });
  return parseInt(((await r.json()) as { result: string }).result, 16);
}, (b) => ink2("Robinhood Chain 4663") + ink3(" · block ") + ink(b.toLocaleString("en-US")));
void block;

let targets: { token: string; quoteAddress?: string | null }[] = [];
if (TOKEN) {
  targets = [{ token: TOKEN }];
} else {
  // Discovery walks every stock-token counterparty (~40 s); reuse a result younger than 30 min.
  const CACHE = resolve(".next/cache/pair-core-discover.json");
  let age: number | null = null;
  try { age = Date.now() - statSync(CACHE).mtimeMs; } catch {}
  const fresh = !flag("--refresh") && age != null && age < 30 * 60_000;
  const pairs: DiscoveredPair[] = await task("discover", async (set) => {
    if (fresh) { set("stock-token counterparties → curves → pair check"); await sleep(1800); return JSON.parse(readFileSync(CACHE, "utf8")); }
    const r = await discoverRecentPairs(RPC, { perStock: 1000, onCheck: (n) => set(`stock-token counterparties checked: ${n}`) });
    try { mkdirSync(resolve(".next/cache"), { recursive: true }); writeFileSync(CACHE, JSON.stringify(r)); } catch {}
    return r;
  }, (p) => ink(`${p.length}`) + ink3(" Pons v2 launches priced in a tokenized stock ") + ink2(`(${[...new Set(p.map((x) => x.quoteSymbol))].join(" · ")})`) + (fresh ? ink3(` · scanned ${Math.round(age! / 60_000)}m ago`) : ""));
  // Show both lives of a stock-paired token: one still on its curve, one already graduated.
  const onCurve = pairs.filter((p) => p.phase !== "Graduated" && (p.curveProgress ?? 0) < 1);
  const grad = pairs.filter((p) => !onCurve.includes(p));
  const pick = [onCurve[0], grad[0], ...onCurve.slice(1), ...grad.slice(1)].filter(Boolean) as DiscoveredPair[];
  targets = pick.slice(0, CORES).map((p) => ({ token: p.token, quoteAddress: p.quoteAddress }));
}
out();

let i = 1;
for (const t of targets) {
  const c = await task("initialize", (set) => { set(short(t.token) + " · reading stock + token"); return buildPairCore(RPC, t); },
    (c) => ink("$" + c.token.symbol) + ink3(" · Mind ") + mint(c.state));
  out();
  await renderCore(c, i++);
  await sleep(500);
}

if (WATCH > 0 && !TOKEN) await stream(WATCH);
out("  " + grad("phase-02 / pair-core") + ink3("  · prototype · building toward the Pons ecosystem"));
out();
process.exit(0);
