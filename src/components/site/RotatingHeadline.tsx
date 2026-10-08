"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Rotating accent word whose container width animates to fit each word
 * (reference: "Trading / Hedging / … Yield"). Words slide up through a mask.
 */
export function RotatingHeadline({ words, tail, interval = 2200 }: { words: string[]; tail: string; interval?: number }) {
  const [i, setI] = useState(0);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const measure = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  useEffect(() => {
    if (measure.current) setWidth(measure.current.offsetWidth);
  }, [i]);

  return (
    <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 text-[40px] font-light leading-[1.05] tracking-tight sm:text-6xl md:text-7xl" aria-label={`${words[0]} ${tail}`}>
      <span
        className="relative inline-block overflow-hidden pb-1 text-core transition-[width] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width }}
      >
        {/* invisible sizer for the current word */}
        <span ref={measure} className="invisible absolute whitespace-nowrap" aria-hidden>
          {words[i]}
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={words[i]}
            initial={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-100%", opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="block whitespace-nowrap"
          >
            {words[i]}
          </motion.span>
        </AnimatePresence>
      </span>
      <span>{tail}</span>
    </h1>
  );
}
