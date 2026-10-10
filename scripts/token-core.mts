/**
 * pnpm token-core [TICKER] [--fast] [--refresh]
 *
 * PHASE 01 · R&D — Token Core prototype. Every newly tokenized stock gets its own Intelligence
 * Core that reads both sides of the asset: the underlying company (SEC EDGAR + exchange quote)
 * and its onchain representation on Robinhood Chain (supply, flow, DeFi touchpoints).
 * 1) scans every stock Robinhood has tokenized and dates it by its first mint,
 * 2) bridges them to the newly public universe, 3) initializes one Core (default SKHY).
 * All live and read-only (Alchemy RPC, SEC EDGAR, Yahoo). The scan is cached 6 h (--refresh).
 */
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { EXPLORER, buildTokenCore, discoverTokenizations, formatNum, formatUsd, type TokenCore, type Tokenization } from "../src/lib/token-core/core.ts";

const argv = process.argv.slice(2);
const flag = (k: string) => argv.includes(k);
const FAST = flag("--fast");
const TICKER = (argv.find((a) => !a.startsWith("--")) ?? "SKHY").toUpperCase();
const RPC: string = process.env.RH_RPC_MAINNET || JSON.parse(readFileSync(resolve("deployments/robinhood-chain.verified.json"), "utf8")).chains.mainnet.rpcAlchemy;

// ── palette (EQUENCY tokens) ────────────────────────────────────────────────────
const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const fg = (h: string) => (s: string) => { const [r, g, b] = rgb(h); return `\x1b[38;2;${r};${g};${b}m${s}\x1b[0m`; };
const core = fg("#5470ff"), coreSoft = fg("#8ea0ff"), strat = fg("#ff6a33"), mint = fg("#2fe0a2"), ink = fg("#eef1fa"), ink2 = fg("#aab3c9"), ink3 = fg("#6c7590"), line = fg("#283149"), warn = fg("#f5b83d");
const bold = (s: string) => `\x1b[1m${s}\x1b[22m`;
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - strip(s).length));
const padL = (s: string, n: number) => " ".repeat(Math.max(0, n - strip(s).length)) + s;
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
function grad(s: string, a = "#5470ff", b = "#8ea0ff") {
  const A = rgb(a), B = rgb(b);
  return [...s].map((c, i) => { const t = s.length > 1 ? i / (s.length - 1) : 0; const m = A.map((v, k) => Math.round(v + (B[k] - v) * t)); return `\x1b[38;2;${m[0]};${m[1]};${m[2]}m${c}`; }).join("") + "\x1b[0m";
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, FAST ? 0 : ms));
const out = (s = "") => process.stdout.write(s + "\n");
async function type(s: string, cps = 110) {
  if (FAST) return out(s);
  for (const p of s.split(/(\x1b\[[0-9;]*m)/)) {
    if (p.startsWith("\x1b")) { process.stdout.write(p); continue; }
    for (const ch of p) { process.stdout.write(ch); await sleep(1000 / cps); }
  }
  process.stdout.write("\n");
}
const SPIN = ["◐", "◓", "◑", "◒"];
async function task<T>(label: string, fn: (set: (s: string) => void) => Promise<T>, done: (v: T) => string): Promise<T> {
  let extra = "", i = 0;
  const t = FAST ? null : setInterval(() => process.stdout.write(`\r\x1b[2K  ${core(SPIN[i++ % SPIN.length])} ${pad(ink2(label), 12)}${ink3(extra)}`), 90);
  const v = await fn((s) => { extra = s; });
  if (t) clearInterval(t);
  process.stdout.write(`\r\x1b[2K  ${core("■")} ${pad(ink(label), 12)}${done(v)}\n`);
  return v;
}
const W = 122;
const rule = (label = "") => out("  " + (label ? ink3(label + " ") + line("─".repeat(W - strip(label).length - 1)) : line("─".repeat(W))));

// ── 1 · header ──────────────────────────────────────────────────────────────────
out();
out("  " + grad("E Q U E N C Y") + ink3("   ▸ lab ▸ ") + ink("phase-01") + ink3(" / ") + coreSoft("token-core"));
rule();
await type("  " + ink2("Every newly tokenized stock gets its own Intelligence Core.") + ink3("  · company + onchain · R&D build · not live"));
out();

await task("chain", async () => {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }) });
  return parseInt(((await r.json()) as { result: string }).result, 16);
}, (b) => ink2("Robinhood Chain 4663") + ink3(" · block ") + ink(b.toLocaleString("en-US")));

