"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type Group, type ShaderMaterial } from "three";
import type { Tier } from "./useEnvironment";
import { scroll } from "./scroll-store";

// Hero "intelligence core": a teal point-cloud shaped as a torus-knot tube + an ambient
// field, drifting in a vertex shader (cheap, GPU-side). Additive blending = glow.
function build(tier: Tier) {
  const sides = 8;
  const segments = tier === "full" ? 240 : 150;
  const ambient = tier === "full" ? 4200 : 1500;
  const tubeR = 0.42;
  const scale = 0.62;
  const pos: number[] = [];
  const seed: number[] = [];

  const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const norm = (a: number[]) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const center = (t: number) => {
    const r = Math.cos(3 * t) + 2.2;
    return [r * Math.cos(2 * t), r * Math.sin(2 * t), -Math.sin(3 * t) * 1.1];
  };
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const c = center(t);
    const T = norm(sub(center(t + 0.01), c));
    let B = norm([T[1], -T[0], 0]); if (!isFinite(B[0])) B = [1, 0, 0];
    const N = [B[1] * T[2] - B[2] * T[1], B[2] * T[0] - B[0] * T[2], B[0] * T[1] - B[1] * T[0]];
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2, cc = Math.cos(a) * tubeR, ss = Math.sin(a) * tubeR;
      pos.push((c[0] + N[0] * cc + B[0] * ss) * scale, (c[1] + N[1] * cc + B[1] * ss) * scale, (c[2] + N[2] * cc + B[2] * ss) * scale);
      seed.push(0.55 + Math.random() * 0.45); // bright structured points
    }
  }
  // ambient field in a sphere
  for (let i = 0; i < ambient; i++) {
    let x = 0, y = 0, z = 0, d = 2;
    while (d > 1) { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; d = x * x + y * y + z * z; }
    const r = 2.2 + Math.random() * 1.4;
    pos.push(x * r, y * r, z * r);
    seed.push(0.06 + Math.random() * 0.22); // very dim field points
  }
  return { positions: new Float32Array(pos), seeds: new Float32Array(seed), count: pos.length / 3 };
}

const vert = /* glsl */ `
  uniform float uTime; uniform float uProgress; uniform vec2 uPointer; uniform float uSize;
  attribute float aSeed; varying float vA;
  void main() {
    vec3 p = position;
    float t = uTime * 0.18 + aSeed * 6.2831;
    p.x += sin(t + p.y * 1.3) * 0.07;
    p.y += cos(t * 1.1 + p.z * 1.1) * 0.07;
    p.z += sin(t * 0.9 + p.x * 1.2) * 0.07;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.6 + aSeed * 1.2) * (90.0 / -mv.z);
    vA = (0.05 + 0.32 * aSeed) * (1.0 - uProgress * 0.6);
  }
`;
const frag = /* glsl */ `
  precision mediump float;
  varying float vA; uniform vec3 uColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d) * vA;
    gl_FragColor = vec4(uColor, a);
  }
`;

export function LightField({ tier }: { tier: Tier }) {
  const group = useRef<Group>(null);
  const mat = useRef<ShaderMaterial>(null);
  const { positions, seeds } = useMemo(() => build(tier), [tier]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uProgress: { value: 0 }, uPointer: { value: [0, 0] }, uSize: { value: tier === "full" ? 1.0 : 0.8 }, uColor: { value: new Color("#2ee6c5") } }),
    [tier],
  );

  useFrame((_, dt) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value += dt;
      mat.current.uniforms.uProgress.value += (scroll.p - mat.current.uniforms.uProgress.value) * 0.06;
    }
    if (group.current) {
      group.current.rotation.y += dt * 0.08 + scroll.px * 0.004;
      group.current.rotation.x += (-0.5 + scroll.py * 0.25 - group.current.rotation.x) * 0.05;
      // gentle dolly toward the viewer as you scroll the hero band
      group.current.position.z = -scroll.p * 2.2;
    }
  });

  return (
    <group ref={group} position={[1.3, 0.2, 0]}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
