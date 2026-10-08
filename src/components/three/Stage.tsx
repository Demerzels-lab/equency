"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import clsx from "clsx";

/**
 * Lazy WebGL stage: mounts the R3F canvas only once near the viewport and pauses the render
 * loop when off-screen (keeps several 3D scenes on one page cheap). Falls back to `fallback`
 * when WebGL is unavailable.
 */
export function Stage({
  children,
  className,
  camera = { position: [0, 0, 7], fov: 40 },
  fallback,
}: {
  children: React.ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov: number };
  fallback?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  // Stage is only ever loaded client-side (next/dynamic ssr:false), so probing in the initializer is safe.
  const [webgl] = useState(() => {
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !webgl) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setMounted(true);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [webgl]);

  return (
    <div ref={ref} className={clsx("relative", className)}>
      {!webgl
        ? fallback
        : mounted && (
            <Canvas
              dpr={[1, 1.75]}
              camera={camera}
              frameloop={visible ? "always" : "never"}
              gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
              className="!absolute inset-0"
            >
              {children}
            </Canvas>
          )}
    </div>
  );
}
