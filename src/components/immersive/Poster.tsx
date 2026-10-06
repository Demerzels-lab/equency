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
          background: `radial-gradient(60% 50% at 72% 28%, color-mix(in oklab, var(--color-accent) ${ambient ? 7 : 16}%, transparent), transparent 70%)`,
        }}
      />
      {!ambient && (
        <svg className="absolute right-[-6%] top-1/2 h-[70vmin] w-[70vmin] -translate-y-1/2 opacity-[0.22]" viewBox="-110 -110 220 220" fill="none">
          <defs>
            <radialGradient id="poster-g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="0" cy="0" rx="100" ry="38" stroke="var(--color-accent)" strokeOpacity="0.35" strokeWidth="0.6" transform="rotate(-22)" />
          <ellipse cx="0" cy="0" rx="78" ry="78" stroke="var(--color-accent)" strokeOpacity="0.22" strokeWidth="0.5" transform="rotate(30)" />
          <ellipse cx="0" cy="0" rx="100" ry="30" stroke="var(--color-accent)" strokeOpacity="0.28" strokeWidth="0.5" transform="rotate(58)" />
          <circle cx="0" cy="0" r="104" fill="url(#poster-g)" />
        </svg>
      )}
      <div className="grid-bg absolute inset-0" style={{ opacity: ambient ? 0.18 : 0.35 }} />
    </div>
  );
}
