"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isWatched, toggleWatch } from "@/lib/watchlist";
import { inCompare, toggleCompare } from "@/lib/compare";
import { CoreStatusPill } from "@/components/CoreStatus";
import type { CoreStatus } from "@/lib/core-identity";

export type Row = { ticker: string; name: string; daysPublic: number | null; bucket: string; sector: string; filedAt: string; status: CoreStatus; phase: string };

// Age buckets (lib/util/dates ageBucket) shown as the day windows the brief asks for (§24).
const BUCKETS: { value: string; label: string }[] = [
  { value: "ALL", label: "All days public" },
  { value: "NEW", label: "Day 0–7" },
  { value: "RECENT", label: "Day 8–30" },
  { value: "EARLY PUBLIC", label: "Day 31–90" },
  { value: "EMERGING", label: "Day 91–180" },
  { value: "SEASONED", label: "Day 180+" },
];
type SortKey = "days" | "ticker" | "name";

export function ExploreGrid({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [bucket, setBucket] = useState("ALL");
  const [sort, setSort] = useState<SortKey>("days");
  const [asc, setAsc] = useState(true);
  const [, force] = useState(0);

  useEffect(() => {
    const h = () => force((n) => n + 1);
    window.addEventListener("equency:watchlist", h);
    window.addEventListener("equency:compare", h);
    return () => { window.removeEventListener("equency:watchlist", h); window.removeEventListener("equency:compare", h); };
  }, []);

  const sectors = useMemo(() => ["ALL", ...Array.from(new Set(rows.map((r) => r.sector).filter((s) => s && s !== "-" && s !== "—"))).sort()], [rows]);
  const [sector, setSector] = useState("ALL");

  const view = useMemo(() => {
    const s = q.trim().toLowerCase();
    let v = rows.filter((r) =>
      (bucket === "ALL" || r.bucket === bucket) &&
      (sector === "ALL" || r.sector === sector) &&
      (!s || r.ticker.toLowerCase().includes(s) || r.name.toLowerCase().includes(s)),
    );
    v = [...v].sort((a, b) => {
      let d = 0;
      if (sort === "days") d = (a.daysPublic ?? 9999) - (b.daysPublic ?? 9999);
      else if (sort === "ticker") d = a.ticker.localeCompare(b.ticker);
      else d = a.name.localeCompare(b.name);
      return asc ? d : -d;
    });
    return v;
  }, [rows, q, bucket, sector, sort, asc]);

  const th = (k: SortKey, label: string, cls = "") => (
    <button onClick={() => (sort === k ? setAsc((x) => !x) : (setSort(k), setAsc(true)))} className={`label inline-flex items-center gap-1 hover:text-foreground ${cls}`}>
      {label}{sort === k && <span>{asc ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a Core by ticker or name…"
              className="font-mono h-10 w-full rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-panel)] pl-4 pr-10 text-xs text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-ink-faint)] focus:border-[color:var(--color-accent)] transition-colors"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[color:var(--color-ink-faint)]">/</span>
          </div>

          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
            className="font-mono h-10 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-3 text-xs text-[color:var(--color-ink)] outline-none cursor-pointer hover:border-[color:var(--color-line-strong)] transition-colors"
          >
            {BUCKETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>

          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="font-mono h-10 max-w-[220px] truncate rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-3 text-xs text-[color:var(--color-ink)] outline-none cursor-pointer hover:border-[color:var(--color-line-strong)] transition-colors"
          >
            {sectors.map((s) => <option key={s} value={s}>{s === "ALL" ? "All sectors" : s}</option>)}
          </select>
        </div>

        <div className="font-mono text-[11px] text-[color:var(--color-ink-faint)] tracking-wider uppercase">
          <span className="font-bold text-[color:var(--color-ink)]">{view.length}</span> INTELLIGENCE CORES
        </div>
      </div>

      <div className="overflow-x-auto border border-[color:var(--color-line)] bg-[color:var(--color-panel)]">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-panel-2)]/50">
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)]">{th("ticker", "TICKER")}</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)]">{th("name", "COMPANY")}</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)] text-right">{th("days", "PUBLIC")}</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)]">CORE</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)]">MISSION</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)]">SECTOR</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)] text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-line)]">
            {view.map((r) => (
              <tr key={r.ticker} className="hover:bg-[color:var(--color-panel-2)] transition-colors duration-150 group relative">
                <td className="py-4 px-5">
                  <Link href={`/company/${r.ticker}`} className="font-mono font-bold text-sm text-[color:var(--color-accent)] group-hover:underline inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {r.ticker}
                  </Link>
                </td>
                <td className="py-4 px-5 max-w-[260px] truncate">
                  <Link href={`/company/${r.ticker}`} className="font-sans text-sm font-semibold text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)] transition-colors">
                    {r.name}
                  </Link>
                </td>
                <td className="py-4 px-5 font-mono text-sm font-semibold tabular-nums text-right text-[color:var(--color-ink)]">
                  {r.daysPublic != null ? `Day ${r.daysPublic}` : "-"}
                </td>
                <td className="py-4 px-5">
                  <CoreStatusPill status={r.status} />
                </td>
                <td className="py-4 px-5 whitespace-nowrap font-mono text-xs text-[color:var(--color-ink)]">
                  {r.phase}
                </td>
                <td className="py-4 px-5 max-w-[220px] truncate font-mono text-xs text-[color:var(--color-ink-dim)]">
                  {r.sector}
                </td>
                <td className="py-4 px-5 text-right">
                  <span className="inline-flex items-center gap-2">
                    <button
                      title="Watchlist"
                      onClick={() => toggleWatch(r.ticker, r.name)}
                      className="rounded-full border border-[color:var(--color-line)] px-2.5 py-1 text-xs transition-all hover:border-[color:var(--color-accent)]"
                      style={{
                        color: isWatched(r.ticker) ? "var(--color-accent)" : "var(--color-ink-faint)",
                        background: isWatched(r.ticker) ? "var(--color-accent-dim)" : "transparent"
                      }}
                    >
                      ★
                    </button>
                    <button
                      title="Compare"
                      onClick={() => toggleCompare(r.ticker)}
                      className="font-mono rounded-full border border-[color:var(--color-line)] px-2.5 py-1 text-[10px] uppercase tracking-wider transition-all hover:border-[color:var(--color-accent-2)]"
                      style={{
                        color: inCompare(r.ticker) ? "var(--color-accent-2)" : "var(--color-ink-faint)",
                        background: inCompare(r.ticker) ? "var(--color-accent-2-dim)" : "transparent"
                      }}
                    >
                      VS
                    </button>
                    <Link
                      href={`/company/${r.ticker}`}
                      className="font-mono whitespace-nowrap rounded-full border border-[color:var(--color-accent)]/40 px-3 py-1 text-[10px] uppercase tracking-wider text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)] hover:text-white"
                    >
                      Enter Core →
                    </Link>
                  </span>
                </td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 px-5 text-center font-mono text-xs text-[color:var(--color-ink-faint)]">
                  No Intelligence Cores match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
