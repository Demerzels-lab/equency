// Trust primitives (brand brief §41, §42): every claim says what KIND of claim it is, and every
// data block says how fresh it is. Stale data is shown as stale, never hidden.
import { ago, olderThan } from "@/lib/util/dates";
import { cn } from "@/lib/utils";

export type TrustKind = "VERIFIED" | "DERIVED" | "INTERPRETED";

const TRUST: Record<TrustKind, { color: string; tip: string }> = {
  VERIFIED: { color: "var(--color-pos)", tip: "Verified · directly supported by a primary source (SEC filing, exchange quote)." },
  DERIVED: { color: "var(--color-core)", tip: "Derived · calculated by fixed rules from verified data. Same inputs, same output." },
  INTERPRETED: { color: "var(--color-sim)", tip: "Interpreted · a reasoned conclusion from the evidence by the Reasoning Engine. Check the evidence." },
};

export function TrustTag({ kind, className }: { kind: TrustKind; className?: string }) {
  const t = TRUST[kind];
  return (
    <span
      title={t.tip}
      className={cn("inline-flex items-center rounded-sm border px-1.5 py-0 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]", className)}
      style={{ color: t.color, borderColor: `color-mix(in oklab, ${t.color} 45%, transparent)` }}
    >
      {kind}
    </span>
  );
}

/** The three trust levels side by side, with their meaning · used as a legend. */
export function TrustLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] text-[color:var(--color-ink-faint)]", className)}>
      {(Object.keys(TRUST) as TrustKind[]).map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <TrustTag kind={k} />
          {k === "VERIFIED" ? "from a primary source" : k === "DERIVED" ? "computed by rules" : "reasoned from evidence"}
        </span>
      ))}
    </div>
  );
}

/**
 * "Updated 12s ago" · or "STALE · last updated 9h ago" once older than `staleAfterHours`.
 * `verb` lets event-driven sources read naturally ("Latest filing 3d ago").
 */
export function Freshness({ at, staleAfterHours, verb = "Updated", className }: { at?: string | null; staleAfterHours?: number; verb?: string; className?: string }) {
  if (!at) return <span className={cn("font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)]", className)}>No timestamp</span>;
  const stale = staleAfterHours != null && olderThan(at, staleAfterHours);
  return (
    <span
      suppressHydrationWarning
      title={at}
      className={cn("font-mono text-[10px] uppercase tracking-wider", className)}
      style={{ color: stale ? "var(--color-warn)" : "var(--color-ink-faint)" }}
    >
      {stale ? `Stale · last updated ${ago(at)}` : `${verb} ${ago(at)}`}
    </span>
  );
}
