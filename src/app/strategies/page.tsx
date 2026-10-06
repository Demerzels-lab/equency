import Link from "next/link";
import { STRATEGY_LIST } from "@/lib/strategy/strategies";

export const metadata = { title: "Strategies · EQUENCY" };

export default function StrategiesPage() {
  return (
    <main className="mx-auto max-w-[1000px] px-6 py-12">
      <div className="label">Strategy Engine</div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose a strategy</h1>
      <p className="mt-3 max-w-[58ch] text-sm leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>
        Each strategy ranks the newly-public universe against its focus using deterministic
        strategy-fit over every company&apos;s Intelligence Core. You choose the strategy and control
        the constraints · the engine proposes, you decide.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {STRATEGY_LIST.map((s) => (
          <Link key={s.key} href={`/strategies/${s.key}`} className="rowlink panel flex items-center justify-between gap-6 p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">{s.name}</h2>
                <span className="label" style={{ border: "1px solid var(--color-line)", padding: "2px 6px" }}>{s.risk}</span>
              </div>
              <p className="mt-1.5 text-sm" style={{ color: "var(--color-ink-dim)" }}>{s.tagline}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.focus.slice(0, 5).map((f) => (
                  <span key={f} className="label normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-faint)", border: "1px solid var(--color-line)", padding: "2px 6px" }}>{f}</span>
                ))}
              </div>
            </div>
            <div className="hidden shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-right sm:grid">
              <Meta label="Hold" value={s.holdingPeriod} />
              <Meta label="Max pos" value={`${s.maxPositions}`} />
              <Meta label="Max size" value={`${Math.round(s.maxPosition * 100)}%`} />
              <Meta label="Cash" value={`${Math.round(s.cashReserve * 100)}%`} />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono text-sm" style={{ color: "var(--color-ink)" }}>{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
