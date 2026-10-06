"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

/** The loading-screen gem: the same vault motif (asset in a cage), self-spinning and
 *  breathing. No scroll-store, no page coupling, so it mounts fast on route transitions. */
export function LoaderGem() {
  const g = useRef<Group>(null);
  useFrame((state, dt) => {
    const grp = g.current;
    if (!grp) return;
    grp.rotation.y += dt * 0.5;
    grp.rotation.x += dt * 0.18;
    grp.scale.setScalar(1.25 + Math.sin(state.clock.elapsedTime * 1.6) * 0.045);
  });
  return (
    <group ref={g}>
      <mesh>
        <octahedronGeometry args={[0.85, 0]} />
        <meshBasicMaterial color="#2ee6c5" wireframe transparent opacity={0.9} />
      </mesh>
      <mesh scale={0.84}>
        <octahedronGeometry args={[0.85, 0]} />
        <meshBasicMaterial color="#071a17" transparent opacity={0.6} />
      </mesh>
      <mesh scale={1.7}>
        <icosahedronGeometry args={[0.85, 0]} />
        <meshBasicMaterial color="#2ee6c5" wireframe transparent opacity={0.16} />
      </mesh>
    </group>
  );
}
