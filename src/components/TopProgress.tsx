"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Thin top progress bar during route navigation (GitHub/YouTube-style). No deps: it starts on
 *  internal link clicks / back-forward (or a custom event), and finishes when the pathname changes. */
export function TopProgress() {
  const pathname = usePathname();
  const [p, setP] = useState(0);
  const [show, setShow] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  const clearTimers = () => {
    if (trickle.current) clearInterval(trickle.current);
    if (hideT.current) clearTimeout(hideT.current);
    trickle.current = null; hideT.current = null;
  };

  useEffect(() => {
    const start = () => {
      clearTimers();
      setShow(true); setP(8);
      trickle.current = setInterval(() => setP((v) => (v < 90 ? v + (90 - v) * 0.08 : v)), 180);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/") || a.getAttribute("target") === "_blank") return;
      try { if (new URL(href, location.href).pathname === location.pathname) return; } catch { return; }
      start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    window.addEventListener("equency:nav-start", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener("equency:nav-start", start);
      clearTimers();
    };
  }, []);

  // finish when the route actually changes
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    clearTimers();
    setP(100);
    hideT.current = setTimeout(() => { setShow(false); setP(0); }, 260);
  }, [pathname]);

  if (!show) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px]">
      <div
        className="h-full transition-[width] duration-200 ease-out"
        style={{
          width: `${p}%`,
          background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
          boxShadow: "0 0 10px 1px color-mix(in oklab, var(--color-accent) 70%, transparent)",
        }}
      />
    </div>
  );
}
