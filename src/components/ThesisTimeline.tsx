"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/primitives";
import { recordThesis, type ThesisSnap } from "@/lib/thesis-history";
import { ago, fmtDate } from "@/lib/util/dates";

const COLOR: Record<string, string> = {
  STRENGTHENING: "var(--color-pos)",
  NEUTRAL: "var(--color-ink-dim)",
  CAUTIOUS: "var(--color-warn)",
  WEAKENING: "var(--color-danger)",
};

export function ThesisTimeline({
  ticker, direction, score, summary, ipoDate,
}: { ticker: string; direction: string; score: number | null; summary: string; ipoDate?: string }) {
  const [list, setList] = useState<ThesisSnap[]>([]);
  useEffect(() => { setList(recordThesis(ticker, { direction, score, summary })); }, [ticker, direction, score, summary]);

  return (
    <Panel title="Thesis history">
      {list.length <= 1 ? (
        <div className="text-xs leading-relaxed text-muted-foreground">
          Snapshot recorded. Revisit over time and only <span className="text-foreground">real thesis changes</span> appear
          here as a living record of how the Core&apos;s view evolved. Device-local for now.
        </div>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {list.map((s, i) => (
            <li key={s.at} className="flex items-baseline gap-3 text-xs">
              <span className="mono w-14 shrink-0 text-muted-foreground">{i === 0 ? "now" : ago(new Date(s.at).toISOString())}</span>
              <span className="font-medium" style={{ color: COLOR[s.direction] ?? "var(--color-ink)" }}>{s.direction}</span>
              {s.score != null && <span className="mono text-muted-foreground">{s.score}</span>}
            </li>
          ))}
        </ol>
      )}
      <div className="label mt-3 normal-case tracking-normal text-muted-foreground">Since IPO {fmtDate(ipoDate)} · only genuine changes recorded</div>
    </Panel>
  );
}
