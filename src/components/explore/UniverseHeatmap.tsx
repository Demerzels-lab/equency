import type { Row } from "./ExploreGrid";

const BUCKETS: [string, string][] = [
  ["NEW", "0–7d"],
  ["RECENT", "8–30d"],
  ["EARLY PUBLIC", "31–90d"],
  ["EMERGING", "91–180d"],
  ["SEASONED", "180d+"],
];

export function UniverseHeatmap({ rows }: { rows: Row[] }) {
  const total = rows.length || 1;
  const byBucket = BUCKETS.map(([k, label]) => ({ k, label, n: rows.filter((r) => r.bucket === k).length }));
  const sectorCounts = new Map<string, number>();
  for (const r of rows) if (r.sector && r.sector !== "—") sectorCounts.set(r.sector, (sectorCounts.get(r.sector) ?? 0) + 1);
  const sectors = [...sectorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const sMax = sectors[0]?.[1] ?? 1;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="rounded-sm border border-border bg-card/40 p-4">
        <div className="label mb-3">By age</div>
        <div className="flex flex-col gap-2">
          {byBucket.map((b) => (
            <div key={b.k} className="flex items-center gap-3 text-xs">
              <span className="w-28 shrink-0 text-muted-foreground">{b.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full" style={{ width: `${(b.n / total) * 100}%`, background: b.k === "NEW" ? "var(--color-accent)" : "var(--color-accent-2)" }} />
              </div>
              <span className="mono w-6 text-right tabular-nums">{b.n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card/40 p-4">
        <div className="label mb-3">By sector · top {sectors.length}</div>
        {sectors.length === 0 ? (
          <div className="text-xs text-muted-foreground">Sector data unavailable right now.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {sectors.map(([s, n]) => (
              <div key={s} className="flex items-center gap-3 text-xs">
                <span className="w-40 shrink-0 truncate text-muted-foreground" title={s}>{s}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full" style={{ width: `${(n / sMax) * 100}%`, background: "var(--color-accent)" }} />
                </div>
                <span className="mono w-6 text-right tabular-nums">{n}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
