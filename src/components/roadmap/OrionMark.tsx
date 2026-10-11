// Project ORION wordmark — the codename for the four-phase expansion, set as a premium mark:
// wide Syncopate caps with a slow starlight sweep, Orion's belt (three stars) under the name,
// and a "codename" frame. Codename only, never a token/ticker (Orion Protocol / ORN exists).
import clsx from "clsx";

/** Three belt stars: Alnitak · Alnilam · Mintaka. */
function Belt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} aria-hidden>
      <line x1="4" y1="8.4" x2="116" y2="3.6" stroke="url(#orion-belt)" strokeWidth="1" />
      <defs>
        <linearGradient id="orion-belt" x1="0" x2="1">
          <stop offset="0" stopColor="#8ea0ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#dfe5ff" stopOpacity="1" />
          <stop offset="1" stopColor="#ff6a33" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[[24, 7.4], [60, 6], [96, 4.6]].map(([x, y], i) => (
        <g key={i} className="orion-star" style={{ animationDelay: `${i * 0.6}s` }}>
          <circle cx={x} cy={y} r="5" fill="#c9d3ff" opacity="0.22" />
          <circle cx={x} cy={y} r="2.2" fill="#fff" />
        </g>
      ))}
    </svg>
  );
}

/** Big centered mark for section heads. */
export function OrionMark({ className, caption = "Codename · four markets · one constellation", as: Tag = "h2" }: { className?: string; caption?: string; as?: "h1" | "h2" }) {
  return (
    <div className={clsx("orion-mark relative mx-auto flex w-fit flex-col items-center", className)}>
      <div className="orion-halo" aria-hidden />
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.42em] text-ink-2">
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-core/70" />
        <span>EQUENCY</span>
        <span className="text-core">✦</span>
        <span>Project</span>
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-strategy/70" />
      </div>
      <Tag className="orion-word mt-3 font-wide text-[clamp(40px,14vw,56px)] font-bold leading-none tracking-[0.34em] md:text-[104px]" aria-label="Project ORION">
        ORION
      </Tag>
      <Belt className="-mt-1 h-4 w-56 md:-mt-2 md:h-6 md:w-[22rem]" />
      <div className="mt-6 whitespace-nowrap rounded-full px-3 py-1 text-center font-mono text-[clamp(7px,2.4vw,9px)] uppercase tracking-[0.16em] text-ink-2 ring-1 ring-inset ring-core/40 backdrop-blur md:text-[10px] md:tracking-[0.28em]">
        {caption}
      </div>
    </div>
  );
}

/** Inline wordmark for running text and buttons. */
export function OrionInline({ className, bare = false }: { className?: string; bare?: boolean }) {
  return (
    <span className={clsx("inline-flex items-baseline gap-[0.45em] whitespace-nowrap", className)}>
      {!bare && <span>Project</span>}
      <span className="orion-word font-wide font-bold tracking-[0.22em]">ORION</span>
    </span>
  );
}
