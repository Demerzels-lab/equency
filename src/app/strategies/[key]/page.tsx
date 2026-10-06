import Link from "next/link";
import { notFound } from "next/navigation";
import { getStrategy } from "@/lib/strategy/strategies";
import { rankUniverse } from "@/lib/strategy/rank";
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

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/strategies" className="label hover:text-foreground">← Strategies</Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{strategy.name}</h1>
            <Badge variant="outline" className="label rounded-sm border-border">{strategy.risk}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{strategy.tagline}</p>
        </div>
        <div className="flex gap-6">
          <Meta label="Holding" value={strategy.holdingPeriod} />
          <Meta label="Rebalance" value={strategy.rebalance} />
        </div>
      </div>

      <StrategyVerdict strategy={strategy.name} recs={recs} />

      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        Ranked by deterministic fit over each company&apos;s Intelligence Core (SEC + market signals).
        No capital moves here · allocations are suggestions. Vault execution lives in the Vault tab.
      </p>

      <StrategyWorkbench strategy={strategy} recs={recs} />
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
    <section className="mb-3 overflow-hidden rounded-sm border border-border bg-card">
      <div className="grid gap-px bg-border lg:grid-cols-[300px_1fr]">
        <div
          className="flex flex-col justify-between bg-card px-5 py-4"
          style={{ background: `linear-gradient(145deg, color-mix(in oklab, ${accent} 9%, var(--color-card)), var(--color-card) 60%)` }}
        >
          <div className="flex items-center justify-between">
            <span className="label" style={{ color: accent }}>Top pick</span>
            <span className="mono inline-flex items-center gap-1.5 text-[9px]" style={{ color: "var(--color-pos)" }}>
              <Dot color="var(--color-pos)" pulse /> RANKED
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="mono text-3xl font-semibold leading-none" style={{ color: accent }}>{top.ticker}</span>
            <span className="truncate text-sm text-muted-foreground">{top.name}</span>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="label">Strategy fit</span>
              <span className="mono text-xs">{topFit}%</span>
            </div>
            <Progress
              value={topFit}
              className="mt-1.5 h-1.5 bg-secondary [&_[data-slot=progress-indicator]]:bg-[var(--color-accent)]"
            />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 bg-card px-5 py-4">
          <p className="max-w-[72ch] text-pretty text-sm leading-relaxed text-foreground/90">
            {strategy} ranked {recs.length} newly-public {recs.length === 1 ? "company" : "companies"} by deterministic fit.{" "}
            {top.ticker} leads at {topFit}% fit{strong > 0 ? `, with ${strong} ${strong === 1 ? "name" : "names"} clearing a strong-match threshold.` : "."}
          </p>
          <div className="grid gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="label truncate normal-case tracking-normal text-muted-foreground">{s.label}</div>
                <div className="mono mt-1.5 text-xl font-semibold leading-none">{s.value}</div>
                <div className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{s.sub}</div>
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
