// Mini sparkline from a real close-price series. Trend-coloured (up = pos, down = danger)
// unless a colour is given. Renders nothing (just reserves space) when there's no data.

export function Sparkline({
  data,
  w = 64,
  h = 20,
  color,
}: {
  data: number[] | null | undefined;
  w?: number;
  h?: number;
  color?: string;
}) {
  if (!data || data.length < 2) return <span className="inline-block shrink-0" style={{ width: w, height: h }} aria-hidden />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const up = data[data.length - 1] >= data[0];
  const c = color ?? (up ? "var(--color-pos)" : "var(--color-danger)");
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible" aria-hidden>
      <path d={area} fill={c} fillOpacity="0.12" />
      <path d={line} fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ex} cy={ey} r="1.6" fill={c} />
    </svg>
  );
}
