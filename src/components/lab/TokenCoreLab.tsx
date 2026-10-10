"use client";

// PHASE 01 · R&D — Token Core lab UI: one Core, two sides of one asset. The underlying company
// (SEC EDGAR + exchange) on the left, its Robinhood Chain token on the right, bridged by the Core.
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { TrustTag } from "@/components/Trust";
import type { TokenCore, Tokenization } from "@/lib/token-core/core";
import { EXPLORER } from "@/lib/token-core/core";

const EASE = [0.16, 1, 0.3, 1] as const;
const LIFE = ["Born", "Observe", "Research", "Remember", "Understand", "Evolve"];
const usd = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(2)}`);
const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0 });
const isNewlyPublic = (t: Tokenization) => t.listedDays != null && t.listedDays <= 365;

export function TokenCoreLab() {
  const [list, setList] = useState<Tokenization[] | null>(null);
  const [cores, setCores] = useState<Record<string, TokenCore>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requested = useRef(new Set<string>());

  const load = useCallback((ticker: string) => {
    setSel(ticker);
    if (requested.current.has(ticker)) return;
    requested.current.add(ticker);
    setLoading(true);
    fetch(`/api/lab/token-core?ticker=${ticker}`)
      .then((r) => r.json())
      .then((j: { core?: TokenCore | null }) => { if (j.core) setCores((m) => ({ ...m, [ticker]: j.core! })); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/lab/token-core")
      .then((r) => r.json())
      .then((j: { list: Tokenization[] }) => {
        if (!alive) return;
        const l = j.list ?? [];
        setList(l);
        const first = l.filter(isNewlyPublic).sort((a, b) => a.listedDays! - b.listedDays!)[0];
        if (first) load(first.symbol);
      })
      .catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [load]);

  const bridge = (list ?? []).filter(isNewlyPublic).sort((a, b) => a.listedDays! - b.listedDays!);
  const newest = (list ?? []).filter((t) => !isNewlyPublic(t)).slice(0, 8);
  const age = list?.length ? Math.max(...list.map((t) => t.tokenizedDay)) : null;
  const core = sel ? cores[sel] : undefined;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
            <span className="rounded-full px-2.5 py-1 text-core ring-1 ring-inset ring-core/50">Lab · Phase 01</span>
            <span className="rounded-full px-2.5 py-1 text-ink-3 ring-1 ring-inset ring-line-2">Preview · in development</span>
          </div>
          <h1 className="mt-5 text-4xl font-light tracking-tight md:text-6xl">
            Token <span className="editorial-accent">Core.</span>
          </h1>
          <p className="mt-3 max-w-xl font-body text-ink-2">
            Every newly tokenized stock gets its own Intelligence Core: the company underneath, and the token onchain, read as one asset.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 font-mono">
          {[
            [list ? String(list.length) : "…", "stocks tokenized"],
            [age != null ? `${age}d` : "…", "onchain economy"],
            [list ? String(bridge.length) : "…", "newly public"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-light text-ink">{v}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-ink-3">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-card/60 p-4 backdrop-blur">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">Newly public × newly tokenized</div>
            <ul className="mt-3 space-y-1">
              {bridge.map((t) => (
                <li key={t.token}>
                  <button type="button" onClick={() => load(t.symbol)}
                    className={clsx("grid w-full grid-cols-[52px_1fr_auto] items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
                      sel === t.symbol ? "bg-core/12 ring-1 ring-inset ring-core/40" : "hover:bg-card")}>
                    <span className="font-mono text-xs font-semibold text-core">{t.symbol}</span>
                    <span className="truncate font-body text-sm text-ink">{t.company}</span>
                    <span className={clsx("font-mono text-[10px]", t.listedDays! - t.tokenizedDay <= 7 ? "text-mint" : "text-ink-3")}>+{t.listedDays! - t.tokenizedDay}d</span>
                  </button>
                </li>
              ))}
              {list === null && Array.from({ length: 5 }).map((_, i) => <li key={i} className="h-9 animate-pulse rounded-md bg-card" />)}
            </ul>
            <p className="mt-3 border-t border-line pt-3 font-body text-[11px] leading-relaxed text-ink-3">+Nd = days from the US IPO to the first mint on Robinhood Chain.</p>
          </section>

          <section className="rounded-xl border border-line bg-card/60 p-4 backdrop-blur">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">Newest tokenizations</div>
            <ul className="mt-3 space-y-0.5">
              {newest.map((t) => (
                <li key={t.token}>
                  <button type="button" onClick={() => load(t.symbol)}
                    className={clsx("grid w-full grid-cols-[52px_1fr_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                      sel === t.symbol ? "bg-core/12 ring-1 ring-inset ring-core/40" : "hover:bg-card")}>
                    <span className="font-mono text-xs text-ink-2">{t.symbol}</span>
                    <span className="truncate font-body text-[13px] text-ink-2">{t.company}</span>
                    <span className="font-mono text-[10px] text-ink-3">Day {t.tokenizedDay}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <AnimatePresence mode="wait">
          {core ? <CorePanel key={core.onchain.token} core={core} /> : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[520px] place-items-center rounded-xl border border-dashed border-line-2 font-mono text-xs text-ink-3">
              {loading || list === null ? "Initializing Core…" : "Select a tokenized stock"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/70 py-2.5 last:border-0">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{k}</span>
      <span className="min-w-0 text-right font-body text-sm text-ink">{children}</span>
    </div>
  );
}

function CorePanel({ core }: { core: TokenCore }) {
  const c = core.company, o = core.onchain;
  const reached = core.state === "OBSERVING" ? 2 : 1;
  const lag = c.listedDays != null && o.tokenizedDay != null ? c.listedDays - o.tokenizedDay : null;
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.6, ease: EASE }}
      className="relative overflow-hidden rounded-xl border border-line bg-card/60 backdrop-blur">
      <div className="pointer-events-none absolute left-1/2 top-24 size-80 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-core)_20%,transparent),transparent)]" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Token Core</span>
          <span className="text-lg text-ink">{o.symbol}</span>
          <span className="truncate font-body text-sm text-ink-3">{c.name}</span>
        </div>
        <span className="flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mint ring-1 ring-inset ring-mint/40">
          <span className="size-1.5 animate-pulse rounded-full bg-mint" /> Core · {core.state}
        </span>
      </div>

      {/* two sides, one Core */}
      <div className="relative grid gap-4 p-4 sm:p-6 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-0">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
          className="rounded-lg border border-core/30 bg-paper/60 p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-core">Company · underlying</div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-light text-ink">{c.price != null ? usd(c.price) : "—"}</span>
            {c.changePct != null && <span className={clsx("font-mono text-xs", c.changePct >= 0 ? "text-mint" : "text-danger")}>{c.changePct >= 0 ? "+" : ""}{c.changePct.toFixed(2)}%</span>}
          </div>
          <div className="mt-3">
            <Row k="Listed">{c.listedDays != null ? `Day ${c.listedDays}` : "—"}<span className="text-ink-3">{c.exchange ? ` · ${c.exchange}` : ""}</span></Row>
            <Row k="IPO prospectus">{c.ipoProspectus ?? <span className="text-ink-3">—</span>}</Row>
            <Row k="SEC filings">{c.latestFilings.length ? c.latestFilings.slice(0, 3).map((f) => f.form).join(" · ") : <span className="text-ink-3">not an SEC registrant</span>}</Row>
            <Row k="US session"><span className={c.session === "REGULAR" ? "text-mint" : "text-warn"}>{c.session}</span></Row>
          </div>
        </motion.div>

        {/* bridge */}
        <div className="relative flex items-center justify-center md:w-24">
          <svg className="absolute inset-0 hidden h-full w-full md:block" preserveAspectRatio="none" viewBox="0 0 96 100">
            <line x1="0" y1="50" x2="96" y2="50" stroke="var(--color-line-2)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
            <motion.line x1="0" y1="50" x2="96" y2="50" stroke="var(--color-core)" strokeWidth="1.5" strokeDasharray="5 9" vectorEffect="non-scaling-stroke"
              animate={{ strokeDashoffset: [0, -28] }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }} />
          </svg>
          <div className="relative z-10 grid size-16 place-items-center rounded-full bg-paper ring-1 ring-core/60 shadow-[0_0_40px_-6px_var(--color-core)]">
            <div className="text-center font-mono leading-tight">
              <div className="text-[9px] tracking-[0.18em] text-ink-3">CORE</div>
              {lag != null && lag >= 0 && <div className="text-[11px] text-mint">+{lag}d</div>}
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.6, ease: EASE }}
          className="rounded-lg border border-[color:var(--color-core)]/30 bg-paper/60 p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8ea0ff]">Onchain · Robinhood Chain</div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-light text-ink">{o.supply != null ? num(o.supply) : "—"}</span>
            <span className="font-mono text-xs text-ink-3">shares onchain{core.onchainValueUsd != null ? ` ≈ ${usd(core.onchainValueUsd)}` : ""}</span>
          </div>
          <div className="mt-3">
            <Row k="Tokenized">{o.tokenizedDay != null ? `Day ${o.tokenizedDay}` : "—"}<span className="text-ink-3">{o.tokenizedAt ? ` · ${o.tokenizedAt.slice(0, 10)}` : ""}</span></Row>
            <Row k="Flow">{num(o.sampled)} transfers<span className="text-ink-3">{o.sampleHours != null ? ` / ${o.sampleHours < 48 ? o.sampleHours.toFixed(1) + " h" : Math.round(o.sampleHours / 24) + " d"}` : ""}</span></Row>
            <Row k="Wallets">{num(o.activeWallets)}</Row>
            <Row k="DeFi">{o.contractCounterparties} contracts</Row>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 border-t border-line px-6 py-4 font-mono text-[10px] uppercase tracking-[0.1em]">
        {LIFE.map((l, i) => (
          <motion.span key={l} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }} className={clsx("flex items-center gap-2", i < reached ? "text-core" : "text-ink-3")}>
            <span className={clsx("size-2 rotate-45", i < reached ? "bg-core" : "ring-1 ring-ink-3")} />
            {l}
            {i < LIFE.length - 1 && <span className="h-px w-2.5 bg-line-2" />}
          </motion.span>
        ))}
      </div>

      <div className="border-t border-line p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">First observations</div>
        <ul className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
          {core.observations.map((ob, i) => (
            <motion.li key={ob.k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.15, duration: 0.5, ease: EASE }}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-[0.16em] text-ink-3">{ob.k}</span>
                <TrustTag kind={ob.trust} />
              </div>
              <p className="mt-1.5 font-body text-[13px] leading-relaxed text-ink-2">{ob.text}</p>
            </motion.li>
          ))}
        </ul>
        <a href={`${EXPLORER}/token/${o.token}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 hover:text-ink">
          View token on Blockscout ↗
        </a>
      </div>
    </motion.section>
  );
}
