"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionMark, Display } from "@/components/brand";
import { Dot } from "@/components/primitives";
import { ago, fmtDate } from "@/lib/util/dates";
import { prefersReducedMotion } from "@/components/immersive/useEnvironment";
import type { IpoHit } from "@/lib/providers/sec";

// The agent loop (brief §10) — shown live, with a highlight travelling the cycle.
const LOOP = [
  { k: "OBSERVE", d: "price, volume, filings, event radar" },
  { k: "RESEARCH", d: "SEC, market, ownership, news" },
  { k: "CROSS-CHECK", d: "weight by source tier" },
  { k: "THINK", d: "deterministic score + reasoning" },
  { k: "UPDATE", d: "thesis, risks, catalysts" },
  { k: "EXPLAIN", d: "evidence-first · no chain-of-thought" },
  { k: "MONITOR", d: "re-run on the next filing" },
];

export function LiveFeed({ feed }: { feed: IpoHit[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => setActive((a) => (a + 1) % LOOP.length), 1300);
    return () => clearInterval(id);
  }, []);

  return (
    <section data-section="live" className="mx-auto max-w-350 px-6 py-24">
      <SectionMark n="01" title="Live intelligence, right now" className="mb-5" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* the agent loop, running */}
        <div className="min-w-0">
          <Display as="h2" outline className="text-[clamp(2rem,4.5vw,3.6rem)]">A LOOP THAT<br />NEVER STOPS</Display>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Every Intelligence Core runs this cycle continuously — triggered by new SEC filings and
            market events, not on a timer. The model narrates; it never sets the score.
          </p>
          <ul className="mono mt-6 flex flex-col gap-1 text-xs">
            {LOOP.map((s, i) => {
              const on = i === active;
              return (
                <li key={s.k} className="flex items-center gap-3 rounded-sm px-2 py-1.5 transition-colors duration-300" style={{ background: on ? "var(--color-panel-2)" : "transparent" }}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full transition-all" style={{ background: on ? "var(--color-accent)" : "var(--color-line-strong)", boxShadow: on ? "0 0 8px 2px color-mix(in oklab, var(--color-accent) 60%, transparent)" : "none" }} />
                  <span className="w-28 shrink-0 tracking-wide" style={{ color: on ? "var(--color-accent)" : "var(--color-ink-dim)" }}>{s.k}</span>
                  <span className="truncate text-muted-foreground">{s.d}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* the live detection console */}
        <div className="min-w-0 rounded-sm border border-border bg-card/70 backdrop-blur">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="label inline-flex items-center gap-2">
              <Dot color="var(--color-pos)" pulse /> Intelligence feed
            </span>
            <span className="label">{feed.length} detections · SEC 424B4</span>
          </div>
          <div className="divide-y divide-border">
            {feed.length === 0 && <div className="p-4 text-xs text-muted-foreground">No live detections resolved from SEC EDGAR right now.</div>}
            {feed.map((i) => (
              <Link key={i.cik} href={`/company/${i.ticker}`} className="rowlink flex items-center gap-3 px-4 py-3">
                <span className="mono min-w-13.5 text-xs text-muted-foreground">{ago(`${i.filedAt}T13:30:00Z`)}</span>
                <span className="mono min-w-14 text-sm" style={{ color: "var(--color-accent)" }}>{i.ticker}</span>
                <span className="flex-1 truncate text-sm">Intelligence Core initialized · {i.name}</span>
                <span className="label hidden sm:inline">{fmtDate(i.filedAt)}</span>
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <span className="eq-cursor mono text-sm text-[color:var(--color-accent)]">▍</span>
            <span className="label normal-case tracking-normal text-muted-foreground">monitoring EDGAR · awaiting the next 424B4</span>
          </div>
        </div>
      </div>
    </section>
  );
}
