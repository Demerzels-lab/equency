"use client";

import { Canvas } from "@react-three/fiber";
import type { Tier } from "./useEnvironment";
import { Scene, type SceneVariant } from "./Scene";

/** Fixed, pointer-events-none WebGL layer behind the page. Transparent over the DOM bg. */
export function CanvasHost({ tier, variant = "home" }: { tier: Tier; variant?: SceneVariant }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        dpr={[1, tier === "full" ? 2 : 1.5]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop="always"
      >
        <Scene tier={tier} variant={variant} />
      </Canvas>
    </div>
  );
}
