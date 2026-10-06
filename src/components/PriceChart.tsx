"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { ChartRange, PriceSeries } from "@/lib/providers/yahoo";

const RANGES: ChartRange[] = ["1D", "5D", "1M", "3M", "6M", "SINCE IPO"];
const config = { close: { label: "Price", color: "var(--color-accent)" } } satisfies ChartConfig;

export function PriceChart({ symbol, daysPublic, initial }: { symbol: string; daysPublic?: number; initial: PriceSeries | null }) {
  const [range, setRange] = useState<ChartRange>("SINCE IPO");
  const [series, setSeries] = useState<PriceSeries | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const cache = useRef<Map<string, PriceSeries>>(new Map());

  useEffect(() => { if (initial) cache.current.set("SINCE IPO", initial); }, [initial]);

  async function pick(r: ChartRange) {
    setRange(r);
    const hit = cache.current.get(r);
    if (hit) { setSeries(hit); setError(false); return; }
    setLoading(true); setError(false);
    try {
      const qs = new URLSearchParams({ range: r });
      if (daysPublic != null) qs.set("days", String(daysPublic));
      const res = await fetch(`/api/prices/${symbol}?${qs}`);
      if (!res.ok) throw new Error();
      const data: PriceSeries = await res.json();
      cache.current.set(r, data);
      setSeries(data);
    } catch { setError(true); setSeries(null); }
    finally { setLoading(false); }
  }

  const data = useMemo(() => series?.points.map((p, i) => ({ i, t: p.t, close: p.close })) ?? [], [series]);
  const up = series ? series.points[series.points.length - 1].close >= series.points[0].close : true;
  const stroke = up ? "var(--color-pos)" : "var(--color-danger)";
  const stats = useMemo(() => {
    if (!series) return null;
    const ys = series.points.map((p) => p.close);
    return { high: Math.max(...ys), low: Math.min(...ys), last: ys[ys.length - 1] };
  }, [series]);
  const px = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => pick(r)}
              className={cn(
                "mono rounded-sm border px-2 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors",
                r === range ? "border-border-strong bg-secondary text-foreground" : "border-border text-muted-foreground hover:text-foreground",
              )}
              style={r === range ? { borderColor: "var(--color-line-strong)" } : undefined}
            >
              {r}
            </button>
          ))}
        </div>
        {series && <span className="mono text-[10px] tracking-wide text-muted-foreground">Yahoo · {series.points.length} pts</span>}
      </div>

      <div className="h-45">
        {data.length > 1 ? (
          <ChartContainer config={config} className="aspect-auto h-45 w-full">
            <AreaChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <ChartTooltip
                cursor={{ stroke: "var(--color-line-strong)", strokeWidth: 1 }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="mono rounded-sm border bg-popover px-2 py-1 text-xs" style={{ borderColor: "var(--color-line)" }}>
                      <span style={{ color: stroke }}>{px(Number(payload[0].value))}</span>
                      <span className="ml-2 text-muted-foreground">{new Date(Number(payload[0].payload.t) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  ) : null
                }
              />
              <Area type="monotone" dataKey="close" stroke={stroke} strokeWidth={1.6} fill="url(#pc-fill)" isAnimationActive={false} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {loading ? "Loading…" : error ? "Price series unavailable for this range." : "No data."}
          </div>
        )}
      </div>

      {stats && (
        <div className="mono mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span>H <span className="text-foreground/80">{px(stats.high)}</span></span>
          <span>L <span className="text-foreground/80">{px(stats.low)}</span></span>
          <span>Last <span style={{ color: stroke }}>{px(stats.last)}</span></span>
        </div>
      )}
    </div>
  );
}
