"use client";

import { useEffect, useRef } from "react";

// Generative wireframe torus-knot rendered on <canvas> (the Zupiter "immersive" hero).
// Self-contained: no three.js, no assets. Auto-rotates, parallax on pointer move,
// static single frame under prefers-reduced-motion.

type V3 = [number, number, number];

function buildKnot(p = 2, q = 3, segments = 180, sides = 10, tubeR = 0.42): { rings: V3[][] } {
  const center: V3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const r = Math.cos(q * t) + 2.2;
    center.push([r * Math.cos(p * t), r * Math.sin(p * t), -Math.sin(q * t) * 1.1]);
  }
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const up: V3 = [0, 0, 1];
  const rings: V3[][] = [];
  for (let i = 0; i < center.length; i++) {
    const prev = center[(i - 1 + center.length) % center.length];
    const next = center[(i + 1) % center.length];
    const T = norm(sub(next, prev));
    let B = norm(cross(T, up));
    if (!isFinite(B[0])) B = [1, 0, 0];
    const N = norm(cross(B, T));
    const ring: V3[] = [];
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const cx = Math.cos(a) * tubeR, cy = Math.sin(a) * tubeR;
      ring.push([
        center[i][0] + N[0] * cx + B[0] * cy,
        center[i][1] + N[1] * cx + B[1] * cy,
        center[i][2] + N[2] * cx + B[2] * cy,
      ]);
    }
    rings.push(ring);
  }
  return { rings };
}

export function Wireframe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current, wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { rings } = buildKnot();
    const sides = rings[0].length;

    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const r = wrap!.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas!.width = Math.floor(W * dpr); canvas!.height = Math.floor(H * dpr);
      canvas!.style.width = `${W}px`; canvas!.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMove(e: PointerEvent) {
      const r = wrap!.getBoundingClientRect();
      mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 0.8;
      mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 0.6;
    }
    wrap.addEventListener("pointermove", onMove);

    let raf = 0, t0 = 0;
    function project(p: V3, ax: number, ay: number): [number, number, number] {
      // rotate Y then X
      const [x, y, z] = p;
      const x1 = x * Math.cos(ay) + z * Math.sin(ay);
      const z1 = -x * Math.sin(ay) + z * Math.cos(ay);
      const y1 = y * Math.cos(ax) - z1 * Math.sin(ax);
      const z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
      const scale = Math.min(W, H) * 0.23;
      const persp = 6 / (6 + z2);
      return [W / 2 + x1 * scale * persp, H / 2 + y1 * scale * persp, z2];
    }

    function frame(ts: number) {
      if (!t0) t0 = ts;
      const time = (ts - t0) / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const ay = (reduce ? 0.6 : time * 0.18) + mouse.x;
      const ax = -0.5 + (reduce ? 0 : Math.sin(time * 0.12) * 0.12) + mouse.y;

      ctx.clearRect(0, 0, W, H);
      const proj = rings.map((ring) => ring.map((p) => project(p, ax, ay)));

      // depth range for alpha
      let zmin = Infinity, zmax = -Infinity;
      for (const r of proj) for (const p of r) { if (p[2] < zmin) zmin = p[2]; if (p[2] > zmax) zmax = p[2]; }
      const depth = (z: number) => { const t = (z - zmin) / (zmax - zmin || 1); return 0.08 + (1 - t) * 0.5; };

      ctx.lineWidth = 0.6;
      // longitudinal lines
      for (let j = 0; j < sides; j++) {
        ctx.beginPath();
        for (let i = 0; i < proj.length; i++) {
          const p = proj[i][j];
          i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = `rgba(230,238,243,0.22)`;
        ctx.stroke();
      }
      // rings (every 3rd for density balance), depth-shaded
      for (let i = 0; i < proj.length; i += 3) {
        const ring = proj[i];
        ctx.beginPath();
        for (let j = 0; j <= sides; j++) {
          const p = ring[j % sides];
          j === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = `rgba(46,230,197,${depth(ring[0][2]) * 0.5})`;
        ctx.stroke();
      }

      if (!reduce) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
