"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEnvironment } from "./useEnvironment";
import { Poster } from "./Poster";
import { scroll } from "./scroll-store";

// Shared ambient WebGL atmosphere behind every page EXCEPT the home (which has its own
// richer ScrollStage). Mounted once in the root layout, so it persists across app-page
// navigation. Content pages need no changes: the canvas is fixed, -z-10, pointer-events-none.
const CanvasHost = dynamic(() => import("./CanvasHost").then((m) => m.CanvasHost), { ssr: false });

export function GlobalAmbient() {
  const pathname = usePathname();
  const { tier, mounted } = useEnvironment();
  const isHome = pathname === "/";

  useEffect(() => {
    if (isHome) return; // home's ScrollStage owns the scroll store there
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
        scroll.p = window.scrollY / max;
        raf = 0;
      });
    };
    const onPtr = (e: PointerEvent) => {
      scroll.px = (e.clientX / window.innerWidth) * 2 - 1;
      scroll.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPtr, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPtr);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isHome]);

  if (isHome) return null;
  if (!mounted || tier === "static") return <Poster variant="ambient" />;
  const variant = pathname.startsWith("/vault") ? "vault" : pathname.startsWith("/strategies") ? "strategy" : "ambient";
  return <CanvasHost tier={tier} variant={variant} />;
}
