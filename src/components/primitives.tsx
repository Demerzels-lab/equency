import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DataMode } from "@/lib/providers/types";

/** A dense terminal panel built on shadcn Card: hairline header with a label + badge slot. */
export function Panel({
  title,
  badge,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden rounded-sm border-border bg-card py-0 shadow-none", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="label">{title}</span>
          {badge}
        </div>
      )}
      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </Card>
  );
}

/** The honesty primitive: LIVE vs SIMULATED, on shadcn Badge. */
export function DataModeBadge({ mode }: { mode: DataMode }) {
  const live = mode === "LIVE";
  const color = live ? "var(--color-pos)" : "var(--color-sim)";
  return (
    <Badge
      variant="outline"
      className="mono gap-1.5 rounded-sm border px-1.5 py-0 text-[9px] font-medium tracking-[0.14em]"
      style={{ color, borderColor: color }}
    >
      <Dot color={color} pulse={live} />
      {mode}
    </Badge>
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

export function tierColor(tier: number): string {
  return tier === 1 ? "var(--color-pos)" : tier === 2 ? "var(--color-warn)" : "var(--color-ink-faint)";
}