// ── 2 · scan every tokenized stock (cached) ─────────────────────────────────────
const CACHE = resolve(".next/cache/token-core-discover.json");
let age: number | null = null;
try { age = Date.now() - statSync(CACHE).mtimeMs; } catch {}
const fresh = !flag("--refresh") && age != null && age < 6 * 3_600_000;
const all: Tokenization[] = await task("tokenized", async (set) => {
  if (fresh) {
    const cached = JSON.parse(readFileSync(CACHE, "utf8")) as Tokenization[];
    for (let k = 0; k <= 10; k++) { set(`minter mints → first mint per token · ${Math.round((cached.length * k) / 10)}/${cached.length}`); await sleep(160); }
    return cached;
  }
  const r = await discoverTokenizations(RPC, { onStep: set });
  try { mkdirSync(resolve(".next/cache"), { recursive: true }); writeFileSync(CACHE, JSON.stringify(r)); } catch {}
  return r;
}, (l) => ink(`${l.length}`) + ink3(" stocks tokenized by Robinhood · onchain economy ") + ink(`${Math.max(...l.map((x) => x.tokenizedDay))} days`) + ink3(" old"));
const bridge = all.filter((t) => t.listedDays != null && t.listedDays <= 365).sort((a, b) => a.listedDays! - b.listedDays!);
await task("bridge", async () => { await sleep(700); return bridge; }, (b) => ink(`${b.length}`) + ink3(" are ALSO newly public companies → they get a Core on both sides"));
out();

// newest tokenizations
rule("NEWEST TOKENIZATIONS");
const newest = all.slice(0, 6);
for (const t of newest) {
  out(`  ${core(pad(t.symbol, 6))} ${ink2(pad(cut(t.company, 34), 35))} ${ink3("onchain")} ${ink(padL(`Day ${t.tokenizedDay}`, 8))}   ${ink3(t.tokenizedAt.slice(0, 10))}`);
  await sleep(110);
}
out();
rule("NEWLY PUBLIC × NEWLY TOKENIZED");
out(`  ${ink3(pad("", 6))} ${ink3(pad("company", 35))} ${ink3(padL("IPO", 8))}  ${ink3(padL("onchain", 9))}  ${ink3("reached the chain")}`);
for (const t of bridge) {
  const lag = t.listedDays! - t.tokenizedDay;
  const hl = t.symbol === TICKER;
  out(`  ${(hl ? strat : core)(pad(t.symbol, 6))} ${(hl ? ink : ink2)(pad(cut(t.company, 34), 35))} ${ink(padL(`Day ${t.listedDays}`, 8))}  ${ink(padL(`Day ${t.tokenizedDay}`, 9))}  ${lag <= 7 ? mint(`${lag}d after IPO`) : ink2(`${lag}d after IPO`)}${hl ? strat("  ◂ initialize") : ""}`);
  await sleep(140);
}
out();

// ── 3 · initialize one Core ─────────────────────────────────────────────────────
const c = (await task("initialize", (set) => { set(`$${TICKER} · reading SEC EDGAR + exchange + Robinhood Chain`); return buildTokenCore(RPC, { ticker: TICKER }); },
  (c) => (c ? ink("$" + c.onchain.symbol) + ink3(" · Core ") + mint(c.state) : warn("not a Robinhood stock token")))) as TokenCore | null;
out();
if (!c) process.exit(1);

