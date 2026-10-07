"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useEnvironment } from "./useEnvironment";

// The WebGL loader canvas is its own client-only chunk; never SSR'd, never in the main bundle.
const LoaderCanvas = dynamic(() => import("./LoaderCanvas").then((m) => m.LoaderCanvas), { ssr: false });

/** Full-bleed loading screen with the EQUENCY gem in 3D (bloom on the full tier), a CSS/SVG
 *  fallback for reduced-motion / no-WebGL, the wordmark and an indeterminate progress bar. */
export function Loader({ label = "Assembling intelligence" }: { label?: string }) {
  const { tier, mounted } = useEnvironment();
  const show3d = mounted && tier !== "static";

  // Flag the document while a route is loading so chrome (e.g. the footer) can hide itself.
  useEffect(() => {
    document.documentElement.classList.add("route-loading");
    return () => document.documentElement.classList.remove("route-loading");
  }, []);

  return (
    <div className="fixed inset-0 z-20 grid place-items-center overflow-hidden bg-[var(--color-bg)]">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{ background: "radial-gradient(50% 42% at 50% 42%, color-mix(in oklab, var(--color-accent) 10%, transparent), transparent 70%)" }}
      />
      <div role="status" aria-label={label} className="relative flex flex-col items-center gap-7">
        <div className="relative h-[clamp(200px,34vmin,300px)] w-[clamp(200px,34vmin,300px)]">
          {show3d ? <LoaderCanvas full={tier === "full"} /> : <GemFallback />}
        </div>
        <div className="flex flex-col items-center gap-3.5">
          <div className="flex items-center gap-2.5">
            <span className="block h-2.5 w-2.5 rotate-45 bg-[var(--color-accent)]" />
            <span className="mono text-sm font-semibold tracking-[0.42em] text-foreground">EQUENCY</span>
          </div>
          <div className="eq-loader-track"><span className="eq-loader-seg" /></div>
          <div className="label flex items-center">{label}<span className="eq-dots" /></div>
        </div>
      </div>
    </div>
  );
}

/** Static tier / pre-mount: an SVG gem with a slowly rotating outer cage, no WebGL. */
function GemFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <svg viewBox="-60 -60 120 120" className="h-full w-full">
        <g className="eq-spin">
          <polygon points="0,-48 42,0 0,48 -42,0" fill="none" stroke="var(--color-accent)" strokeOpacity="0.18" strokeWidth="0.7" />
          <polygon points="0,-48 42,0 0,48 -42,0" fill="none" stroke="var(--color-accent)" strokeOpacity="0.18" strokeWidth="0.7" transform="rotate(45)" />
        </g>
        <polygon points="0,-30 26,0 0,30 -26,0" fill="var(--color-accent)" fillOpacity="0.06" stroke="var(--color-accent)" strokeOpacity="0.85" strokeWidth="1" />
      </svg>
    </div>
  );
}
