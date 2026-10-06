"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "./useEnvironment";

/** Pointer-driven 3D tilt with a moving glare. Pure CSS transforms; no-op under reduced motion. */
export function TiltCard({ children, className, max = 8 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateY(${(px - 0.5) * max * 2}deg) rotateX(${-(py - 0.5) * max * 2}deg)`;
    if (glare.current) {
      glare.current.style.opacity = "1";
      glare.current.style.background = `radial-gradient(240px circle at ${px * 100}% ${py * 100}%, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent 60%)`;
    }
  }
  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
    if (glare.current) glare.current.style.opacity = "0";
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={cn("relative transition-transform duration-200 ease-out [transform-style:preserve-3d] will-change-transform", className)}
    >
      {children}
      <div ref={glare} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200" style={{ borderRadius: "inherit" }} />
    </div>
  );
}
