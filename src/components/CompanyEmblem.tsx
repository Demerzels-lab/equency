// A deterministic "intelligence signature" per company: orbit rings with nodes placed from a
// hash of the ticker, so every Intelligence Core has its own unique, repeatable mark.

function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function CompanyEmblem({ ticker, size = 52, accent = "var(--color-accent)" }: { ticker: string; size?: number; accent?: string }) {
  const rnd = mulberry(seedFrom(ticker || "EQ"));
  const rings = [12, 21, 30];
  const nodes = rings.flatMap((r, ri) => {
    const n = 2 + Math.floor(rnd() * 3);
    return Array.from({ length: n }, () => {
      const a = rnd() * Math.PI * 2;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, ring: ri, big: rnd() > 0.6 };
    });
  });
  const tilt = (rnd() * 40 - 20).toFixed(1);

  return (
    <svg width={size} height={size} viewBox="-40 -40 80 80" aria-hidden className="shrink-0">
      <g transform={`rotate(${tilt})`}>
        {rings.map((r, i) => (
          <ellipse key={i} cx="0" cy="0" rx={r} ry={r * 0.9} fill="none" stroke={i === 1 ? "var(--color-accent-2)" : accent} strokeOpacity={0.18} strokeWidth="0.6" />
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y * 0.9} r={n.big ? 1.9 : 1.1} fill={n.ring === 1 ? "var(--color-accent-2)" : accent} fillOpacity={0.9} />
        ))}
      </g>
      {/* core diamond */}
      <rect x="-3.2" y="-3.2" width="6.4" height="6.4" transform="rotate(45)" fill={accent} />
    </svg>
  );
}
