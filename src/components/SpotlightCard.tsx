"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Card with a cursor-following radial highlight + border glow on hover (Linear/Vercel-style).
 *  Caller supplies the card look (border/bg/padding/rounded) via className; `glow` tints the spot. */
export function SpotlightCard({
  children,
  className,
  glow = "var(--color-accent)",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn("group/sc relative overflow-hidden", className)}
      style={{ ["--spot" as string]: glow, ["--mx" as string]: "50%", ["--my" as string]: "50%" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/sc:opacity-100"
        style={{ background: "radial-gradient(240px circle at var(--mx) var(--my), color-mix(in oklab, var(--spot) 15%, transparent), transparent 60%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/sc:opacity-100"
        style={{ boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--spot) 38%, transparent)" }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
