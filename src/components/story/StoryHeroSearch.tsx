"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScoreGauge } from "@/components/ScoreGauge";
import { CompanyEmblem } from "@/components/CompanyEmblem";
import { fmtUsd } from "@/lib/util/format";

type Dim = { key: string; label: string; value: number | null; basis: string };
type Core = {
  ticker: string;
  name: string;
  exchange: string;
  sector: string | null;
  daysPublic: number | null;
  price: number | null;
  changePct: number | null;
  marketMode: "LIVE" | "SIMULATED";
  overall: number | null;
  dimensions: Dim[];
};
type Uni = { ticker: string; name: string };

const PRESETS = ["RDDT", "ARM", "KVUE", "BIRK", "HOOD"];
const coreCache = new Map<string, Core>();

export function StoryHeroSearch({
  seed,
  onTickerChange,
}: {
  seed?: Uni[];
  onTickerChange?: (ticker: string) => void;
}) {
  const [universe, setUniverse] = useState<Uni[]>(seed ?? []);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [core, setCore] = useState<Core | null>(null);
  const [loading, setLoading] = useState(false);

  const boxRef = useRef<HTMLFormElement>(null);
  const onTickerRef = useRef(onTickerChange);
  onTickerRef.current = onTickerChange;

  const initialLoadedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async (ticker: string) => {
    const clean = ticker.trim().toUpperCase();
    if (!clean) return;

    onTickerRef.current?.(clean);

    const cached = coreCache.get(clean);
    if (cached) {
      setCore(cached);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;

    setLoading(true);
    try {
      const r = await fetch(`/api/core?ticker=${encodeURIComponent(clean)}`, {
        signal: ac.signal,
      });
      if (r.ok) {
        const data: Core = await r.json();
        coreCache.set(clean, data);
        setCore(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;

    let alive = true;
    (async () => {
      let list = seed ?? [];
      if (list.length === 0) {
        try {
          const r = await fetch("/api/universe");
          if (r.ok) {
            const data = await r.json();
            list = data.universe ?? [];
          }
        } catch {
          /* ignore */
        }
      }
      if (!alive) return;
      setUniverse(list);
      if (list[0]?.ticker) {
        load(list[0].ticker);
      }
    })();

    return () => {
      alive = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [seed, load]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const s = q.trim().toLowerCase();
  const matches = s
    ? universe
        .filter(
          (u) =>
            u.ticker.toLowerCase().includes(s) || u.name.toLowerCase().includes(s)
        )
        .slice(0, 5)
    : universe.slice(0, 5);

  const pick = (ticker: string) => {
    setQ(ticker);
    setOpen(false);
    load(ticker);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const first = matches[0];
    if (first) pick(first.ticker);
    else if (q.trim()) pick(q.trim().toUpperCase());
  };

  return (
    <div className="w-full space-y-4">
      {/* Editorial Search Bar ala RobinID */}
      <form onSubmit={submit} ref={boxRef} className="hero-search">
        <div className="hero-field">
          <input
            id="hero-name"
            value={q}
            onChange={(e) => {
              const val = e.target.value;
              setQ(val);
              setOpen(true);
              onTickerRef.current?.(val);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search company or ticker…"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck="false"
            maxLength={16}
          />
          <span aria-hidden="true">.SEC</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-ember"
        >
          {loading ? "Resolving…" : "Check Core"}
        </button>

        {open && matches.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-xl divide-y divide-slate-100">
            {matches.map((u) => (
              <li key={u.ticker}>
                <button
                  type="button"
                  onClick={() => pick(u.ticker)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="font-mono text-xs font-bold text-[#0284c7]">
                    {u.ticker}
                  </span>
                  <span className="truncate text-xs text-slate-600 ml-3">
                    {u.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Preset emiten triggers styled as Web3 cryptographic keychips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="font-mono text-xs text-slate-500 mr-1">Sample Cores:</span>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => pick(p)}
            className="px-2.5 py-1 rounded-md border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-700 shadow-xs transition-all hover:border-[#0284c7] hover:text-[#0284c7] active:scale-95"
          >
            [{p}]
          </button>
        ))}
        <span className="font-mono text-[11px] text-slate-400 ml-auto hidden sm:inline">
          3D canvas responds live
        </span>
      </div>

      {/* Live Core Preview Dossier */}
      {core && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur-md transition-all text-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <CompanyEmblem ticker={core.ticker} size={40} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900">
                    {core.ticker}
                  </span>
                  <span className="font-mono text-[10px] tracking-wider uppercase text-[#0284c7] border border-sky-200 bg-sky-50 px-2 py-0.5 rounded-full font-semibold">
                    {core.exchange || "SEC"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-[280px]">
                  {core.name}
                </div>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-sm font-bold text-slate-900">
                {core.price != null ? fmtUsd(core.price) : "-"}
              </div>
              {core.changePct != null && (
                <div
                  className={`text-xs font-semibold ${
                    core.changePct >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {core.changePct >= 0 ? "+" : ""}
                  {(core.changePct * 100).toFixed(2)}%
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mini Precision Radial Ring */}
              <div className="relative w-9 h-9 flex-shrink-0 grid place-items-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="3"
                    strokeDasharray={`${Math.max(0, Math.min(100, core.overall ?? 0))}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-mono text-[10px] font-bold text-[#0284c7]">
                  {core.overall ?? "-"}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#0284c7] font-semibold">
                    Intelligence Score
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {core.overall != null ? `${core.overall}/100` : "-/100"}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {core.daysPublic != null ? `${core.daysPublic}d Public` : "Newly Public"}
                </div>
              </div>
            </div>

            <Link
              href={`/company/${encodeURIComponent(core.ticker)}`}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors shrink-0"
            >
              Open Full Thesis →
            </Link>
          </div>
        </div>
      )}

      {/* Hero Stats */}
      <dl className="hero-stats">
        <div>
          <dt>100%</dt>
          <dd>Deterministic</dd>
        </div>
        <div>
          <dt>3</dt>
          <dd>Rank Strategies</dd>
        </div>
        <div>
          <dt>14 / 14</dt>
          <dd>Foundry Tests</dd>
        </div>
      </dl>
    </div>
  );
}
