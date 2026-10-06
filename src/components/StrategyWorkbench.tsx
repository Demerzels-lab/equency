"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { allocateCapital } from "@/lib/strategy/allocate";
import type { Recommendation, StrategyConfig, UserConstraints } from "@/lib/strategy/types";

const RISK_CAP: Record<UserConstraints["riskTolerance"], number> = { low: 60, medium: 78, high: 101 };

export function StrategyWorkbench({ strategy, recs }: { strategy: StrategyConfig; recs: Recommendation[] }) {
  const key = `equency.constraints.${strategy.key}`;
  const defaults: UserConstraints = useMemo(
    () => ({
      maxPositions: strategy.maxPositions,
      maxPosition: strategy.maxPosition,
      cashReserve: strategy.cashReserve,
      riskTolerance: strategy.riskStance === "averse" ? "low" : strategy.riskStance === "tolerant" ? "high" : "medium",
      excluded: [],
    }),
    [strategy],
  );

  const [c, setC] = useState<UserConstraints>(defaults);
  const [capital, setCapital] = useState(10000);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setC({ ...defaults, ...JSON.parse(raw) });
      const cap = localStorage.getItem("equency.capital");
      if (cap) setCapital(Number(cap) || 10000);
    } catch { /* ignore */ }
    setReady(true);
  }, [key, defaults]);

  function update(patch: Partial<UserConstraints>) {
    setC((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }
  function setCap(v: number) {
    setCapital(v);
    localStorage.setItem("equency.capital", String(v));
  }
  function toggleExclude(t: string) {
    update({ excluded: c.excluded.includes(t) ? c.excluded.filter((x) => x !== t) : [...c.excluded, t] });
  }

  // Risk tolerance gates eligibility; excluded names drop out; rest ranked by fit.
  const eligible = recs.filter((r) => (r.risk ?? 0) <= RISK_CAP[c.riskTolerance]);
  const alloc = allocateCapital(
    eligible.map((r) => ({ ticker: r.ticker, fit: r.fit })),
    { maxPositions: c.maxPositions, maxPosition: c.maxPosition, cashReserve: c.cashReserve, excluded: c.excluded },
  );
  const allocMap = new Map(alloc.allocations.map((a) => [a.ticker, a.pct]));

  const pct = (f: number) => `${(f * 100).toFixed(0)}%`;
  const usd = (f: number) => `$${Math.round(capital * f).toLocaleString("en-US")}`;

  return (
    <div className="grid gap-3 lg:grid-cols-[300px_1fr]" style={{ opacity: ready ? 1 : 0.6 }}>
      {/* ---- Constraints (brief §29) ---- */}
      <aside className="panel h-max p-4">
        <div className="label mb-3">Your Constraints</div>

        <Field label="Capital">
          <div className="flex items-center gap-1">
            <span className="mono text-sm" style={{ color: "var(--color-ink-faint)" }}>$</span>
            <input
              type="number"
              value={capital}
              min={1000}
              step={1000}
              onChange={(e) => setCap(Math.max(0, Number(e.target.value)))}
              className="mono w-full bg-transparent text-sm outline-none"
              style={{ color: "var(--color-ink)" }}
            />
          </div>
        </Field>

        <Slider label="Max position" value={c.maxPosition} min={0.05} max={0.5} step={0.05}
          display={pct(c.maxPosition)} onChange={(v) => update({ maxPosition: v })} />
        <Slider label="Cash reserve" value={c.cashReserve} min={0} max={0.6} step={0.05}
          display={pct(c.cashReserve)} onChange={(v) => update({ cashReserve: v })} />

        <Field label={`Max positions · ${c.maxPositions}`}>
          <input type="range" min={1} max={8} step={1} value={c.maxPositions}
            onChange={(e) => update({ maxPositions: Number(e.target.value) })}
            className="w-full accent-[color:var(--color-accent)]" />
        </Field>

        <Field label="Risk tolerance">
          <div className="flex gap-1">
            {(["low", "medium", "high"] as const).map((t) => (
              <button key={t} onClick={() => update({ riskTolerance: t })}
                className="label flex-1 px-2 py-1.5 transition-colors"
                style={{
                  border: "1px solid var(--color-line)",
                  color: c.riskTolerance === t ? "var(--color-ink)" : "var(--color-ink-faint)",
                  background: c.riskTolerance === t ? "var(--color-panel-2)" : "transparent",
                  borderColor: c.riskTolerance === t ? "var(--color-accent)" : "var(--color-line)",
                }}>
                {t}
              </button>
            ))}
          </div>
        </Field>

        <button onClick={() => { localStorage.removeItem(key); setC(defaults); }}
          className="label mt-2 w-full py-1.5 transition-colors hover:text-[color:var(--color-ink)]"
          style={{ border: "1px solid var(--color-line)" }}>
          Reset to strategy defaults
        </button>

        <p className="label mt-3 normal-case leading-relaxed" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
          You choose the strategy and control the constraints. Allocations are deterministic, fit-weighted,
          capped · never set by the model.
        </p>
      </aside>

      {/* ---- Ranked recommendations + allocation (brief §27) ---- */}
      <div className="panel overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_64px_1fr_120px] items-center gap-3 border-b hairline px-4 py-2">
          <span className="label">#</span>
          <span className="label">Company</span>
          <span className="label text-right">Score</span>
          <span className="label">Strategy fit</span>
          <span className="label text-right">Allocation</span>
        </div>

        {recs.length === 0 && (
          <div className="p-6 text-xs" style={{ color: "var(--color-ink-faint)" }}>
            No recommendations resolved from the live universe right now.
          </div>
        )}

        {recs.map((r, i) => {
          const a = allocMap.get(r.ticker);
          const excluded = c.excluded.includes(r.ticker);
          const gated = (r.risk ?? 0) > RISK_CAP[c.riskTolerance];
          const dim = excluded || gated;
          return (
            <div key={r.ticker} className="grid grid-cols-[32px_1fr_64px_1fr_120px] items-center gap-3 border-b hairline px-4 py-3 transition-opacity"
              style={{ opacity: dim ? 0.4 : 1 }}>
              <span className="mono text-sm" style={{ color: "var(--color-ink-faint)" }}>{i + 1}</span>
              <Link href={`/strategies/${strategy.key}/${r.ticker}`} className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="mono text-sm" style={{ color: "var(--color-accent)" }}>{r.ticker}</span>
                  <span className="truncate text-sm" style={{ color: "var(--color-ink)" }}>{r.name}</span>
                </div>
                <div className="label normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
                  {r.daysPublic ?? "?"}d public · {r.sector ?? ""}
                </div>
              </Link>
              <span className="mono text-right text-sm" style={{ color: "var(--color-ink)" }}>{r.score ?? "·"}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--color-panel-2)" }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.round(r.fit * 100)}%`, background: "var(--color-accent)" }} />
                </div>
                <span className="mono text-xs" style={{ color: "var(--color-ink-dim)" }}>{Math.round(r.fit * 100)}</span>
              </div>
              <div className="text-right">
                {dim ? (
                  <button onClick={() => toggleExclude(r.ticker)} className="label" style={{ color: "var(--color-ink-faint)" }}>
                    {excluded ? "excluded ↺" : gated ? "risk-gated" : ""}
                  </button>
                ) : a ? (
                  <div>
                    <div className="mono text-sm" style={{ color: "var(--color-ink)" }}>{pct(a)}</div>
                    <div className="label" style={{ color: "var(--color-ink-faint)" }}>{usd(a)}</div>
                  </div>
                ) : (
                  <button onClick={() => toggleExclude(r.ticker)} className="label" title="Below allocation cut-off">
                    <span style={{ color: "var(--color-ink-faint)" }}>·</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Cash row */}
        <div className="grid grid-cols-[32px_1fr_64px_1fr_120px] items-center gap-3 px-4 py-3" style={{ background: "var(--color-panel-2)" }}>
          <span />
          <span className="label">Cash reserve · USDG (Phase 3)</span>
          <span />
          <span />
          <div className="text-right">
            <div className="mono text-sm" style={{ color: "var(--color-ink-dim)" }}>{pct(alloc.cashPct)}</div>
            <div className="label" style={{ color: "var(--color-ink-faint)" }}>{usd(alloc.cashPct)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="label mb-1.5 normal-case" style={{ letterSpacing: 0 }}>{label}</div>
      {children}
    </div>
  );
}

function Slider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void;
}) {
  return (
    <Field label={`${label} · ${display}`}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--color-accent)]" />
    </Field>
  );
}
