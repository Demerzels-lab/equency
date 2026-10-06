"use client";

import { useEffect, useState } from "react";

export type Tier = "full" | "lite" | "static";

/** One-shot WebGL support probe (creates then discards a context). */
export function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function computeTier(): Tier {
  if (!hasWebGL() || prefersReducedMotion()) return "static";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 820;
  return coarse || small ? "lite" : "full";
}

/**
 * Returns the render tier. SSR / first client paint is always "static" (the fully-working
 * DOM baseline); the real tier resolves in an effect after mount, so the WebGL canvas never
 * SSRs and there is no hydration mismatch.
 */
export function useEnvironment(): { tier: Tier; mounted: boolean } {
  const [tier, setTier] = useState<Tier>("static");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTier(computeTier());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setTier(computeTier());
    mq.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return { tier, mounted };
}
