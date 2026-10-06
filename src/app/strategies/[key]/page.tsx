import Link from "next/link";
import { notFound } from "next/navigation";
import { getStrategy } from "@/lib/strategy/strategies";
import { rankUniverse } from "@/lib/strategy/rank";
import { StrategyWorkbench } from "@/components/StrategyWorkbench";
import { Badge } from "@/components/ui/badge";

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
          <Meta label="Universe" value={`${recs.length} ranked`} />
        </div>
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
        Ranked by deterministic fit over each company&apos;s Intelligence Core (SEC + market signals).
        No capital moves here · allocations are suggestions. Vault execution lives in the Vault tab.
      </p>

      <StrategyWorkbench strategy={strategy} recs={recs} />
    </main>
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
