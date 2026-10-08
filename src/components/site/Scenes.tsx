"use client";

import dynamic from "next/dynamic";

// WebGL scenes are client-only; load them lazily so SSR ships plain HTML and the JS chunk
// for three.js only downloads in the browser.
const Stage = dynamic(() => import("@/components/three/Stage").then((m) => m.Stage), { ssr: false });
const HeroPlanet = dynamic(() => import("@/components/three/HeroPlanet").then((m) => m.HeroPlanet), { ssr: false });
const RingOrb = dynamic(() => import("@/components/three/Orbs").then((m) => m.RingOrb), { ssr: false });
const DotGlobe = dynamic(() => import("@/components/three/Orbs").then((m) => m.DotGlobe), { ssr: false });
const DotWave = dynamic(() => import("@/components/three/Orbs").then((m) => m.DotWave), { ssr: false });

/** Static SVG stand-in shown before WebGL mounts / when WebGL is unavailable. */
function OrbFallback({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 m-auto h-3/4 w-3/4 opacity-60" aria-hidden>
      <circle cx="100" cy="100" r="70" fill="none" stroke={color} strokeOpacity="0.4" />
      <ellipse cx="100" cy="100" rx="90" ry="24" fill="none" stroke={color} strokeOpacity="0.35" transform="rotate(-20 100 100)" />
      <circle cx="100" cy="100" r="22" fill={color} fillOpacity="0.7" />
    </svg>
  );
}

export function HeroScene({ className }: { className?: string }) {
  return (
    <Stage className={className} camera={{ position: [0, 0, 9], fov: 42 }} fallback={<OrbFallback color="#2b4dff" />}>
      <HeroPlanet />
    </Stage>
  );
}

export function OrbScene({ kind, className }: { kind: "core" | "strategy"; className?: string }) {
  const color = kind === "core" ? "#2b4dff" : "#ff5b24";
  return (
    <Stage className={className} camera={{ position: [0, 0, 6.4], fov: 40 }} fallback={<OrbFallback color={color} />}>
      {kind === "core" ? <DotGlobe color={color} /> : <RingOrb color={color} />}
    </Stage>
  );
}

export function WaveScene({ className }: { className?: string }) {
  return (
    <Stage className={`[mask-image:linear-gradient(to_bottom,transparent,#000_25%,#000_70%,transparent)] ${className ?? ""}`} camera={{ position: [0, 1.2, 6], fov: 45 }}>
      <DotWave />
    </Stage>
  );
}
