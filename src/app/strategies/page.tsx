import Link from "next/link";
import { STRATEGY_LIST } from "@/lib/strategy/strategies";

export const metadata = { title: "Strategies · EQUENCY" };

export default function StrategiesPage() {
  return (
    <main className="mx-auto max-w-[1240px] px-6 pt-28 sm:pt-32 pb-20">
      <div className="section-label">01 / QUANTITATIVE ARCHITECTURE</div>
      <h1 className="editorial-h2">
        Deterministic <span className="editorial-accent">strategy models.</span>
      </h1>
      <p className="editorial-lead mt-3 max-w-[60ch]">
        Each mathematical model ranks the newly public universe by deterministic fit against each company&apos;s
        Intelligence Core. Select a strategy to inspect backtest parameters, allocation constraints, and on-chain execution.
      </p>

      <div className="mt-12 space-y-4">
        {STRATEGY_LIST.map((s, idx) => (
          <Link key={s.key} href={`/strategies/${s.key}`} className="block group">
            <div className="border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-6 sm:p-8 rounded-sm transition-all duration-150 hover:border-[color:var(--color-line-strong)] hover:bg-[color:var(--color-panel-2)]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[color:var(--color-accent)]">
                      0{idx + 1} //
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[color:var(--color-ink)] group-hover:text-white transition-colors">
                      {s.name}
                    </h2>
                    <span className="font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)] border border-[color:var(--color-line)] px-2 py-0.5 rounded-sm">
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
                        className="font-mono text-[10px] tracking-wider uppercase border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)] px-2 py-0.5 text-[color:var(--color-ink-dim)] rounded-sm"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tabular Quantitative Constraints */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-[color:var(--color-line)] font-mono text-right">
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--color-ink)]">{s.holdingPeriod}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)] mt-1">Holding Period</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--color-ink)]">{s.maxPositions}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)] mt-1">Max Positions</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--color-ink)]">{Math.round(s.maxPosition * 100)}%</div>
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)] mt-1">Max Size</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--color-accent)]">{Math.round(s.cashReserve * 100)}%</div>
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
