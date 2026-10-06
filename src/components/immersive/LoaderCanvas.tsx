"use client";

import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { LoaderGem } from "./LoaderScene";

// Bloom stays code-split so the lite tier never downloads postprocessing.
const Effects = dynamic(() => import("./Effects").then((m) => m.Effects), { ssr: false });

export function LoaderCanvas({ full }: { full: boolean }) {
  return (
    <Canvas
      dpr={[1, full ? 2 : 1.5]}
      camera={{ position: [0, 0, 4.2], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <LoaderGem />
      {full && <Effects />}
    </Canvas>
  );
}
