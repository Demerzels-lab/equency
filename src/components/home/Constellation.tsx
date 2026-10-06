"use client";

import Link from "next/link";
import { useRef } from "react";
import { SectionMark, Display } from "@/components/brand";
import { fmtDate } from "@/lib/util/dates";
import { prefersReducedMotion } from "@/components/immersive/useEnvironment";
import type { IpoHit } from "@/lib/providers/sec";

// Depth per card index → a staggered 3D "constellation" (cards float at different depths).
const depthOf = (i: number) => [26, -14, 10, -30, 2, -22][i % 6];

export function Constellation({ companies }: { companies: IpoHit[] }) {
  const inner = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent) {
    if (prefersReducedMotion() || !inner.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const rx = -((e.clientY - r.top) / r.height - 0.5) * 7;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 7;
    inner.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }
  function reset() {
    if (inner.current) inner.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  return (
    <section data-section="universe" className="mx-auto max-w-[1400px] px-6 py-24">
      <div className="mb-5 flex items-center justify-between">
        <SectionMark n="04" title="The new public market" />
        <span className="label">SEC EDGAR · 424B4</span>
      </div>
      <Display as="h2" className="max-w-2xl text-[clamp(1.8rem,4vw,3.2rem)]">
        A living constellation of newly public companies.
      </Display>

      {companies.length === 0 ? (
        <p className="mt-8 text-xs text-muted-foreground">
          No recent IPOs resolved from SEC EDGAR right now. Try the slice directly:{" "}
          <Link href="/company/ADRX" className="underline" style={{ color: "var(--color-accent)" }}>/company/ADRX</Link>
        </p>
      ) : (
        <div className="mt-10 [perspective:1400px]" onPointerMove={onMove} onPointerLeave={reset}>
          <div
            ref={inner}
            className="grid grid-cols-2 gap-3 transition-transform duration-300 ease-out [transform-style:preserve-3d] sm:grid-cols-3 lg:grid-cols-4"
          >
            {companies.map((c, i) => (
              <Link
                key={c.cik}
                href={`/company/${c.ticker}`}
                style={{ transform: `translateZ(${depthOf(i)}px)` }}
                className="group rounded-sm border border-border bg-card/70 p-4 backdrop-blur transition-[transform,border-color,background-color] duration-200 ease-out hover:z-10 hover:-translate-y-0.5 hover:border-accent-surface hover:bg-secondary/60 hover:[transform:translateZ(56px)]"
              >
                <div className="flex items-center justify-between">
                  <span className="mono text-sm" style={{ color: "var(--color-accent)" }}>{c.ticker}</span>
                  <span className="label opacity-0 transition-opacity group-hover:opacity-100">open →</span>
                </div>
                <div className="mt-2 truncate text-sm">{c.name}</div>
                <div className="label mt-1">{fmtDate(c.filedAt)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
