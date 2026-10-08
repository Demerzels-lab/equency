"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { allocateCapital } from "@/lib/strategy/allocate";
import { Panel } from "@/components/primitives";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkline } from "@/components/Sparkline";
import type { Recommendation, StrategyConfig, UserConstraints } from "@/lib/strategy/types";

const RISK_CAP: Record<UserConstraints["riskTolerance"], number> = { low: 60, medium: 78, high: 101 };

export function StrategyWorkbench({ strategy, recs, sparks = {} }: { strategy: StrategyConfig; recs: Recommendation[]; sparks?: Record<string, number[] | null> }) {
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
  function setCap(v: number) { setCapital(v); localStorage.setItem("equency.capital", String(v)); }
  function toggleExclude(t: string) {
    update({ excluded: c.excluded.includes(t) ? c.excluded.filter((x) => x !== t) : [...c.excluded, t] });
  }

  const eligible = recs.filter((r) => (r.risk ?? 0) <= RISK_CAP[c.riskTolerance]);
  const alloc = allocateCapital(
    eligible.map((r) => ({ ticker: r.ticker, fit: r.fit })),
    { maxPositions: c.maxPositions, maxPosition: c.maxPosition, cashReserve: c.cashReserve, excluded: c.excluded },
  );
  const allocMap = new Map(alloc.allocations.map((a) => [a.ticker, a.pct]));

  const pct = (f: number) => `${(f * 100).toFixed(0)}%`;
  const usd = (f: number) => `$${Math.round(capital * f).toLocaleString("en-US")}`;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[300px_1fr]" style={{ opacity: ready ? 1 : 0.6 }}>
      {/* Constraints */}
      <Panel title="Your constraints" className="h-max">
        <Field label="Capital">
          <div className="flex items-center gap-1.5 rounded-sm border border-border px-2">
            <span className="mono text-sm text-muted-foreground">$</span>
            <Input
              type="number" value={capital} min={1000} step={1000}
              onChange={(e) => setCap(Math.max(0, Number(e.target.value)))}
              className="mono h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </Field>

        <SliderField label="Max position" value={c.maxPosition} min={0.05} max={0.5} step={0.05} display={pct(c.maxPosition)} onChange={(v) => update({ maxPosition: v })} />
        <SliderField label="Cash reserve" value={c.cashReserve} min={0} max={0.6} step={0.05} display={pct(c.cashReserve)} onChange={(v) => update({ cashReserve: v })} />
        <SliderField label="Max positions" value={c.maxPositions} min={1} max={8} step={1} display={String(c.maxPositions)} onChange={(v) => update({ maxPositions: v })} />

        <Field label="Risk tolerance">
          <div className="flex gap-1">
            {(["low", "medium", "high"] as const).map((t) => (
              <Button
                key={t} type="button" size="sm"
                variant={c.riskTolerance === t ? "secondary" : "outline"}
                onClick={() => update({ riskTolerance: t })}
                className="label flex-1 rounded-sm"
              >
                {t}
              </Button>
            ))}
          </div>
        </Field>

        <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem(key); setC(defaults); }} className="label mt-1 w-full rounded-sm">
          Reset to defaults
        </Button>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          You pick the strategy and control the limits. Allocations are deterministic and fit-weighted, never set by the model.
        </p>
      </Panel>

      {/* Ranked recommendations */}
      <Panel title={`Ranked recommendations · ${recs.length}`} className="min-w-0" bodyClassName="p-0">
        {/* Institutional Segmented Capital Allocation Bar (Brief §28-§33) */}
        <div className="p-3.5 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-muted-foreground mb-1.5 tracking-wider">
            <span>Portfolio Composition</span>
            <span>100% Capital Accounted</span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-sm bg-secondary border border-border/80">
            {alloc.allocations.map((a, i) => (
              <div
                key={a.ticker}
                style={{ width: `${a.pct * 100}%` }}
                className={`h-full border-r border-black/40 ${
                  i % 3 === 0 ? "bg-emerald-500" : i % 3 === 1 ? "bg-cyan-500" : "bg-indigo-500"
                }`}
                title={`${a.ticker}: ${(a.pct * 100).toFixed(0)}%`}
              />
            ))}
            {alloc.cashPct > 0 && (
              <div
                style={{ width: `${alloc.cashPct * 100}%` }}
                className="h-full bg-muted-foreground/30"
                title={`Cash Reserve: ${(alloc.cashPct * 100).toFixed(0)}%`}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-mono">
            {alloc.allocations.map((a, i) => (
              <span key={a.ticker} className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-xs ${
                    i % 3 === 0 ? "bg-emerald-500" : i % 3 === 1 ? "bg-cyan-500" : "bg-indigo-500"
                  }`}
                />
                <span className="text-foreground font-semibold">{a.ticker}</span>
                <span className="text-muted-foreground">{(a.pct * 100).toFixed(0)}%</span>
              </span>
            ))}
            {alloc.cashPct > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-xs bg-muted-foreground/40" />
                <span>USDG Reserve</span>
                <span>{(alloc.cashPct * 100).toFixed(0)}%</span>
              </span>
            )}
          </div>
        </div>

        {recs.length === 0 ? (
          <div className="p-6 text-xs text-muted-foreground">No recommendations resolved from the live universe right now.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="label h-8 w-8">#</TableHead>
                <TableHead className="label h-8">Company</TableHead>
                <TableHead className="label h-8 w-14 text-right">Score</TableHead>
                <TableHead className="label h-8 w-[76px]">Trend</TableHead>
                <TableHead className="label h-8 w-[150px]">Strategy fit</TableHead>
                <TableHead className="label h-8 w-[120px] text-right">Allocation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recs.map((r, i) => {
                const a = allocMap.get(r.ticker);
                const excluded = c.excluded.includes(r.ticker);
                const gated = (r.risk ?? 0) > RISK_CAP[c.riskTolerance];
                const dim = excluded || gated;
                return (
                  <TableRow key={r.ticker} className="border-border" style={{ opacity: dim ? 0.45 : 1 }}>
                    <TableCell className="mono text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <Link href={`/strategies/${strategy.key}/${r.ticker}`} className="block min-w-0 hover:opacity-100">
                        <div className="flex items-center gap-2">
                          <span className="mono text-sm" style={{ color: "var(--color-accent)" }}>{r.ticker}</span>
                          <span className="truncate text-sm">{r.name}</span>
                        </div>
                        <div className="label normal-case tracking-normal text-muted-foreground">{r.daysPublic ?? "?"}d public · {r.sector ?? ""}</div>
                      </Link>
                    </TableCell>
                    <TableCell className="mono text-right text-sm">{r.score ?? "·"}</TableCell>
                    <TableCell><Sparkline data={sparks[r.ticker]} w={60} h={18} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.round(r.fit * 100)} className="h-1.5 w-full flex-1 bg-secondary [&_[data-slot=progress-indicator]]:bg-[var(--color-accent)]" />
                        <span className="mono text-xs text-muted-foreground">{Math.round(r.fit * 100)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {dim ? (
                        <button onClick={() => toggleExclude(r.ticker)} className="label">
                          {excluded ? "excluded ↺" : "risk-gated"}
                        </button>
                      ) : a ? (
                        <div>
                          <div className="mono text-sm">{pct(a)}</div>
                          <div className="label normal-case tracking-normal text-muted-foreground">{usd(a)}</div>
                        </div>
                      ) : (
                        <span className="label text-muted-foreground">·</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="border-0 bg-secondary/60 hover:bg-secondary/60">
                <TableCell />
                <TableCell className="label" colSpan={4}>Cash reserve · USDG (Phase 3)</TableCell>
                <TableCell className="text-right">
                  <div className="mono text-sm text-muted-foreground">{pct(alloc.cashPct)}</div>
                  <div className="label normal-case tracking-normal text-muted-foreground">{usd(alloc.cashPct)}</div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="label mb-1.5 normal-case tracking-normal text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function SliderField({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void;
}) {
  return (
    <Field label={`${label} · ${display}`}>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))} className="py-1" />
    </Field>
  );
}
