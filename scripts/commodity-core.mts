/**
 * pnpm commodity-core [GOLD|SILVER|OIL] [--fast]
 *
 * PHASE 04 · R&D (Roadmap · conditional) — Commodity Core prototype. A tokenized commodity gets
 * its own Intelligence Core reading both sides: the underlying commodity (futures) and its
 * tokenized forms — commodity-ETF tokens on Robinhood Chain and gold-backed tokens on Ethereum.
 * All live and read-only (Yahoo, Alchemy RPC). Nothing is simulated.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildCommodityCore, RH_COMMODITY_TOKENS, UNDERLYING, type Commodity } from "../src/lib/commodity-core/core.ts";

const argv = process.argv.slice(2);
const FAST = argv.includes("--fast");
const C = (argv.find((a) => !a.startsWith("--")) ?? "GOLD").toUpperCase() as Commodity;
if (!(C in UNDERLYING)) { console.error("usage: pnpm commodity-core [GOLD|SILVER|OIL]"); process.exit(1); }
const RPC: string = process.env.RH_RPC_MAINNET || JSON.parse(readFileSync(resolve("deployments/robinhood-chain.verified.json"), "utf8")).chains.mainnet.rpcAlchemy;

const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const fg = (h: string) => (s: string) => { const [r, g, b] = rgb(h); return `\x1b[38;2;${r};${g};${b}m${s}\x1b[0m`; };
const acc = fg("#f5b83d"), accSoft = fg("#ffd98a"), mint = fg("#2fe0a2"), red = fg("#ff5470"), ink = fg("#eef1fa"), ink2 = fg("#aab3c9"), ink3 = fg("#6c7590"), line = fg("#283149"), core = fg("#5470ff");
const bold = (s: string) => `\x1b[1m${s}\x1b[22m`;
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - strip(s).length));
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
function grad(s: string, a = "#f5b83d", b = "#ffd98a") {
  const A = rgb(a), B = rgb(b);
  return [...s].map((c, i) => { const t = s.length > 1 ? i / (s.length - 1) : 0; const m = A.map((v, k) => Math.round(v + (B[k] - v) * t)); return `\x1b[38;2;${m[0]};${m[1]};${m[2]}m${c}`; }).join("") + "\x1b[0m";
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, FAST ? 0 : ms));
const out = (s = "") => process.stdout.write(s + "\n");
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { maximumFractionDigits: d });
const usd = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${fmt(n)}`);
const pct = (p: number) => (p >= 0 ? mint : red)(`${p >= 0 ? "+" : ""}${p.toFixed(2)}%`);
const SPIN = ["◐", "◓", "◑", "◒"];
async function task<T>(label: string, fn: () => Promise<T>, done: (v: T) => string): Promise<T> {
  let i = 0;
  const t = FAST ? null : setInterval(() => process.stdout.write(`\r\x1b[2K  ${acc(SPIN[i++ % 4])} ${ink2(label)}`), 90);
  const v = await fn();
  if (t) clearInterval(t);
  process.stdout.write(`\r\x1b[2K  ${acc("■")} ${pad(ink(label), 12)}${done(v)}\n`);
  return v;
}
const W = 112;
const rule = (l = "") => out("  " + (l ? ink3(l + " ") + line("─".repeat(W - l.length - 1)) : line("─".repeat(W))));

out();
out("  " + grad("E Q U E N C Y") + ink3("   ▸ lab ▸ ") + ink("phase-04") + ink3(" / ") + accSoft("commodity-core"));
rule();
out("  " + ink2("A tokenized commodity gets its own Intelligence Core.") + ink3("  · underlying + token · R&D build · roadmap · conditional"));
out();
const c = await task("initialize", () => buildCommodityCore(RPC, C), (c) => ink(c.underlying.name) + ink3(" · underlying ") + ink(c.underlying.future) + ink3(" + ") + ink(`${1 + c.backed.length}`) + ink3(c.backed.length ? " tokenized forms" : " tokenized form"));
out();

const top = `┌─ ${bold(ink("COMMODITY CORE"))} ${ink3("·")} ${acc(C)} `;
out("  " + top.replace(/^┌─/, line("┌─")) + line("─".repeat(W - strip(top).length - 1) + "┐"));
const row = (a: string) => out("  " + line("│") + " " + pad(a, W - 3) + line("│"));
const u = c.underlying, e = c.etf;
row(acc("UNDERLYING") + ink3("  · the commodity itself"));
row(`${pad(ink3("futures"), 12)}${ink(u.future)} ${u.price != null ? ink(`$${fmt(u.price)}/${u.unit}`) : ink3("unavailable")} ${u.changePct != null ? pct(u.changePct) : ""}`);
await sleep(300);
row("");
row(core("ROBINHOOD CHAIN") + ink3(`  · ${e.fund} as a stock token`));
row(`${pad(ink3("token"), 12)}${ink(e.symbol)} ${ink2(cut(e.onchain.token, 12))}${ink3(" · beacon proxy")}  ${e.price != null ? ink(`$${fmt(e.price)}`) : ""}${e.unitsPerShare ? ink3(` ≈ ${e.unitsPerShare.toFixed(4)} ${u.unit}/share`) : ""}`);
row(`${pad(ink3("onchain"), 12)}${e.onchain.supply != null ? ink(`${fmt(e.onchain.supply)} shares`) : ink3("—")}${e.onchain.supply != null && e.price ? ink3(" ≈ ") + ink(usd(e.onchain.supply * e.price)) : ""}${ink3(` · born Day ${e.onchain.tokenizedDay ?? "?"} · ${e.onchain.contractCounterparties} DeFi contracts`)}`);
await sleep(300);
if (c.backed.length) {
  row("");
  row(accSoft("ETHEREUM") + ink3("  · gold-backed tokens, 1 token = 1 troy oz"));
  for (const b of c.backed) {
    row(`${pad(ink3(b.symbol), 12)}${pad(ink2(b.issuer), 9)}${b.supply != null ? ink(pad(`${fmt(b.supply, 0)} oz`, 14)) : ink3("—")}${b.marketCapUsd ? ink(pad(usd(b.marketCapUsd), 10)) : ""}${b.price != null ? ink3("price ") + ink(`$${fmt(b.price)}`) : ""}${b.premiumPct != null ? ink3("  vs futures ") + pct(b.premiumPct) : ""}`);
    await sleep(250);
  }
}
out("  " + line("├" + "─".repeat(W - 2) + "┤"));
for (const o of c.observations) {
  const head = `${ink3(pad(o.k, 8))} ${o.trust === "VERIFIED" ? mint("VERIFIED") : acc("DERIVED ")}  `;
  const room = W - 3 - strip(head).length;
  const txt = cut(o.text, room);
  process.stdout.write("  " + line("│") + " " + head);
  if (FAST) process.stdout.write(ink(txt)); else for (const ch of txt) { process.stdout.write(ink(ch)); await sleep(8); }
  process.stdout.write(" ".repeat(Math.max(0, room - txt.length)) + line("│") + "\n");
  await sleep(120);
}
out("  " + line("└" + "─".repeat(W - 2) + "┘"));
out();
out("  " + grad("phase-04 / commodity-core") + ink3(`  · prototype · ${Object.values(RH_COMMODITY_TOKENS).map((t) => t.symbol).join(" · ")} on Robinhood Chain · roadmap · conditional`));
out();
process.exit(0);
