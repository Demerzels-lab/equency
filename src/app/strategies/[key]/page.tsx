import Link from "next/link";
import { notFound } from "next/navigation";
import { getStrategy } from "@/lib/strategy/strategies";
import { rankUniverse } from "@/lib/strategy/rank";
import { getSparkline } from "@/lib/providers/yahoo";
import { StrategyWorkbench } from "@/components/StrategyWorkbench";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dot } from "@/components/primitives";
import type { Recommendation } from "@/lib/strategy/types";

export const revalidate = 300;

export default async function StrategyDetail({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const strategy = getStrategy(key);
  if (!strategy) notFound();

  const recs = await rankUniverse(strategy, 10).catch(() => []);
  const sparks: Record<string, number[] | null> = Object.fromEntries(
    await Promise.all(recs.map(async (r) => [r.ticker, await getSparkline(r.ticker, r.daysPublic ?? undefined)] as const)),
  );

  return (
    <main className="page-main mx-auto max-w-[1240px] px-6 pt-28 sm:pt-32 pb-20">
      <div className="mb-4">
        <Link href="/strategies" className="font-mono text-xs text-muted-foreground hover:text-[color:var(--color-accent)] inline-flex items-center gap-1.5 transition-colors">
          ← Back to Strategies
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--color-line)] pb-6">
        <div>
          <div className="section-label mb-2">STRATEGY MODE</div>
          <div className="flex items-center gap-3">
            <h1 className="editorial-h2">{strategy.name}</h1>
            <Badge variant="outline" className="label rounded-sm border-border">{strategy.risk}</Badge>
          </div>
          <p className="editorial-lead mt-2 max-w-[60ch]">{strategy.tagline}</p>
        </div>
        <div className="flex gap-6">
          <Meta label="Holding" value={strategy.holdingPeriod} />
          <Meta label="Rebalance" value={strategy.rebalance} />
        </div>
      </div>

      <StrategyVerdict strategy={strategy.name} recs={recs} />

      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        Every Core ranked by rule-based fit against this strategy (SEC + market signals). Review a Core before you act ·
        no capital moves here, allocations are suggestions until you deploy through your Strategy Vault.
      </p>

      <StrategyWorkbench strategy={strategy} recs={recs} sparks={sparks} />
    </main>
  );
}

/** The quick read of a ranking run: top pick, how strong the matches are, universe coverage. */
function StrategyVerdict({ strategy, recs }: { strategy: string; recs: Recommendation[] }) {
  if (recs.length === 0) {
    return (
      <section className="mb-3 rounded-sm border border-border bg-card px-5 py-4 text-xs text-muted-foreground">
        No recommendations resolved from the live universe right now · the ranking engine returned an empty set.
      </section>
    );
  }
  const top = recs[0];
  const topFit = Math.round(top.fit * 100);
  const avgFit = Math.round((recs.reduce((s, r) => s + r.fit, 0) / recs.length) * 100);
  const strong = recs.filter((r) => r.fit >= 0.7).length;
  const sectors = new Set(recs.map((r) => r.sector).filter(Boolean)).size;
  const accent = "var(--color-accent)";

  const stats = [
    { label: "Ranked", value: String(recs.length), sub: "newly public" },
    { label: "Avg fit", value: `${avgFit}%`, sub: "across universe" },
    { label: "Strong matches", value: String(strong), sub: "fit ≥ 70%" },
    { label: "Top score", value: top.score != null ? String(top.score) : "·", sub: "intelligence core" },
    { label: "Sectors", value: String(sectors), sub: "covered" },
  ];

  return (
    <section className="mb-6 overflow-hidden border border-[color:var(--color-line)] bg-[color:var(--color-panel)]">
      <div className="grid grid-cols-1 divide-y lg:divide-y-0 lg:divide-x divide-[color:var(--color-line)] lg:grid-cols-[300px_1fr]">
        <div
          className="flex flex-col justify-between p-6 sm:p-8 bg-[color:var(--color-panel-2)]/60"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-[color:var(--color-accent)]">TOP SELECTION</span>
              <span className="font-mono inline-flex items-center gap-1.5 text-[9px] uppercase px-2 py-0.5 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-bg)] text-[color:var(--color-pos)] font-semibold">
                <Dot color="var(--color-pos)" pulse /> RANKED
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2.5">
              <span className="font-mono text-3xl font-extrabold leading-none text-[color:var(--color-accent)]">{top.ticker}</span>
              <span className="truncate text-sm font-semibold text-[color:var(--color-ink-dim)]">{top.name}</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[color:var(--color-line)]">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[10px] uppercase text-[color:var(--color-ink-faint)]">Model Fit Score</span>
              <span className="font-bold text-[color:var(--color-ink)] tabular-nums">{topFit}%</span>
            </div>
            <Progress
              value={topFit}
              className="mt-2 h-1.5 bg-[color:var(--color-panel-2)] [&_[data-slot=progress-indicator]]:bg-[var(--color-accent)]"
            />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 bg-[color:var(--color-panel)]">
          <p className="max-w-[72ch] text-sm leading-relaxed text-[color:var(--color-ink-dim)]">
            <span className="font-semibold text-[color:var(--color-ink)]">{strategy}</span> ranked {recs.length} newly public {recs.length === 1 ? "company" : "companies"} by deterministic fit.{" "}
            <span className="font-semibold text-[color:var(--color-accent)]">{top.ticker}</span> leads at {topFit}% fit{strong > 0 ? `, with ${strong} ${strong === 1 ? "name" : "names"} clearing the high-conviction threshold.` : "."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-[color:var(--color-line)]">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)]">{s.label}</div>
                <div className="font-mono mt-1 text-lg font-bold tabular-nums text-[color:var(--color-ink)]">{s.value}</div>
                <div className="font-mono mt-0.5 text-[10px] text-[color:var(--color-ink-dim)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="mono text-sm">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
