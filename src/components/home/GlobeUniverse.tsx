import Link from "next/link";

export type UniNode = { ticker: string; name: string };

// Place real newly-public companies as satellite nodes around the hero globe. Angles are chosen
// to sit near the globe's edge, clear of the centered headline. Each links to its Intelligence Core.
const ANGLES = [-128, -52, 158, 128, 210, -18]; // degrees; hand-tuned to avoid the centre band

export function GlobeUniverse({ nodes }: { nodes: UniNode[] }) {
  const items = nodes.slice(0, ANGLES.length);
  return (
    <div aria-hidden={false} className="pointer-events-none absolute inset-0 hidden md:block">
      {items.map((n, i) => {
        const a = (ANGLES[i] * Math.PI) / 180;
        const x = Math.cos(a) * 43; // vmin
        const y = Math.sin(a) * 34; // vmin (elliptical squish)
        const left = `calc(50% + ${x.toFixed(2)}vmin)`;
        const top = `calc(46% + ${y.toFixed(2)}vmin)`;
        return (
          <Link
            key={n.ticker}
            href={`/company/${n.ticker}`}
            style={{ left, top, animationDelay: `${(i % 4) * 0.7}s` }}
            className="eq-float group pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-1/2"
          >
            <span className="relative flex items-center gap-1.5 rounded-full border border-border bg-[color:color-mix(in_oklab,var(--color-bg)_70%,transparent)] px-2.5 py-1 backdrop-blur-sm transition-colors group-hover:border-[color:var(--color-accent)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)] shadow-[0_0_8px_2px_color-mix(in_oklab,var(--color-accent)_60%,transparent)]" />
              <span className="mono text-[11px] tracking-wide text-foreground">{n.ticker}</span>
            </span>
            {/* tooltip */}
            <span className="pointer-events-none absolute left-1/2 top-full mt-1.5 w-max max-w-[200px] -translate-x-1/2 truncate rounded-sm border border-border bg-[color:var(--color-panel)] px-2 py-1 text-[11px] text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {n.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
