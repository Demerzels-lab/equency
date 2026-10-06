// Static fallback atmosphere for the fixed background layer: no canvas, no motion.
// Rendered server-side and whenever tier === "static" (no WebGL or reduced-motion).
// `ambient` variant is far subtler, for data-dense app pages.
export function Poster({ variant = "home" }: { variant?: "home" | "ambient" }) {
  const ambient = variant === "ambient";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: ambient
            ? `radial-gradient(60% 50% at 72% 28%, color-mix(in oklab, var(--color-accent) 7%, transparent), transparent 70%)`
            : `radial-gradient(42% 38% at 50% 40%, color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 72%)`,
        }}
      />
      {!ambient && (
        <svg className="absolute left-1/2 top-[40%] h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.3]" viewBox="-110 -110 220 220" fill="none">
          <defs>
            <radialGradient id="poster-g" cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="0" cy="0" r="104" fill="url(#poster-g)" />
          {/* globe: outline + latitude lines */}
          <circle cx="0" cy="0" r="62" stroke="var(--color-accent)" strokeOpacity="0.4" strokeWidth="0.5" />
          {[-44, -26, -9, 9, 26, 44].map((cy, i) => (
            <ellipse key={i} cx="0" cy={cy} rx={Math.round(Math.sqrt(Math.max(0, 62 * 62 - cy * cy)))} ry={Math.round(Math.sqrt(Math.max(0, 62 * 62 - cy * cy)) * 0.28)} stroke="var(--color-accent)" strokeOpacity="0.18" strokeWidth="0.4" />
          ))}
          {/* longitude hint */}
          <ellipse cx="0" cy="0" rx="22" ry="62" stroke="var(--color-accent)" strokeOpacity="0.16" strokeWidth="0.4" />
          {/* orbital rings */}
          <ellipse cx="0" cy="0" rx="100" ry="34" stroke="var(--color-accent)" strokeOpacity="0.3" strokeWidth="0.5" transform="rotate(-20)" />
          <ellipse cx="0" cy="0" rx="104" ry="28" stroke="var(--color-accent-2)" strokeOpacity="0.26" strokeWidth="0.5" transform="rotate(26)" />
        </svg>
      )}
      <div className="grid-bg absolute inset-0" style={{ opacity: ambient ? 0.18 : 0.35 }} />
    </div>
  );
}
