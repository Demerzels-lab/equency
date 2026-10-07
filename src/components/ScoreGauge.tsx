// Radial gauge for a 0..max score (Intelligence score, strategy fit). A 270° arc, value-filled,
// with the number centered. Static SVG: real data in, no animation dependency.

export function ScoreGauge({
  value,
  max = 100,
  size = 132,
  color,
  unit = "/ 100",
}: {
  value: number | null;
  max?: number;
  size?: number;
  color: string;
  unit?: string;
}) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const sweep = 0.75; // 270°
  const dash = c * sweep;
  const pct = value == null ? 0 : Math.max(0, Math.min(1, value / max));
  const off = dash * (1 - pct);

  const isSmall = size < 70;
  const isMedium = size >= 70 && size < 110;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 120 120">
        <g transform="rotate(135 60 60)" fill="none" strokeLinecap="round">
          <circle cx="60" cy="60" r={r} stroke="var(--color-line)" strokeWidth="5" strokeDasharray={`${dash} ${c}`} />
          <circle cx="60" cy="60" r={r} stroke={color} strokeWidth="5" strokeDasharray={`${dash} ${c}`} strokeDashoffset={off} />
        </g>
      </svg>
      <div className="text-center leading-none">
        {isSmall ? (
          <div className="font-mono text-xs font-bold" style={{ color }}>
            {value ?? "·"}<span className="text-[10px] font-normal text-muted-foreground">{unit.replace(/\s+/g, "")}</span>
          </div>
        ) : isMedium ? (
          <>
            <div className="mono text-2xl font-semibold" style={{ color }}>{value ?? "·"}</div>
            <div className="label text-[10px] mt-0.5">{unit}</div>
          </>
        ) : (
          <>
            <div className="mono text-4xl font-semibold" style={{ color }}>{value ?? "·"}</div>
            <div className="label mt-1">{unit}</div>
          </>
        )}
      </div>
    </div>
  );
}
