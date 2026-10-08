/** Animated SVG illustrations for "Core Technology" cards (light, ink + accent). */
export function TechVisual({ kind }: { kind: "graph" | "orbit" | "bars" }) {
  if (kind === "graph") {
    const nodes = [
      [40, 60], [100, 30], [160, 70], [70, 120], [140, 130], [100, 85], [190, 30], [20, 150],
    ];
    const edges = [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [2, 6], [3, 7], [0, 3], [2, 4]];
    return (
      <svg viewBox="0 0 210 170" className="h-full w-full" aria-hidden>
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
            stroke="var(--color-core)" strokeOpacity="0.5" strokeDasharray="4 6"
            className="animate-dash"
          />
        ))}
        {nodes.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={i === 5 ? 10 : 5} fill={i === 5 ? "var(--color-core)" : "var(--color-card)"} stroke="var(--color-ink)" strokeOpacity="0.5" />
            {i === 5 && <circle cx={x} cy={y} r="10" fill="none" stroke="var(--color-core)" className="origin-center animate-pulse-ring" style={{ transformBox: "fill-box" }} />}
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "orbit") {
    return (
      <svg viewBox="0 0 210 170" className="h-full w-full" aria-hidden>
        <g className="origin-center animate-spin-slow" style={{ transformBox: "fill-box" }}>
          {[0, 30, 60, 90, 120, 150].map((r) => (
            <ellipse key={r} cx="105" cy="85" rx="70" ry="22" fill="none" stroke="var(--color-ink)" strokeOpacity="0.25" transform={`rotate(${r} 105 85)`} />
          ))}
        </g>
        <circle cx="105" cy="85" r="18" fill="var(--color-core)" />
        <circle cx="168" cy="40" r="7" fill="var(--color-strategy)" className="animate-float" />
        <circle cx="45" cy="135" r="5" fill="var(--color-ink)" className="animate-float" style={{ animationDelay: "-3s" }} />
      </svg>
    );
  }
  const bars = [62, 88, 45, 110, 76, 130, 98];
  return (
    <svg viewBox="0 0 210 170" className="h-full w-full" aria-hidden>
      <rect x="20" y="20" width="170" height="130" rx="8" fill="var(--color-card)" stroke="var(--color-line-2)" />
      {bars.map((h, i) => (
        <rect
          key={i}
          x={34 + i * 22} y={140 - h * 0.85} width="13" height={h * 0.85} rx="3"
          fill={i === 5 ? "var(--color-strategy)" : "var(--color-core)"} fillOpacity={i === 5 ? 1 : 0.35 + i * 0.07}
          className="origin-bottom animate-[grow_1.4s_cubic-bezier(0.16,1,0.3,1)_both]"
          style={{ transformBox: "fill-box", animationDelay: `${i * 80}ms` }}
        />
      ))}
      <polyline points="40,100 62,80 84,105 106,60 128,72 150,38 172,55" fill="none" stroke="var(--color-ink)" strokeWidth="1.5" strokeDasharray="3 4" />
    </svg>
  );
}
