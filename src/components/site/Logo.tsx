/** EQUENCY mark: an orbit ring with a satellite — echoes the 3D hero motif. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <ellipse cx="16" cy="16" rx="13" ry="5" fill="none" stroke="var(--color-core)" strokeWidth="1.6" transform="rotate(-24 16 16)" />
        <circle cx="16" cy="16" r="4.2" fill="currentColor" />
        <circle cx="27.4" cy="10.9" r="2.6" fill="var(--color-strategy)" />
      </svg>
      <span className="eyebrow text-[15px] font-bold tracking-[0.32em]">EQUENCY</span>
    </span>
  );
}
