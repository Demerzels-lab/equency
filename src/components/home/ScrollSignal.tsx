"use client";

import { useEffect, useRef } from "react";

const MARKS: [string, number][] = [["INTELLIGENCE", 0.14], ["STRATEGY", 0.5], ["CAPITAL", 0.84]];

/** A fixed rail down the left edge with a glowing "signal" that tracks scroll progress —
 *  the Intelligence → Strategy → Capital loop, made visible. Scroll-driven (not timed). */
export function ScrollSignal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
        ref.current?.style.setProperty("--p", String(Math.min(1, window.scrollY / max)));
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed left-6 top-0 z-20 hidden h-screen w-px lg:block" style={{ ["--p" as string]: "0" }}>
      <div className="absolute inset-0 bg-border" />
      <div className="absolute left-0 top-0 w-px" style={{ height: "calc(var(--p) * 100%)", background: "linear-gradient(to bottom, var(--color-accent), var(--color-accent-2))" }} />
      <div
        className="absolute left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ top: "calc(var(--p) * 100%)", background: "var(--color-accent)", boxShadow: "0 0 12px 3px color-mix(in oklab, var(--color-accent) 60%, transparent)" }}
      />
      {MARKS.map(([label, p]) => (
        <span
          key={label}
          className="label absolute left-3 origin-left"
          style={{ top: `${p * 100}%`, writingMode: "vertical-rl", transform: "rotate(180deg) translateX(50%)" }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
