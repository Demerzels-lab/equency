"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ago, fmtDate } from "@/lib/util/dates";
import { tierColor } from "@/components/primitives";
import { TrustTag, type TrustKind } from "@/components/Trust";

export interface FeedItem {
  cat: "SEC" | "Ownership" | "Insider" | "News";
  label: string;
  at: string; // ISO
  url?: string;
  tier: number;
  source?: string;
}

/**
 * One entry in the Core's activity log. Built server-side from REAL events only (quotes, SEC
 * filings, news, score recomputation) · every entry has a real timestamp and source.
 * Concise, auditable summaries · never model chain-of-thought (brand brief §15, §27).
 */
export interface ActivityEvent {
  at: string; // ISO date or datetime
  tag: "OBSERVATION" | "EVIDENCE" | "SCORE" | "STATE";
  text: string;
  source: string;
  url?: string;
  trust?: TrustKind;
  /** true when the timestamp is a calendar date only (SEC filing dates). */
  dateOnly?: boolean;
}

const TABS: { value: string; label: string; soon?: boolean }[] = [
  { value: "ACTIVITY", label: "Core Activity" },
  { value: "all", label: "All Evidence" },
  { value: "SEC", label: "SEC (Tier 1)" },
  { value: "Ownership", label: "Ownership" },
  { value: "Insider", label: "Insider Form 4" },
  { value: "News", label: "News" },
  { value: "SOON", label: "X · Options", soon: true },
];

const TAG_COLOR: Record<ActivityEvent["tag"], string> = {
  OBSERVATION: "var(--color-core)",
  EVIDENCE: "var(--color-pos)",
  SCORE: "var(--color-strategy)",
  STATE: "var(--color-ink-dim)",
};

export function ResearchConsole({ items, activity = [], ticker = "EQUENCY" }: { items: FeedItem[]; activity?: ActivityEvent[]; ticker?: string }) {
  const [tab, setTab] = useState<string>("ACTIVITY");

  const counts = Object.fromEntries(
    TABS.map((t) => [
      t.value,
      t.soon ? 0 : t.value === "ACTIVITY" ? activity.length : t.value === "all" ? items.length : items.filter((i) => i.cat === t.value).length,
    ]),
  );
  const newest = items.map((i) => i.at).sort().at(-1);
  const shown = (tab === "all" ? items : items.filter((i) => i.cat === tab)).slice(0, 12);

  return (
    <div className="space-y-3">
      {/* Status bar · real counts and real freshness only */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2.5 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">Research environment · ${ticker}</span>
          <span className="rounded border border-border/80 bg-secondary/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
            SEC · market · news
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>{items.length} evidence items</span>
          <span className="text-border">|</span>
          <span suppressHydrationWarning>newest evidence {newest ? ago(newest) : "·"}</span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mono h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-border/60 bg-transparent p-0 pb-2">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              disabled={t.soon || (t.value !== "ACTIVITY" && t.value !== "all" && counts[t.value] === 0)}
              title={t.soon ? `${t.label} research is coming online · not yet a connected source` : undefined}
              className="flex-none rounded-none border border-border/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] data-[state=active]:border-accent-surface data-[state=active]:bg-secondary data-[state=active]:text-foreground"
            >
              {t.label}
              {t.soon ? (
                <span className="ml-1.5 text-[8px] text-muted-foreground">coming online</span>
              ) : (
                counts[t.value] > 0 && <span className="ml-1.5 text-muted-foreground">{counts[t.value]}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "ACTIVITY" ? (
        <div className="space-y-1 border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-3 font-mono text-[11px] leading-relaxed">
          <div className="flex items-center justify-between border-b border-[color:var(--color-line)] pb-1.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-3)]">
            <span>Core activity · newest first</span>
            <span className="hidden sm:inline">real events · view-only</span>
          </div>
          {activity.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No recorded activity yet · the Core is monitoring.</div>}
          {activity.map((a, idx) => {
            const c = TAG_COLOR[a.tag];
            const body = (
              <>
                {/* meta: one line on mobile above the text, a left column on sm+ */}
                <span className="flex shrink-0 items-center gap-2.5 sm:contents">
                  <span suppressHydrationWarning className="shrink-0 pt-0.5 text-[10px] text-[color:var(--color-ink-3)] sm:w-[86px]" title={a.at}>
                    {a.dateOnly ? fmtDate(a.at) : ago(a.at)}
                  </span>
                  <span className="shrink-0 border px-1.5 text-[9px] uppercase tracking-wider" style={{ color: c, borderColor: `color-mix(in oklab, ${c} 40%, transparent)` }}>
                    {a.tag}
                  </span>
                  {a.trust && <TrustTag kind={a.trust} className="shrink-0 sm:hidden" />}
                </span>
                <span className="min-w-0 flex-1 break-words font-sans text-[13px] leading-snug text-[color:var(--color-ink)] sm:font-mono sm:text-xs sm:leading-relaxed">
                  {a.text}
                  <span className="ml-2 text-[10px] text-[color:var(--color-ink-3)]">via {a.source}</span>
                </span>
                {a.trust && <TrustTag kind={a.trust} className="hidden shrink-0 sm:inline-flex" />}
              </>
            );
            return a.url ? (
              <a key={idx} href={a.url} target="_blank" rel="noreferrer" className="flex flex-col gap-1.5 border-b border-[color:var(--color-line)]/60 p-1.5 py-2.5 transition-colors last:border-0 hover:bg-[color:var(--color-panel-2)] sm:flex-row sm:items-start sm:gap-2.5 sm:border-0 sm:py-1.5">
                {body}
              </a>
            ) : (
              <div key={idx} className="flex flex-col gap-1.5 border-b border-[color:var(--color-line)]/60 p-1.5 py-2.5 last:border-0 sm:flex-row sm:items-start sm:gap-2.5 sm:border-0 sm:py-1.5">{body}</div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[color:var(--color-line)] border border-[color:var(--color-line)] bg-[color:var(--color-panel)] font-mono text-xs">
          {shown.length === 0 && <div className="py-8 text-center font-mono text-xs text-muted-foreground">No verified filings or news available in this category.</div>}
          {shown.map((e, i) => (
            <a
              key={i}
              href={e.url}
              target="_blank"
              rel="noreferrer"
              className="group grid grid-cols-[64px_1fr_auto] items-center gap-x-3 gap-y-1 p-2.5 text-xs transition-colors hover:bg-secondary/40 sm:grid-cols-[80px_100px_1fr_auto]"
            >
              <span className="text-[11px] text-muted-foreground">{fmtDate(e.at)}</span>
              <span className="truncate text-[10px] font-semibold uppercase tracking-wider" style={{ color: tierColor(e.tier) }}>{e.cat}</span>
              <span className="col-span-2 col-start-1 row-start-2 line-clamp-2 font-sans text-xs text-foreground/90 group-hover:text-foreground sm:col-span-1 sm:col-start-auto sm:row-start-auto sm:truncate">{e.label}</span>
              <span className="text-xs text-muted-foreground opacity-40 transition-opacity group-hover:text-foreground group-hover:opacity-100">↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