const L = 58, R = W - L - 5;
const top = `┌─ ${bold(ink("TOKEN CORE"))} ${ink3("·")} ${ink(c.onchain.symbol)} ${ink3("·")} ${ink2(cut(c.company.name, 40))} `;
out("  " + top.replace(/^┌─/, line("┌─")) + line("─".repeat(Math.max(2, W - strip(top).length - 1)) + "┐"));
const two = (a: string, b: string) => out("  " + line("│") + " " + pad(a, L) + line(" │ ") + pad(b, R) + line("│"));
const one = (a: string) => out("  " + line("│") + " " + pad(a, W - 3) + line("│"));
const cm = c.company, oc = c.onchain;
two(core("COMPANY") + ink3("  · underlying"), coreSoft("ONCHAIN") + ink3("  · Robinhood Chain representation"));
two("", "");
const rowsL = [
  [ink3("price"), cm.price != null ? ink(formatUsd(cm.price)) + " " + (cm.changePct != null ? (cm.changePct >= 0 ? mint : fg("#ff5470"))(`${cm.changePct >= 0 ? "+" : ""}${cm.changePct.toFixed(2)}%`) : "") : ink3("unavailable")],
  [ink3("listed"), cm.listedDays != null ? ink(`Day ${cm.listedDays}`) + ink3(` · ${cm.exchange ?? "US"}`) : ink3("—")],
  [ink3("sec cik"), cm.cik ? ink2(cm.cik) : ink3("not an SEC registrant")],
  [ink3("filings"), cm.latestFilings.length ? ink2(cm.latestFilings.slice(0, 3).map((f) => `${f.form} ${f.date.slice(5)}`).join(" · ")) : ink3("—")],
  [ink3("session"), cm.session === "REGULAR" ? mint(cm.session) : warn(cm.session)],
];
const rowsR = [
  [ink3("token"), ink2(`${oc.token.slice(0, 8)}…${oc.token.slice(-6)}`) + ink3(" · beacon proxy")],
  [ink3("born"), oc.tokenizedDay != null ? ink(`Day ${oc.tokenizedDay}`) + ink3(` · first mint ${oc.tokenizedAt!.slice(0, 10)}`) : ink3("—")],
  [ink3("supply"), oc.supply != null ? ink(`${formatNum(oc.supply)} shares`) + (c.onchainValueUsd != null ? ink3(" ≈ ") + ink(formatUsd(c.onchainValueUsd)) : "") : ink3("—")],
  [ink3("flow"), ink(`${formatNum(oc.sampled)} transfers`) + ink3(oc.sampleHours != null ? ` / ${oc.sampleHours < 48 ? oc.sampleHours.toFixed(1) + " h" : Math.round(oc.sampleHours / 24) + " d"} · ${formatNum(oc.activeWallets)} wallets` : "")],
  [ink3("defi"), ink(`${oc.contractCounterparties}`) + ink3(" contracts route or hold it")],
];
for (let i = 0; i < 5; i++) { two(pad(rowsL[i][0], 10) + rowsL[i][1], pad(rowsR[i][0], 10) + rowsR[i][1]); await sleep(170); }
two("", "");
out("  " + line("├" + "─".repeat(W - 2) + "┤"));
const steps = ["BORN", "OBSERVE", "RESEARCH", "REMEMBER", "UNDERSTAND", "EVOLVE"];
const reached = c.state === "OBSERVING" ? 2 : 1;
one(steps.map((s, i) => (i < reached ? core("◆ " + s) : ink3("◇ " + s))).join(ink3("  ")));
out("  " + line("├" + "─".repeat(W - 2) + "┤"));
for (const o of c.observations) {
  const tag = o.trust === "VERIFIED" ? mint("VERIFIED") : core("DERIVED ");
  const head = `${ink3(pad(o.k, 7))} ${tag}  `;
  const room = W - 3 - strip(head).length;
  const txt = cut(o.text, room);
  process.stdout.write("  " + line("│") + " " + head);
  if (FAST) process.stdout.write(ink(txt));
  else for (const ch of txt) { process.stdout.write(ink(ch)); await sleep(8); }
  process.stdout.write(" ".repeat(Math.max(0, room - txt.length)) + line("│") + "\n");
  await sleep(120);
}
out("  " + line("└" + "─".repeat(W - 2) + "┘"));
out("  " + ink3(`  ${EXPLORER}/token/${oc.token}`));
out();
out("  " + grad("phase-01 / token-core") + ink3("  · prototype · company + onchain intelligence"));
out();
process.exit(0);
