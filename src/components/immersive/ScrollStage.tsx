"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useEnvironment } from "./useEnvironment";
import { Poster } from "./Poster";
import { scroll } from "./scroll-store";

// The WebGL canvas is code-split (its own chunk) and client-only, so three/postprocessing
// never land in the server/initial bundle and never SSR.
const CanvasHost = dynamic(() => import("./CanvasHost").then((m) => m.CanvasHost), { ssr: false });

import type { SceneVariant } from "./Scene";

export function ScrollStage({ children, variant = "home" }: { children: React.ReactNode; variant?: SceneVariant }) {
  const { tier, mounted } = useEnvironment();

  useEffect(() => {
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
  }, []);

  const showCanvas = mounted && tier !== "static";

  return (
    <>
      {showCanvas ? <CanvasHost tier={tier} variant={variant} /> : <Poster variant={variant === "home" ? "home" : "ambient"} />}
      <div className="relative z-10">{children}</div>
    </>
  );
}
