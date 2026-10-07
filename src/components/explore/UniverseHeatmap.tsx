import type { Row } from "./ExploreGrid";

const BUCKETS: [string, string][] = [
  ["NEW", "0-7d"],
  ["RECENT", "8-30d"],
  ["EARLY PUBLIC", "31-90d"],
  ["EMERGING", "91-180d"],
  ["SEASONED", "180d+"],
];

export function UniverseHeatmap({ rows }: { rows: Row[] }) {
  const total = rows.length || 1;
  const byBucket = BUCKETS.map(([k, label]) => ({ k, label, n: rows.filter((r) => r.bucket === k).length }));
  const sectorCounts = new Map<string, number>();
  for (const r of rows) if (r.sector && r.sector !== "-" && r.sector !== "—") sectorCounts.set(r.sector, (sectorCounts.get(r.sector) ?? 0) + 1);
  const sectors = [...sectorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const sMax = sectors[0]?.[1] ?? 1;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[color:var(--color-line)]">
          <div className="font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-accent)] font-semibold">DISTRIBUTION // AGE</div>
          <div className="font-mono text-[10px] text-[color:var(--color-ink-faint)]">180D HORIZON</div>
        </div>
        <div className="flex flex-col gap-3">
          {byBucket.map((b) => (
            <div key={b.k} className="flex items-center gap-3 text-xs">
              <span className="w-28 shrink-0 font-mono text-[11px] text-[color:var(--color-ink-dim)]">{b.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--color-panel-2)]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(b.n / total) * 100}%`,
                    background: b.k === "NEW" ? "var(--color-accent)" : "var(--color-accent-2)"
                  }}
                />
              </div>
              <span className="font-mono text-[11px] w-6 text-right tabular-nums text-[color:var(--color-ink)] font-semibold">{b.n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[color:var(--color-line)]">
          <div className="font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-accent)] font-semibold">SECTOR CONCENTRATION // TOP {sectors.length}</div>
          <div className="font-mono text-[10px] text-[color:var(--color-ink-faint)]">SIC CODES</div>
        </div>
        {sectors.length === 0 ? (
          <div className="text-xs text-[color:var(--color-ink-faint)] py-4 font-mono">Sector classification loading from SEC submissions...</div>
        ) : (
          <div className="flex flex-col gap-3">
            {sectors.map(([s, n]) => (
              <div key={s} className="flex items-center gap-3 text-xs">
                <span className="w-40 shrink-0 truncate font-mono text-[11px] text-[color:var(--color-ink-dim)]" title={s}>{s}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--color-panel-2)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(n / sMax) * 100}%`, background: "var(--color-accent)" }}
                  />
                </div>
                <span className="font-mono text-[11px] w-6 text-right tabular-nums text-[color:var(--color-ink)] font-semibold">{n}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
