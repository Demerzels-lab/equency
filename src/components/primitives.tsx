import type { DataMode } from "@/lib/providers/types";

/** The honesty primitive: every panel of numbers states LIVE vs SIMULATED (brief §0, §57). */
export function DataModeBadge({ mode }: { mode: DataMode }) {
  const live = mode === "LIVE";
  return (
    <span
      className="mono inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[9px] tracking-[0.14em]"
      style={{
        color: live ? "var(--color-accent)" : "var(--color-sim)",
        border: `1px solid ${live ? "var(--color-accent)" : "var(--color-sim)"}`,
        borderRadius: 2,
        opacity: 0.9,
      }}
      title={live ? "Read live from a real source" : "Placeholder · not wired to a live source yet"}
    >
      <Dot color={live ? "var(--color-accent)" : "var(--color-sim)"} pulse={live} />
      {mode}
    </span>
  );
}

export function Dot({ color, pulse = false }: { color: string; pulse?: boolean }) {
  return (
    <span
      className={pulse ? "pulse" : ""}
      style={{ display: "inline-block", width: 6, height: 6, borderRadius: 9999, background: color, color }}
    />
  );
}

export function Panel({
  title,
  badge,
  children,
  className = "",
}: {
  title?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b hairline px-3 py-2">
          <span className="label">{title}</span>
          {badge}
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  );
}

export function tierColor(tier: number): string {
  return tier === 1 ? "var(--color-accent)" : tier === 2 ? "var(--color-warn)" : "var(--color-ink-faint)";
}
