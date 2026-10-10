"use client";

// PHASE 02 · R&D — Pair Core lab UI. Two markets, one Mind: the stock the token is priced in,
// and the onchain token itself. Data: /api/lab/pair-core (server) + the public launch stream (WS).
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import { TrustTag } from "@/components/Trust";
import type { DiscoveredPair, LaunchEvent, PairCore } from "@/lib/pair-core/core";
import { EXPLORER, SHRINE_WS, launchpadOf } from "@/lib/pair-core/core";

const EASE = [0.16, 1, 0.3, 1] as const;
const LIFE = ["Born", "Observe", "Research", "Remember", "Understand", "Evolve"];
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const usd = (n: number) => (n >= 1 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${n.toPrecision(3)}`);
const KNOWN_STOCKS: Record<string, string> = {
  "0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec": "NVDA",
  "0x322f0929c4625ed5bad873c95208d54e1c003b2d": "TSLA",
  "0x4a0e65a3eccec6dbe60ae065f2e7bb85fae35eea": "SPCX",
};

interface StreamRow { id: string; t: string; pad: string; symbol: string; quote: string; paired: boolean }

const KNOWN: Record<string, { symbol: string; stock: boolean }> = {
  "0x5fc5360d0400a0fd4f2af552add042d716f1d168": { symbol: "USDG", stock: false },
  "0x0bd7d308f8e1639fab988df18a8011f41eacad73": { symbol: "WETH", stock: false },
  ...Object.fromEntries(Object.entries(KNOWN_STOCKS).map(([a, s]) => [a, { symbol: s, stock: true }])),
};

/** What a launch is priced in. Unknown assets are identified once on the server (ERC-20 name/symbol). */
async function quoteOf(e: LaunchEvent): Promise<{ symbol: string; stock: boolean }> {
  const z = "0x0000000000000000000000000000000000000000";
  const q = e.pairToken ?? (e.currency0 && e.currency1 ? (e.currency0.toLowerCase() === e.token.toLowerCase() ? e.currency1 : e.currency0) : "ETH");
  if (!q || q === "ETH" || q.toLowerCase() === z) return { symbol: "ETH", stock: false };
  const k = q.toLowerCase();
  if (KNOWN[k]) return KNOWN[k];
  try {
    const j = (await (await fetch(`/api/lab/pair-core?quote=${q}`)).json()) as { quote?: { symbol: string; kind: string } };
    KNOWN[k] = j.quote ? { symbol: j.quote.symbol, stock: j.quote.kind === "stock" } : { symbol: short(q), stock: false };
  } catch {
    KNOWN[k] = { symbol: short(q), stock: false };
  }
  return KNOWN[k];
}

function useLaunchStream() {
  const [rows, setRows] = useState<StreamRow[]>([]);
  const [live, setLive] = useState(false);
  useEffect(() => {
    let ws: WebSocket | null = null;
    let stop = false;
    const open = () => {
      ws = new WebSocket(SHRINE_WS);
      ws.onopen = () => setLive(true);
      ws.onclose = () => { setLive(false); if (!stop) setTimeout(open, 2500); };
      ws.onmessage = async (m) => {
        let e: LaunchEvent;
        try { e = JSON.parse(String(m.data)); } catch { return; }
        if (!e.token) return;
        const q = await quoteOf(e);
        const row: StreamRow = {
          id: e.type + e.txHash + e.token,
          t: new Date(e.timestamp * 1000).toISOString().slice(11, 19),
          pad: launchpadOf(e).replace("UNISWAP v4", "UNI v4"),
          symbol: e.symbol,
          quote: q.symbol,
          paired: q.stock,
        };
        setRows((r) => [row, ...r.filter((x) => x.id !== row.id)].slice(0, 9));
      };
    };
    open();
    return () => { stop = true; ws?.close(); };
  }, []);
  return { rows, live };
}

export function PairCoreLab() {
  const [pairs, setPairs] = useState<DiscoveredPair[] | null>(null);
  const [cores, setCores] = useState<Record<string, PairCore>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [loadingCore, setLoadingCore] = useState(false);
  const { rows, live } = useLaunchStream();
  const requested = useRef(new Set<string>());

  useEffect(() => {
    let alive = true;
    fetch("/api/lab/pair-core")
      .then((r) => r.json())
      .then((j: { pairs: DiscoveredPair[]; cores: PairCore[] }) => {
        if (!alive) return;
        setPairs(j.pairs ?? []);
        const map: Record<string, PairCore> = {};
        for (const c of j.cores ?? []) map[c.token.address.toLowerCase()] = c;
        setCores(map);
        if (j.cores?.[0]) setSel(j.cores[0].token.address.toLowerCase());
      })
      .catch(() => alive && setPairs([]));
    return () => { alive = false; };
  }, []);

  const select = useCallback((token: string) => {
    const k = token.toLowerCase();
    setSel(k);
    if (cores[k] || requested.current.has(k)) return;
    requested.current.add(k);
    setLoadingCore(true);
    fetch(`/api/lab/pair-core?token=${token}`)
      .then((r) => r.json())
      .then((j: { core?: PairCore }) => { if (j.core) setCores((m) => ({ ...m, [k]: j.core! })); })
      .finally(() => setLoadingCore(false));
  }, [cores]);

  const core = sel ? cores[sel] : undefined;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
            <span className="rounded-full px-2.5 py-1 text-strategy ring-1 ring-inset ring-strategy/50">Lab · Phase 02</span>
            <span className="rounded-full px-2.5 py-1 text-ink-3 ring-1 ring-inset ring-line-2">R&amp;D preview · not live</span>
          </div>
          <h1 className="mt-5 text-4xl font-light tracking-tight md:text-6xl">
            Pair <span className="editorial-accent">Core.</span>
          </h1>
          <p className="mt-3 max-w-xl font-body text-ink-2">
            Every qualifying stock-paired token gets its own Mind. One asset, two markets: the stock it is priced in, and the token onchain.
          </p>
        </div>
        <div className="font-mono text-[11px] leading-relaxed text-ink-3">
          <div>Robinhood Chain · 4663</div>
          <div>Pons v2 · stock-paired launches</div>
          <div>{pairs ? `${pairs.length} found` : "scanning…"}</div>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* left: stream + pairs */}
        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-card/60 p-4 backdrop-blur">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
              <span className="text-ink-2">Launch stream</span>
              <span className={clsx("flex items-center gap-1.5", live ? "text-mint" : "text-ink-3")}>
                <span className={clsx("size-1.5 rounded-full", live ? "animate-pulse bg-mint" : "bg-ink-3")} />
                {live ? "live" : "connecting"}
              </span>
            </div>
            <ul className="mt-3 min-h-[180px] space-y-1 font-mono text-[11px]">
              <AnimatePresence initial={false}>
                {rows.map((r) => (
                  <motion.li key={r.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: EASE }}
                    className={clsx("grid grid-cols-[58px_52px_1fr_auto] gap-2 rounded px-1.5 py-1", r.paired ? "bg-strategy/10 text-ink" : "text-ink-3")}>
                    <span>{r.t}</span>
                    <span className="truncate">{r.pad}</span>
                    <span className="truncate">${r.symbol}</span>
                    <span className={r.paired ? "text-core" : ""}>{r.quote}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {rows.length === 0 && <li className="pt-6 text-center text-ink-3">waiting for the next launch…</li>}
            </ul>
            <p className="mt-3 border-t border-line pt-3 font-body text-[11px] leading-relaxed text-ink-3">
              Every launchpad on the chain. Launches priced in a tokenized stock are highlighted and get a Core.
            </p>
          </section>

          <section className="rounded-xl border border-line bg-card/60 p-4 backdrop-blur">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">Stock-paired launches</div>
            <ul className="mt-3 space-y-1">
              {(pairs ?? []).slice(0, 12).map((p) => {
                const k = p.token.toLowerCase();
                const c = cores[k];
                return (
                  <li key={k}>
                    <button type="button" onClick={() => select(p.token)}
                      className={clsx("grid w-full grid-cols-[1fr_auto_64px] items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                        sel === k ? "bg-core/12 ring-1 ring-inset ring-core/40" : "hover:bg-card")}>
                      <span className="truncate font-body text-sm text-ink">{c ? "$" + c.token.symbol : p.symbol ? "$" + p.symbol : short(p.token)}</span>
                      <span className="font-mono text-[10px] text-core">{p.quoteSymbol}</span>
                      <span className="h-1 overflow-hidden rounded-full bg-line-2">
                        <span className="block h-full bg-strategy" style={{ width: `${Math.max(2, (p.curveProgress ?? 0) * 100)}%` }} />
                      </span>
                    </button>
                  </li>
                );
              })}
              {pairs === null && Array.from({ length: 5 }).map((_, i) => <li key={i} className="h-9 animate-pulse rounded-md bg-card" />)}
            </ul>
          </section>
        </div>

        {/* main: the Core */}
        <AnimatePresence mode="wait">
          {core ? <CorePanel key={core.token.address} core={core} /> : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[520px] place-items-center rounded-xl border border-dashed border-line-2 font-mono text-xs text-ink-3">
              {loadingCore || pairs === null ? "Initializing Core…" : "Select a stock-paired launch"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CorePanel({ core }: { core: PairCore }) {
  const s = core.stock, m = core.market;
  const reached = core.state === "OBSERVING" ? 2 : 1;
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.6, ease: EASE }}
      className="relative overflow-hidden rounded-xl border border-line bg-card/60 backdrop-blur">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-core)_22%,transparent),transparent)]" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Pair Core</span>
          <span className="text-lg text-ink">${core.token.symbol}</span>
          <span className="font-body text-sm text-ink-3">{core.token.name}</span>
        </div>
        <span className="flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mint ring-1 ring-inset ring-mint/40">
          <span className="size-1.5 animate-pulse rounded-full bg-mint" /> Mind · {core.state}
        </span>
      </div>

      <div className="grid gap-0 xl:grid-cols-[1fr_300px]">
        {/* two markets */}
        <div className="p-4 sm:p-6">
          <Market side="STOCK" accent="core" delay={0.1}
            title={s ? s.ticker : "—"} sub={s?.company ?? "Underlying unavailable"}
            right={s?.price != null ? (
              <div className="flex items-baseline gap-3 sm:block sm:text-right">
                <div className="text-2xl font-light text-ink">{usd(s.price)}</div>
                {s.changePct != null && <div className={clsx("font-mono text-xs", s.changePct >= 0 ? "text-mint" : "text-danger")}>{s.changePct >= 0 ? "+" : ""}{s.changePct.toFixed(2)}%</div>}
              </div>
            ) : null}
            foot={s ? <>US session <span className={s.session === "REGULAR" ? "text-mint" : "text-warn"}>{s.session}</span> · Yahoo quote</> : null}
          />

          <div className="relative my-1 flex h-20 items-center pl-10">
            <svg className="absolute left-[38px] top-0 h-full w-2" viewBox="0 0 2 80" preserveAspectRatio="none">
              <line x1="1" y1="0" x2="1" y2="80" stroke="var(--color-line-2)" strokeWidth="2" />
              <motion.line x1="1" y1="0" x2="1" y2="80" stroke="var(--color-core)" strokeWidth="2" strokeDasharray="6 10"
                animate={{ strokeDashoffset: [0, -32] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
            </svg>
            <div className="ml-8 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
              priced in <span className="text-core">{core.quote.symbol}</span> · one asset, two markets
            </div>
          </div>

          <Market side="TOKEN" accent="strategy" delay={0.25}
            title={`$${core.token.symbol}`} sub={`${(m?.protocol ?? "").replace("_", " ").toLowerCase()} · ${short(core.token.address)}`}
            right={core.priceUsd != null ? (
              <div className="flex items-baseline gap-3 sm:block sm:text-right">
                <div className="text-2xl font-light text-ink">${core.priceUsd.toPrecision(3)}</div>
                <div className="font-mono text-[10px] text-ink-3">per token · derived</div>
              </div>
            ) : null}
            foot={m?.graduated ? (
              <div className="flex items-center justify-between">
                <span>graduated · uniswap v4 pool vs {core.quote.symbol}</span>
                <span className="text-mint">liquidity locked</span>
              </div>
            ) : m?.curveProgress != null ? (
              <div>
                <div className="flex flex-wrap justify-between gap-x-3 font-mono text-[10px] text-ink-3">
                  <span>bonding curve</span>
                  <span className="text-ink-2">{(m.curveProgress * 100).toFixed(1)}%{m.graduationThreshold ? ` · graduates at ${m.graduationThreshold} ${core.quote.symbol}` : ""}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-2">
                  <motion.div className="h-full bg-gradient-to-r from-strategy/70 to-strategy" initial={{ width: 0 }} animate={{ width: `${Math.max(1, m.curveProgress * 100)}%` }} transition={{ duration: 1.4, delay: 0.5, ease: EASE }} />
                </div>
              </div>
            ) : null}
          />

          {/* lifecycle */}
          <div className="mt-8 flex flex-wrap items-center gap-x-1.5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em]">
            {LIFE.map((l, i) => (
              <motion.span key={l} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.12 }}
                className={clsx("flex items-center gap-2", i < reached ? "text-mint" : "text-ink-3")}>
                <span className={clsx("size-2 rounded-full", i < reached ? "bg-mint" : "ring-1 ring-ink-3")} />
                {l}
                {i < LIFE.length - 1 && <span className="h-px w-2.5 bg-line-2" />}
              </motion.span>
            ))}
          </div>
        </div>

        {/* observations */}
        <div className="border-t border-line p-6 xl:border-l xl:border-t-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">First observations</div>
          <ul className="mt-4 space-y-4">
            {core.observations.map((o, i) => (
              <motion.li key={o.k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.22, duration: 0.5, ease: EASE }}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-ink-3">{o.k}</span>
                  <TrustTag kind={o.trust} />
                </div>
                <p className="mt-1.5 font-body text-[13px] leading-relaxed text-ink-2">{o.text}</p>
              </motion.li>
            ))}
          </ul>
          <a href={`${EXPLORER}/token/${core.token.address}`} target="_blank" rel="noopener noreferrer"
            className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 hover:text-ink">
            View token on Blockscout ↗
          </a>
        </div>
      </div>
    </motion.section>
  );
}

function Market({ side, accent, title, sub, right, foot, delay }: {
  side: string; accent: "core" | "strategy"; title: string; sub: string; right: React.ReactNode; foot: React.ReactNode; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.6, ease: EASE }}
      className={clsx("rounded-lg border bg-paper/60 p-5", accent === "core" ? "border-core/35" : "border-strategy/35")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className={clsx("grid size-12 shrink-0 place-items-center rounded-full font-mono text-[10px] ring-1", accent === "core" ? "text-core ring-core/50" : "text-strategy ring-strategy/50")}>{side}</span>
          <div className="min-w-0">
            <div className="truncate text-2xl font-light text-ink">{title}</div>
            <div className="truncate font-body text-sm text-ink-3">{sub}</div>
          </div>
        </div>
        {right}
      </div>
      {foot && <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{foot}</div>}
    </motion.div>
  );
}
