"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isWatched, toggleWatch } from "@/lib/watchlist";
import { inCompare, toggleCompare } from "@/lib/compare";

export type Row = { ticker: string; name: string; daysPublic: number | null; bucket: string; sector: string; filedAt: string };

const BUCKETS = ["ALL", "NEW", "RECENT", "EARLY PUBLIC", "EMERGING", "SEASONED"];
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

  const sectors = useMemo(() => ["ALL", ...Array.from(new Set(rows.map((r) => r.sector).filter((s) => s && s !== "—"))).sort()], [rows]);
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
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ticker or name…" className="mono h-9 min-w-0 flex-1 rounded-sm border border-border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-[color:var(--color-accent)] sm:max-w-xs" />
        <select value={bucket} onChange={(e) => setBucket(e.target.value)} className="mono h-9 rounded-sm border border-border bg-[color:var(--color-panel)] px-2 text-xs">
          {BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={sector} onChange={(e) => setSector(e.target.value)} className="mono h-9 max-w-[200px] truncate rounded-sm border border-border bg-[color:var(--color-panel)] px-2 text-xs">
          {sectors.map((s) => <option key={s} value={s}>{s === "ALL" ? "All sectors" : s}</option>)}
        </select>
        <span className="label ml-auto">{view.length} companies</span>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-[color:var(--color-panel)]">
              <th className="px-3 py-2 text-left">{th("ticker", "Ticker")}</th>
              <th className="px-3 py-2 text-left">{th("name", "Company")}</th>
              <th className="px-3 py-2 text-right">{th("days", "Days public")}</th>
              <th className="label px-3 py-2 text-left">Age</th>
              <th className="label px-3 py-2 text-left">Sector</th>
              <th className="label px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.ticker} className="border-b border-border last:border-0 hover:bg-[color:var(--color-panel-2)]">
                <td className="px-3 py-2"><Link href={`/company/${r.ticker}`} className="mono" style={{ color: "var(--color-accent)" }}>{r.ticker}</Link></td>
                <td className="max-w-0 truncate px-3 py-2"><Link href={`/company/${r.ticker}`} className="hover:text-foreground">{r.name}</Link></td>
                <td className="mono px-3 py-2 text-right tabular-nums">{r.daysPublic ?? "—"}</td>
                <td className="label px-3 py-2 normal-case tracking-normal" style={{ color: r.bucket === "NEW" ? "var(--color-accent)" : undefined }}>{r.bucket}</td>
                <td className="max-w-[220px] truncate px-3 py-2 text-xs text-muted-foreground">{r.sector}</td>
                <td className="px-3 py-2 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <button title="Watch" onClick={() => toggleWatch(r.ticker, r.name)} className="rounded-sm border border-border px-1.5 py-0.5 text-xs transition-colors hover:border-[color:var(--color-accent)]" style={{ color: isWatched(r.ticker) ? "var(--color-accent)" : "var(--color-ink-faint)" }}>★</button>
                    <button title="Compare" onClick={() => toggleCompare(r.ticker)} className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider transition-colors hover:border-[color:var(--color-accent-2)]" style={{ color: inCompare(r.ticker) ? "var(--color-accent-2)" : "var(--color-ink-faint)" }}>vs</button>
                  </span>
                </td>
              </tr>
            ))}
            {view.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">No companies match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
