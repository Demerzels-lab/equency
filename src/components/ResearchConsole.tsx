"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ago, fmtDate } from "@/lib/util/dates";
import { tierColor } from "@/components/primitives";

export interface FeedItem {
  cat: "SEC" | "Ownership" | "Insider" | "News";
  label: string;
  at: string; // ISO
  url?: string;
  tier: number;
  source?: string;
}

const TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "SEC", label: "SEC" },
  { value: "Ownership", label: "Ownership" },
  { value: "Insider", label: "Insider" },
  { value: "News", label: "News" },
];

export function ResearchConsole({ items }: { items: FeedItem[] }) {
  const [tab, setTab] = useState("all");
  const counts = Object.fromEntries(TABS.map((t) => [t.value, t.value === "all" ? items.length : items.filter((i) => i.cat === t.value).length]));
  const shown = (tab === "all" ? items : items.filter((i) => i.cat === tab)).slice(0, 10);

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mono h-auto w-full flex-wrap justify-start gap-1 rounded-sm bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              disabled={t.value !== "all" && counts[t.value] === 0}
              className="flex-none rounded-sm border border-border px-2 py-1 text-[10px] uppercase tracking-[0.12em] data-[state=active]:border-accent-surface data-[state=active]:bg-secondary data-[state=active]:text-foreground"
            >
              {t.label}
              {counts[t.value] > 0 && <span className="ml-1.5 text-muted-foreground">{counts[t.value]}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-3 flex flex-col">
        {shown.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No items in this view.</div>}
        {shown.map((e, i) => (
          <a
            key={i}
            href={e.url}
            target="_blank"
            rel="noreferrer"
            className="rowlink group grid grid-cols-[64px_84px_1fr_auto] items-center gap-3 border-b border-border px-1 py-2 text-xs last:border-0"
          >
            <span className="mono text-muted-foreground">{fmtDate(e.at)}</span>
            <span className="mono text-[10px] uppercase tracking-wider" style={{ color: tierColor(e.tier) }}>{e.cat}</span>
            <span className="truncate text-foreground">{e.label}</span>
            <span className="opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-accent)" }}>↗</span>
          </a>
        ))}
      </div>

    </div>
  );
}
