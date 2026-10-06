import Link from "next/link";
import { STRATEGY_LIST } from "@/lib/strategy/strategies";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Strategies · EQUENCY" };

export default function StrategiesPage() {
  return (
    <main className="mx-auto max-w-[1000px] px-6 py-12">
      <div className="label">Strategy Engine</div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose a strategy</h1>
      <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
        Each strategy ranks the newly-public universe by deterministic fit over every company&apos;s
        Intelligence Core. You pick the strategy and control the constraints.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {STRATEGY_LIST.map((s) => (
          <Link key={s.key} href={`/strategies/${s.key}`}>
            <Card className="flex flex-row items-center justify-between gap-6 rounded-sm border-border bg-card p-5 shadow-none transition-colors hover:border-accent-surface hover:bg-secondary/40">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{s.name}</h2>
                  <Badge variant="outline" className="label rounded-sm border-border">{s.risk}</Badge>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.tagline}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {s.focus.slice(0, 5).map((f) => (
                    <span key={f} className="mono rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{f}</span>
                  ))}
                </div>
              </div>
              <div className="hidden shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-right sm:grid">
                <Meta label="Hold" value={s.holdingPeriod} />
                <Meta label="Max pos" value={`${s.maxPositions}`} />
                <Meta label="Max size" value={`${Math.round(s.maxPosition * 100)}%`} />
                <Meta label="Cash" value={`${Math.round(s.cashReserve * 100)}%`} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono text-sm">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
