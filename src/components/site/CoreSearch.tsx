"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Search } from "lucide-react";
import clsx from "clsx";
import { CompanyEmblem } from "@/components/CompanyEmblem";
import { fmtUsd } from "@/lib/util/format";
import { coreMission, dayLabel } from "@/lib/core-identity";

type Dim = { key: string; label: string; value: number | null; basis: string };
type Core = {
  ticker: string;
  name: string;
  exchange: string;
  sector: string | null;
  daysPublic: number | null;
  price: number | null;
  changePct: number | null; // already a percentage (Finnhub `dp`)
  marketMode: "LIVE" | "SIMULATED";
  overall: number | null;
  dimensions: Dim[];
};
export type Uni = { ticker: string; name: string };

const PRESETS = ["RDDT", "ARM", "KVUE", "BIRK", "HOOD"];
const cache = new Map<string, Core>();

/** Live Intelligence Core lookup: SEC universe autocomplete → /api/core (deterministic score). */
export function CoreSearch({ seed }: { seed: Uni[] }) {
  const [universe, setUniverse] = useState<Uni[]>(seed);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [core, setCore] = useState<Core | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLFormElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (raw: string) => {
    const t = raw.trim().toUpperCase();
    if (!t) return;
    setError(null);
    const hit = cache.get(t);
    if (hit) { setCore(hit); return; }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      const r = await fetch(`/api/core?ticker=${encodeURIComponent(t)}`, { signal: ac.signal });
      if (!r.ok) { setError(r.status === 404 ? `No SEC registrant found for “${t}”.` : "Core temporarily unavailable."); return; }
      const data: Core = await r.json();
      cache.set(t, data);
      setCore(data);
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError")) setError("Network error.");
    } finally {
      if (abortRef.current === ac) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      let list = seed;
      if (list.length === 0) {
        try {
          const r = await fetch("/api/universe");
          if (r.ok) list = (await r.json()).universe ?? [];
        } catch { /* ignore */ }
        if (alive) setUniverse(list);
      }
      if (alive) load(list[0]?.ticker ?? PRESETS[0]);
    })();
    const onDoc = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", onDoc);
    return () => { alive = false; abortRef.current?.abort(); document.removeEventListener("click", onDoc); };
  }, [seed, load]);

  const s = q.trim().toLowerCase();
  const matches = (s ? universe.filter((u) => u.ticker.toLowerCase().includes(s) || u.name.toLowerCase().includes(s)) : universe).slice(0, 6);

  const pick = (t: string) => { setQ(t); setOpen(false); load(t); };

  return (
    <div className="w-full max-w-xl text-left">
      <form
        ref={boxRef}
        onSubmit={(e) => { e.preventDefault(); pick(matches[0]?.ticker ?? q); }}
        className="relative flex items-center gap-2 rounded-lg bg-card/85 p-1.5 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.8)] ring-1 ring-line backdrop-blur-md transition focus-within:ring-2 focus-within:ring-core"
      >
        <Search size={18} className="ml-2.5 shrink-0 text-ink-3" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Find a company’s Intelligence Core…"
          aria-label="Search company"
          autoComplete="off"
          spellCheck={false}
          maxLength={40}
          className="min-w-0 flex-1 bg-transparent py-2 font-body text-[15px] outline-none placeholder:text-ink-3"
        />
        <button type="submit" disabled={loading} className="rounded bg-core px-4 py-2.5 text-sm text-white transition-colors hover:bg-core/85 disabled:opacity-60">
          {loading ? "Resolving…" : "Find Core"}
        </button>
        <AnimatePresence>
          {open && matches.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.16 }}
              className="absolute inset-x-0 top-full z-30 mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line bg-card shadow-xl"
            >
              {matches.map((u) => (
                <li key={u.ticker}>
                  <button type="button" onClick={() => pick(u.ticker)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-paper">
                    <span className="w-16 font-mono text-xs font-bold text-core">{u.ticker}</span>
                    <span className="truncate font-body text-xs text-ink-2">{u.name}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <span className="mr-1 font-body text-xs text-ink-3">Try</span>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => pick(p)}
            className={clsx(
              "rounded px-2 py-1 font-mono text-[11px] ring-1 ring-inset transition-colors",
              core?.ticker === p ? "bg-core text-white ring-core" : "bg-card/70 text-ink-2 ring-line hover:text-core hover:ring-core",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[124px]">
        {error && <p className="rounded-lg bg-card/80 px-4 py-3 text-center font-body text-sm text-danger ring-1 ring-line">{error}</p>}
        <AnimatePresence mode="wait">
          {core && !error && (
            <motion.div
              key={core.ticker}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={clsx("rounded-xl bg-card/90 p-4 ring-1 ring-line backdrop-blur-md transition-opacity", loading && "opacity-60")}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <CompanyEmblem ticker={core.ticker} size={40} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{core.ticker}</span>
                      <span className="rounded-full bg-core-soft px-2 py-0.5 text-[10px] tracking-wider text-core">{core.exchange || "SEC"}</span>
                    </div>
                    <div className="truncate font-body text-xs text-ink-3">{core.name}</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-semibold">{core.price != null ? fmtUsd(core.price) : "—"}</div>
                  {core.changePct != null ? (
                    <div className={clsx("text-xs", core.changePct >= 0 ? "text-pos" : "text-danger")}>
                      {core.changePct >= 0 ? "+" : ""}{core.changePct.toFixed(2)}%
                    </div>
                  ) : (
                    <div className="text-[10px] text-sim">SIMULATED</div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative grid size-10 shrink-0 place-items-center">
                    <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-line)" strokeWidth="3" />
                      <motion.circle
                        cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-core)" strokeWidth="3" strokeLinecap="round"
                        pathLength={100}
                        initial={{ strokeDasharray: "0 100" }}
                        animate={{ strokeDasharray: `${Math.max(0, Math.min(100, core.overall ?? 0))} 100` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </svg>
                    <span className="font-mono text-[11px] font-bold text-core">{core.overall ?? "–"}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="eyebrow text-[9px] text-core">Intelligence score</div>
                    <div className="truncate font-body text-xs text-ink-3">
                      {dayLabel(core.daysPublic)} · {coreMission(core.daysPublic).phase}
                      {core.sector ? ` · ${core.sector}` : ""}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/company/${encodeURIComponent(core.ticker)}`}
                  className="flex shrink-0 items-center gap-1 rounded px-3 py-1.5 text-xs ring-1 ring-inset ring-line-2 transition-colors hover:bg-ink hover:text-paper hover:ring-ink"
                >
                  Enter Core <ArrowUpRight size={13} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
