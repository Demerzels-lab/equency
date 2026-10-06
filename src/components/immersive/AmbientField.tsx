"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type Group, type ShaderMaterial } from "three";
import type { Tier } from "./useEnvironment";
import { scroll } from "./scroll-store";

// A sparse, dim, slowly drifting teal point field for app pages — shared atmosphere behind
// data-dense surfaces, far subtler than the home hero light-field (no bloom, no knot).
function build(tier: Tier) {
  const n = tier === "full" ? 1800 : 800;
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() * 2 - 1) * 7;
    pos[i * 3 + 1] = (Math.random() * 2 - 1) * 4.5;
    pos[i * 3 + 2] = (Math.random() * 2 - 1) * 3;
    seed[i] = Math.random();
  }
  return { positions: pos, seeds: seed };
}

const vert = /* glsl */ `
  uniform float uTime; uniform float uSize; attribute float aSeed; varying float vA;
  void main() {
    vec3 p = position;
    float t = uTime * 0.12 + aSeed * 6.2831;
    p.x += sin(t + p.y) * 0.1;
    p.y += cos(t * 0.9 + p.z) * 0.1;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.5 + aSeed) * (80.0 / -mv.z);
    vA = 0.03 + 0.09 * aSeed;
  }
`;
const frag = /* glsl */ `
  precision mediump float; varying float vA; uniform vec3 uColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vA);
  }
`;

export function AmbientField({ tier }: { tier: Tier }) {
  const group = useRef<Group>(null);
  const mat = useRef<ShaderMaterial>(null);
  const { positions, seeds } = useMemo(() => build(tier), [tier]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSize: { value: 1 }, uColor: { value: new Color("#2ee6c5") } }), []);

  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
    if (group.current) {
      group.current.rotation.y += dt * 0.02 + scroll.px * 0.002;
      group.current.rotation.x += (scroll.py * 0.08 - group.current.rotation.x) * 0.03;
    }
  });

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} transparent depthWrite={false} blending={AdditiveBlending} />
      </points>
    </group>
  );
}
