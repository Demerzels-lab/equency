"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "./useEnvironment";

/** Tasteful one-shot reveal on scroll-in. Content is visible by default; this only adds a
 *  subtle enter when supported. Use sparingly (not on every section). */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "li" | "section" }) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const reveal = () => setTimeout(() => setShown(true), delay);
    const io = new IntersectionObserver(
      (e) => { if (e[0].isIntersecting) { reveal(); io.disconnect(); } },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    // Fail-safe: never leave content stuck hidden if the observer never fires
    // (hidden tab, headless/SEO renderer, programmatic scroll). Scroll still reveals earlier.
    const safety = setTimeout(() => { setShown(true); io.disconnect(); }, 2000);
    return () => { io.disconnect(); clearTimeout(safety); };
  }, [delay]);

  return (
    <Tag
      // @ts-expect-error polymorphic ref
      ref={ref}
      className={cn("transition-all duration-700 ease-out will-change-[opacity,transform]", shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4", className)}
    >
      {children}
    </Tag>
  );
}
