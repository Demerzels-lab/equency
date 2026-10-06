"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import { scroll, band } from "./scroll-store";

// Glowing teal diamond that scales in during the CTA band (bottom of the page). Bloom (full
// tier) turns the wireframe into a glow. Center-screen on the fixed canvas.
export function Emblem() {
  const g = useRef<Group>(null);
  const wire = useRef<Mesh>(null);

  useFrame((_, dt) => {
    const b = band(scroll.p, 0.88, 1.0);
    const grp = g.current;
    if (!grp) return;
    grp.visible = b > 0.01;
    grp.rotation.y += dt * 0.5;
    grp.rotation.x = 0.45;
    const s = 0.2 + b * 1.1;
    grp.scale.setScalar(s);
    if (wire.current) (wire.current.material as MeshBasicMaterial).opacity = b * 0.9;
  });

  return (
    <group ref={g} position={[0, -0.2, 2]} visible={false}>
      <mesh ref={wire}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#2ee6c5" wireframe transparent opacity={0} />
      </mesh>
      <mesh scale={0.985}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#071a17" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
