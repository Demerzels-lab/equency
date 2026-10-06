import Link from "next/link";
import { notFound } from "next/navigation";
import { getStrategy } from "@/lib/strategy/strategies";
import { rankUniverse } from "@/lib/strategy/rank";
import { StrategyWorkbench } from "@/components/StrategyWorkbench";

export const revalidate = 300;

export default async function StrategyDetail({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const strategy = getStrategy(key);
  if (!strategy) notFound();

  const recs = await rankUniverse(strategy, 10).catch(() => []);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/strategies" className="label hover:text-[color:var(--color-ink)]">← Strategies</Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{strategy.name}</h1>
            <span className="label" style={{ border: "1px solid var(--color-line)", padding: "2px 6px" }}>{strategy.risk}</span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--color-ink-dim)" }}>{strategy.tagline}</p>
        </div>
        <div className="flex gap-5">
          <Meta label="Holding" value={strategy.holdingPeriod} />
          <Meta label="Rebalance" value={strategy.rebalance} />
          <Meta label="Universe" value={`${recs.length} ranked`} />
        </div>
      </div>

      <div className="mb-3 panel px-4 py-2.5">
        <span className="label normal-case leading-relaxed" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
          Ranked by deterministic strategy-fit over each company&apos;s Intelligence Core (SEC + market signals).
          No capital is deployed here · allocations are suggestions. Vault execution arrives in Phase 3.
        </span>
      </div>

      <StrategyWorkbench strategy={strategy} recs={recs} />
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="mono text-sm" style={{ color: "var(--color-ink)" }}>{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
