"use client";

import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { IntroPoints } from "./IntroScene";

const Effects = dynamic(() => import("./Effects").then((m) => m.Effects), { ssr: false });

export function IntroCanvas({ full }: { full: boolean }) {
  return (
    <Canvas
      dpr={[1, full ? 2 : 1.5]}
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <IntroPoints count={full ? 1700 : 900} />
      {full && <Effects />}
    </Canvas>
  );
}
