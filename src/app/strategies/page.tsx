import Link from "next/link";
import { STRATEGY_LIST } from "@/lib/strategy/strategies";

export const metadata = { title: "Strategies · EQUENCY" };

export default function StrategiesPage() {
  return (
    <main className="page-main mx-auto max-w-[1240px] px-6 pt-28 sm:pt-32 pb-20">
      <div className="section-label">STRATEGY / DOWNSTREAM OF INTELLIGENCE</div>
      <h1 className="editorial-h2">
        Turn intelligence into <span className="editorial-accent">strategy.</span>
      </h1>
      <p className="editorial-lead mt-3 max-w-[60ch]">
        Build a strategy around the newly public companies your Intelligence Cores are researching. Each mode ranks
        every Core by rule-based fit · then you review the evidence, adjust the allocation and decide what reaches capital.
      </p>

      <div className="mt-12 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
        {STRATEGY_LIST.map((s, idx) => (
          <Link key={s.key} href={`/strategies/${s.key}`} className="block group">
            <div className="bg-[color:var(--color-panel)] py-8 px-6 sm:px-8 transition-all duration-200 hover:bg-[color:var(--color-panel-2)] relative">
              {/* Subtle tactile left accent indicator bar */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[color:var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[color:var(--color-accent)]">
                      0{idx + 1} {"//"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] transition-colors inline-flex items-center gap-2">
                      {s.name}
                      <span className="text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">→</span>
                    </h2>
                    <span className="font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)] border border-[color:var(--color-line)] bg-[color:var(--color-bg)] px-2.5 py-0.5 rounded-full">
                      {s.risk}
                    </span>
                  </div>
                  <p className="text-sm text-[color:var(--color-ink-dim)] leading-relaxed">
                    {s.tagline}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {s.focus.map((f) => (
                      <span
                        key={f}
                        className="font-mono text-[10px] tracking-wider uppercase border border-[color:var(--color-line)] bg-[color:var(--color-bg)] px-2.5 py-0.5 text-[color:var(--color-ink-dim)] rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tabular Quantitative Constraints */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-[color:var(--color-line)] font-mono text-right">
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--color-ink)] tabular-nums">{s.holdingPeriod}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)] mt-1">Holding Period</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--color-ink)] tabular-nums">{s.maxPositions}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)] mt-1">Max Positions</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--color-ink)] tabular-nums">{Math.round(s.maxPosition * 100)}%</div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)] mt-1">Max Size</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--color-accent)] tabular-nums">{Math.round(s.cashReserve * 100)}%</div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)] mt-1">Cash Buffer</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
