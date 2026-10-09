import { CORE_STATE_COLOR, type CoreStatus } from "@/lib/core-identity";
import { cn } from "@/lib/utils";

/** Core state pill · colour-coded, with the real basis for the state as its tooltip. */
export function CoreStatusPill({ status, className }: { status: CoreStatus; className?: string }) {
  const c = CORE_STATE_COLOR[status.state];
  return (
    <span
      title={status.basis}
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider", className)}
      style={{ color: c, borderColor: `color-mix(in oklab, ${c} 40%, transparent)`, background: `color-mix(in oklab, ${c} 10%, transparent)` }}
    >
      <span className={status.state === "MONITORING" ? "" : "pulse"} style={{ display: "inline-block", width: 6, height: 6, borderRadius: 9999, background: c, color: c }} />
      {status.state}
    </span>
  );
}
