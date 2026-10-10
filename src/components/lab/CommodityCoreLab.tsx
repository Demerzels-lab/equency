"use client";

// PHASE 04 · R&D — Commodity Core lab UI: the commodity underneath (futures) on the left, its
// tokenized forms (Robinhood Chain ETF token + Ethereum gold-backed tokens) on the right.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { TrustTag } from "@/components/Trust";
import type { Commodity, CommodityCore } from "@/lib/commodity-core/core";

const EASE = [0.16, 1, 0.3, 1] as const;
const LIST: Commodity[] = ["GOLD", "SILVER", "OIL"];
const usd = (n: number) => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
const num = (n: number, d = 2) => n.toLocaleString("en-US", { maximumFractionDigits: d });
const Pct = ({ p }: { p: number | null }) => (p == null ? null : <span className={p >= 0 ? "text-mint" : "text-[#ff5470]"}>{p >= 0 ? "+" : ""}{p.toFixed(2)}%</span>);

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 border-b border-line py-2.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{k}</span>
      <span className="font-mono text-sm text-ink">{children}</span>
    </div>
  );
}

export function CommodityCoreLab() {
  const [sel, setSel] = useState<Commodity>("GOLD");
  const [cores, setCores] = useState<Partial<Record<Commodity, CommodityCore | null>>>({});

  useEffect(() => {
    if (sel in cores) return;
    let alive = true;
    fetch(`/api/lab/commodity-core?c=${sel}`)
      .then((r) => r.json())
      .then((j: { core: CommodityCore | null }) => alive && setCores((m) => ({ ...m, [sel]: j.core })))
      .catch(() => alive && setCores((m) => ({ ...m, [sel]: null })));
    return () => { alive = false; };
  }, [sel, cores]);

  const c = cores[sel];

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8">
      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
        <span className="rounded-full px-2.5 py-1 text-strategy ring-1 ring-inset ring-strategy/50">Lab · Phase 04</span>
        <span className="rounded-full px-2.5 py-1 text-ink-3 ring-1 ring-inset ring-line-2">R&amp;D · roadmap · conditional</span>
      </div>
      <h1 className="mt-5 text-4xl font-light tracking-tight md:text-6xl">
        Commodity <span className="editorial-accent">Core.</span>
      </h1>
      <p className="mt-3 max-w-xl font-body text-ink-2">A tokenized commodity gets its own Intelligence Core: the commodity underneath, and every token that represents it, read as one asset.</p>

      <div className="mt-8 flex gap-2">
        {LIST.map((k) => (
          <button key={k} type="button" onClick={() => setSel(k)}
            className={clsx("rounded-full px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] ring-1 ring-inset transition-colors",
              sel === k ? "bg-strategy/15 text-ink ring-strategy/60" : "text-ink-2 ring-line-2 hover:bg-card")}>
            {k}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {c === undefined ? (
          <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 h-80 animate-pulse rounded-xl bg-card/60" />
        ) : c === null ? (
          <p key="err" className="mt-8 font-body text-ink-3">Sources unavailable right now.</p>
        ) : (
          <motion.div key={sel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}
            className="mt-8 grid gap-6 lg:grid-cols-[1fr_120px_1.3fr] lg:items-center">
            <section className="rounded-xl border border-line bg-card/60 p-5 backdrop-blur">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-strategy">Underlying · {c.underlying.name}</div>
              <div className="mt-4 text-4xl font-light">{c.underlying.price != null ? `$${num(c.underlying.price)}` : "—"}<span className="ml-2 text-base text-ink-3">/{c.underlying.unit}</span></div>
              <div className="mt-1 font-mono text-sm"><Pct p={c.underlying.changePct} /> <span className="text-ink-3">· futures {c.underlying.future}</span></div>
              {c.etf.unitsPerShare != null && <Row k="1 share">{c.etf.symbol} ≈ {c.etf.unitsPerShare.toFixed(4)} {c.underlying.unit}</Row>}
            </section>

            <div className="hidden place-items-center lg:grid">
              <div className="grid size-24 place-items-center rounded-full border border-strategy/70 bg-bg font-mono text-[11px] tracking-[0.25em] text-strategy shadow-[0_0_48px_rgba(255,106,51,0.35)]">CORE</div>
            </div>

            <section className="space-y-4">
              <div className="rounded-xl border border-line bg-card/60 p-5 backdrop-blur">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-core">Robinhood Chain · {c.etf.fund}</div>
                <Row k="token">{c.etf.symbol} <span className="text-ink-3">{c.etf.onchain.token.slice(0, 10)}…</span></Row>
                <Row k="onchain">{c.etf.onchain.supply != null ? `${num(c.etf.onchain.supply)} shares` : "—"}{c.etf.onchain.supply != null && c.etf.price ? <span className="text-ink-3"> ≈ {usd(c.etf.onchain.supply * c.etf.price)}</span> : null}</Row>
                <Row k="defi">{c.etf.onchain.contractCounterparties} contracts route or hold it</Row>
              </div>
              {c.backed.length > 0 && (
                <div className="rounded-xl border border-line bg-card/60 p-5 backdrop-blur">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">Ethereum · 1 token = 1 troy oz</div>
                  {c.backed.map((b) => (
                    <Row key={b.symbol} k={b.symbol}>
                      {b.supply != null ? `${num(b.supply, 0)} oz` : "—"} <span className="text-ink-3">{b.marketCapUsd ? `≈ ${usd(b.marketCapUsd)} · ` : ""}vs futures</span> <Pct p={b.premiumPct} />
                    </Row>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-line bg-card/60 p-5 backdrop-blur lg:col-span-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">Observations</div>
              <ul className="mt-3 space-y-2">
                {c.observations.map((o, i) => (
                  <li key={i} className="flex items-start gap-3 font-body text-sm text-ink">
                    <TrustTag kind={o.trust} className="mt-0.5 shrink-0" /> {o.text}
                  </li>
                ))}
              </ul>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
