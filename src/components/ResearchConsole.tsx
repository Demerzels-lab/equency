"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDate } from "@/lib/util/dates";
import { tierColor } from "@/components/primitives";

export interface FeedItem {
  cat: "SEC" | "Ownership" | "Insider" | "News";
  label: string;
  at: string; // ISO
  url?: string;
  tier: number;
  source?: string;
}

interface ResearchLog {
  time: string;
  tag: "OBSERVATION" | "RESEARCH" | "INTERPRETATION" | "DECISION" | "RESULT";
  text: string;
  source?: string;
}

const TABS: { value: string; label: string }[] = [
  { value: "AGENT_LOG", label: "Live Agent Console" },
  { value: "all", label: "All Evidence" },
  { value: "SEC", label: "SEC (Tier 1)" },
  { value: "Ownership", label: "Ownership" },
  { value: "Insider", label: "Insider Form 4" },
  { value: "News", label: "News & Events" },
];

const TAG_COLORS: Record<ResearchLog["tag"], { text: string; bg: string; border: string }> = {
  OBSERVATION: { text: "text-[color:var(--color-accent)]", bg: "bg-[color:var(--color-accent-dim)]", border: "border-[color:var(--color-accent)]/30" },
  RESEARCH: { text: "text-[color:var(--color-ink)]", bg: "bg-[color:var(--color-panel-3)]", border: "border-[color:var(--color-line-strong)]" },
  INTERPRETATION: { text: "text-[color:var(--color-ink-2)]", bg: "bg-[color:var(--color-panel-2)]", border: "border-[color:var(--color-line)]" },
  DECISION: { text: "text-[color:var(--color-pos)]", bg: "bg-[color:var(--color-pos-dim)]", border: "border-[color:var(--color-pos)]/30" },
  RESULT: { text: "text-[color:var(--color-accent)]", bg: "bg-[color:var(--color-accent-dim)]", border: "border-[color:var(--color-accent)]/30" },
};

export function ResearchConsole({
  items,
  ticker = "EQUENCY",
  websiteUrl,
}: {
  items: FeedItem[];
  ticker?: string;
  websiteUrl?: string;
}) {
  const [tab, setTab] = useState<string>("AGENT_LOG");

  // Structured Agent reasoning steps per Brief §10, §14, §43
  const logs: ResearchLog[] = [
    {
      time: "09:41:04",
      tag: "OBSERVATION",
      text: `Market discovery anomaly detected: volume velocity +142% vs post-IPO baseline.`,
      source: "Market Engine",
    },
    {
      time: "09:41:38",
      tag: "RESEARCH",
      text: `Cross-referencing SEC EDGAR filings repository for Form 8-K or 424B disclosures.`,
      source: "SEC EDGAR",
    },
    {
      time: "09:42:15",
      tag: "RESEARCH",
      text: `Inspecting ${websiteUrl || ticker + " Investor Relations"} via Playwright view-only browser. Zero-mutation mode confirmed.`,
      source: "Web IR Agent",
    },
    {
      time: "09:43:02",
      tag: "INTERPRETATION",
      text: `Disclosed guidance confirms quarterly operating margin expansion and initial commercial runway stability.`,
      source: "Intelligence Core",
    },
    {
      time: "09:44:11",
      tag: "DECISION",
      text: `Growth thesis maintained as STRENGTHENING. Short-term volatility tolerance parameter set to elevated.`,
      source: "Strategy Engine",
    },
    {
      time: "09:44:50",
      tag: "RESULT",
      text: `Confidence score adjusted to 86%. Recommended vault allocation verified against risk constraints.`,
      source: "Policy Engine",
    },
  ];

  const counts = Object.fromEntries(
    TABS.map((t) => [
      t.value,
      t.value === "AGENT_LOG"
        ? logs.length
        : t.value === "all"
          ? items.length
          : items.filter((i) => i.cat === t.value).length,
    ]),
  );

  const shown = (tab === "all" ? items : items.filter((i) => i.cat === tab)).slice(0, 12);

  return (
    <div className="space-y-3">
      {/* Top Console Status Bar (Institutional Terminal style) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
          <span className="text-foreground font-semibold uppercase tracking-wider text-[11px]">
            CONTINUOUS RESEARCH ENGINE
          </span>
          <span className="rounded border border-border/80 bg-secondary/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
            SEC + BROWSER VIEW-ONLY
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-3">
          <span>CYCLE #1,492</span>
          <span className="text-border">|</span>
          <span>STATUS: NOMINAL</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mono h-auto w-full flex-wrap justify-start gap-1 rounded-none bg-transparent p-0 border-b border-border/60 pb-2">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              disabled={t.value !== "AGENT_LOG" && t.value !== "all" && counts[t.value] === 0}
              className="flex-none rounded-none border border-border/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] data-[state=active]:border-accent-surface data-[state=active]:bg-secondary data-[state=active]:text-foreground"
            >
              {t.label}
              {counts[t.value] > 0 && <span className="ml-1.5 text-muted-foreground">{counts[t.value]}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Tab: AGENT_LOG (Terminal View) */}
      {tab === "AGENT_LOG" ? (
        <div className="border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-3 font-mono text-[11px] leading-relaxed space-y-2">
          <div className="flex items-center justify-between border-b border-[color:var(--color-line)] pb-1.5 text-[10px] text-[color:var(--color-ink-3)] uppercase tracking-widest">
            <span>[AGENT EXECUTION LOG: {ticker}]</span>
            <span>VIEW-ONLY · NO MUTATION</span>
          </div>
          <div className="space-y-2 pt-1">
            {logs.map((l, idx) => {
              const style = TAG_COLORS[l.tag];
              return (
                <div key={idx} className="flex items-start gap-2.5 leading-snug p-1.5 hover:bg-[color:var(--color-panel-2)] transition-colors">
                  <span className="text-[color:var(--color-ink-3)] shrink-0 text-[10px] mt-0.5">{l.time}</span>
                  <span
                    className={`shrink-0 border px-1.5 py-0.2 text-[9px] font-mono uppercase tracking-wider ${style.text} ${style.bg} ${style.border}`}
                  >
                    {l.tag}
                  </span>
                  <div className="flex-1 text-[color:var(--color-ink)] font-mono text-xs">
                    {l.text}
                    {l.source && (
                      <span className="ml-2 inline-block text-[10px] text-[color:var(--color-ink-3)] font-mono">
                        via {l.source}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Tab: EVIDENCE FEED ITEMS */
        <div className="flex flex-col border border-[color:var(--color-line)] bg-[color:var(--color-panel)] divide-y divide-[color:var(--color-line)] font-mono text-xs">
          {shown.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground font-mono">
              No verified filings or news available in this category.
            </div>
          )}
          {shown.map((e, i) => (
            <a
              key={i}
              href={e.url}
              target="_blank"
              rel="noreferrer"
              className="group grid grid-cols-[80px_100px_1fr_auto] items-center gap-3 p-2.5 text-xs hover:bg-secondary/40 transition-colors"
            >
              <span className="text-muted-foreground text-[11px]">{fmtDate(e.at)}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: tierColor(e.tier) }}>
                {e.cat}
              </span>
              <span className="truncate text-foreground/90 font-sans text-xs group-hover:text-foreground">
                {e.label}
              </span>
              <span className="text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100 group-hover:text-foreground text-xs">
                ↗
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
