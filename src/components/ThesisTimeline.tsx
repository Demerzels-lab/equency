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
        <ol className="flex flex-col gap-1.5">
          {list.map((s, i) => (
            <li key={s.at} className="text-xs">
              {/* Brief §21: open a past thesis to see its conclusion at that time. */}
              <details className="group">
                <summary className="flex cursor-pointer list-none items-baseline gap-3 py-0.5">
                  <span className="mono w-14 shrink-0 text-muted-foreground">{i === 0 ? "now" : ago(new Date(s.at).toISOString())}</span>
                  <span className="font-medium" style={{ color: COLOR[s.direction] ?? "var(--color-ink)" }}>{s.direction}</span>
                  {s.score != null && <span className="mono text-muted-foreground">{s.score}</span>}
                  <span className="ml-auto text-muted-foreground transition-transform group-open:rotate-90">›</span>
                </summary>
                <div className="mb-1 ml-[68px] mt-1 border-l border-border pl-3 leading-relaxed text-muted-foreground">
                  {s.summary || "No summary recorded."}
                  {i < list.length - 1 && (
                    <div className="mono mt-1 text-[10px] uppercase tracking-wider">
                      Changed from {list[i + 1].direction}{list[i + 1].score != null && s.score != null ? ` · score ${list[i + 1].score} → ${s.score}` : ""}
                    </div>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ol>
      )}
      <div className="label mt-3 normal-case tracking-normal text-muted-foreground">Since IPO {fmtDate(ipoDate)} · only genuine changes recorded</div>
    </Panel>
  );
}
