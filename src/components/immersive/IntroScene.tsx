"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, type BufferGeometry, type Points } from "three";

const CONVERGE = 2.1; // seconds for the cloud to crystallize into the diamond
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/** First-visit intro: a dispersed particle cloud that streams inward and crystallizes
 *  into the EQUENCY diamond (octahedron edges), then rotates and breathes. Self-timed
 *  from the frame clock — the DOM overlay sequences the text + dismissal independently. */
export function IntroPoints({ count = 1500 }: { count?: number }) {
  const pts = useRef<Points>(null);
  const geo = useRef<BufferGeometry>(null);

  const { start, target, positions } = useMemo(() => {
    const s = 1.45;
    // Octahedron: 2 poles + 4 equator vertices → 12 edges form the diamond silhouette.
    const top: V = [0, s, 0], bot: V = [0, -s, 0];
    const eq: V[] = [[s, 0, 0], [0, 0, s], [-s, 0, 0], [0, 0, -s]];
    const edges: [V, V][] = [];
    for (const m of eq) { edges.push([top, m]); edges.push([bot, m]); }
    for (let i = 0; i < 4; i++) edges.push([eq[i], eq[(i + 1) % 4]]);

    const target = new Float32Array(count * 3);
    const start = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const [a, b] = edges[i % edges.length];
      const t = (i * 0.6180339887) % 1; // golden-ratio stride for even spread along edges
      const j = 0.05; // tiny jitter so edges read as luminous, not hairline
      target[i * 3] = a[0] + (b[0] - a[0]) * t + (hash(i) - 0.5) * j;
      target[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + (hash(i + 7) - 0.5) * j;
      target[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + (hash(i + 13) - 0.5) * j;
      // Start dispersed on a large shell.
      const u = hash(i + 101) * Math.PI * 2, v = Math.acos(2 * hash(i + 211) - 1), r = 5.5 + hash(i + 307) * 3;
      start[i * 3] = Math.sin(v) * Math.cos(u) * r;
      start[i * 3 + 1] = Math.cos(v) * r;
      start[i * 3 + 2] = Math.sin(v) * Math.sin(u) * r;
    }
    return { start, target, positions: start.slice() };
  }, [count]);

  const formed = useRef(false);
  useFrame((state) => {
    const g = geo.current, p = pts.current;
    if (!g || !p) return;
    const e = state.clock.elapsedTime;
    p.rotation.y = e * 0.22;
    p.rotation.x = Math.sin(e * 0.3) * 0.12;
    if (!formed.current) {
      const prog = easeOutCubic(Math.min(e / CONVERGE, 1));
      const arr = g.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length; i++) arr[i] = start[i] + (target[i] - start[i]) * prog;
      g.attributes.position.needsUpdate = true;
      if (prog >= 1) formed.current = true;
    }
    const s = 1 + Math.sin(e * 1.8) * 0.03; // gentle breathing once formed
    p.scale.setScalar(s);
  });

  return (
    <points ref={pts}>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#2ee6c5"
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

type V = [number, number, number];
// deterministic 0..1 hash (no Math.random — stable across renders)
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
