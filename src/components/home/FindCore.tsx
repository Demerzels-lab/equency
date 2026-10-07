"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScoreGauge } from "@/components/ScoreGauge";
import { CompanyEmblem } from "@/components/CompanyEmblem";
import { DataModeBadge } from "@/components/primitives";
import { fmtUsd } from "@/lib/util/format";

type Dim = { key: string; label: string; value: number | null; basis: string };
type Core = {
  ticker: string; name: string; exchange: string; sector: string | null;
  daysPublic: number | null; ageBucket: string | null;
  price: number | null; changePct: number | null; marketMode: "LIVE" | "SIMULATED";
  overall: number | null; dimensions: Dim[];
};
type Uni = { ticker: string; name: string };

export function FindCore({ seed }: { seed?: Uni[] }) {
  const [universe, setUniverse] = useState<Uni[]>(seed ?? []);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [core, setCore] = useState<Core | null>(null);
  const [loading, setLoading] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (ticker: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/core?ticker=${encodeURIComponent(ticker)}`);
      if (r.ok) setCore(await r.json());
    } catch { /* keep previous */ }
    finally { setLoading(false); }
  }, []);

  // Load the universe + pre-populate with the most-recent IPO (show, don't tell).
  useEffect(() => {
    let alive = true;
    (async () => {
      let list = seed ?? [];
      if (list.length === 0) {
        try { const r = await fetch("/api/universe"); list = (await r.json()).universe ?? []; } catch { /* ignore */ }
      }
      if (!alive) return;
      setUniverse(list);
      if (list[0]?.ticker) load(list[0].ticker); else setLoading(false);
    })();
    return () => { alive = false; };
  }, [seed, load]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const s = q.trim().toLowerCase();
  const matches = s
    ? universe.filter((u) => u.ticker.toLowerCase().includes(s) || u.name.toLowerCase().includes(s)).slice(0, 7)
    : universe.slice(0, 7);

  const pick = (ticker: string) => { setQ(""); setOpen(false); load(ticker); };
  const submit = () => { const first = matches[0]; if (first) pick(first.ticker); };

  return (
    <section className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
      <h1 className="display mx-auto max-w-[17ch] text-[clamp(2.3rem,6vw,4.5rem)] text-balance">
        Intelligence for the newly public.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
        Type a company that just went public. Its Intelligence Core, scored from real SEC and market
        signals, appears instantly.
      </p>

      {/* the signature: search → live Core */}
      <div ref={boxRef} className="relative mx-auto mt-9 max-w-xl">
        <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-line-strong)] bg-[color:var(--color-panel)] px-4 py-3 focus-within:border-[color:var(--color-accent)]">
          <span className="text-muted-foreground">⌕</span>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
            placeholder="Search a ticker or company…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        {open && matches.length > 0 && (
          <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-[color:var(--color-panel)] text-left shadow-2xl">
            {matches.map((u) => (
              <li key={u.ticker}>
                <button onClick={() => pick(u.ticker)} className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[color:var(--color-panel-2)]">
                  <span className="mono text-sm text-[color:var(--color-accent)]">{u.ticker}</span>
                  <span className="flex-1 truncate text-xs text-muted-foreground">{u.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* suggestion chips: real recent detections */}
      {universe.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Just public:</span>
          {universe.slice(0, 5).map((u) => (
            <button key={u.ticker} onClick={() => pick(u.ticker)} className="mono rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[color:var(--color-accent)] hover:text-foreground">
              {u.ticker}
            </button>
          ))}
        </div>
      )}

      <CorePreview core={core} loading={loading} />
    </section>
  );
}

function CorePreview({ core, loading }: { core: Core | null; loading: boolean }) {
  const dims = (core?.dimensions ?? []).slice(0, 3);
  const up = (core?.changePct ?? 0) >= 0;
  return (
    <div
      key={core?.ticker ?? "loading"}
      className="mx-auto mt-10 max-w-2xl rounded-lg border border-border bg-[color:color-mix(in_oklab,var(--color-card)_70%,transparent)] p-6 text-left transition-opacity duration-300"
      style={{ opacity: loading ? 0.55 : 1 }}
    >
      {!core ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Resolving a live Intelligence Core…</div>
      ) : (
        <>
          <div className="flex items-start gap-4">
            <CompanyEmblem ticker={core.ticker} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-lg font-semibold tracking-tight">{core.name}</span>
                <span className="label">{core.exchange}: {core.ticker}</span>
                <DataModeBadge mode={core.marketMode} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {core.daysPublic ?? "?"} days public · {core.ageBucket ?? "newly public"}
                {core.sector ? ` · ${core.sector}` : ""}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex items-center justify-center sm:justify-start">
              <ScoreGauge value={core.overall} color="var(--color-accent)" size={116} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline justify-between">
                <span className="label">Last price</span>
                <span className="mono text-sm" style={{ color: core.price == null ? "var(--color-ink-faint)" : up ? "var(--color-pos)" : "var(--color-danger)" }}>
                  {core.price != null ? fmtUsd(core.price) : "-"}
                  {core.changePct != null ? ` (${up ? "+" : ""}${core.changePct.toFixed(2)}%)` : ""}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2.5">
                {dims.map((d) => (
                  <div key={d.key}>
                    <div className="flex items-baseline justify-between">
                      <span className="label normal-case tracking-normal text-muted-foreground">{d.label}</span>
                      <span className="mono text-xs" style={{ color: d.value == null ? "var(--color-ink-faint)" : "var(--color-ink)" }}>{d.value ?? "n/a"}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full" style={{ width: `${d.value ?? 0}%`, background: d.key === "risk" ? "var(--color-danger)" : "var(--color-pos)", opacity: d.value == null ? 0.3 : 1 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <Link href={`/company/${core.ticker}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-accent)] transition-opacity hover:opacity-80">
              Open Intelligence Core →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
