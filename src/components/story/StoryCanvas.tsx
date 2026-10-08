"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "@/components/immersive/useEnvironment";

export interface StoryCanvasHandle {
  setProgress: (progress: number) => void;
  setName: (name: string) => void;
  pulse: () => void;
  resize: () => void;
  dispose: () => void;
}

interface StoryCanvasProps {
  progress?: number;
  activeTicker?: string;
  onCanvasReady?: (handle: StoryCanvasHandle) => void;
}

export function StoryCanvas({
  progress,
  activeTicker = "EQUENCY",
  onCanvasReady,
}: StoryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<StoryCanvasHandle | null>(null);
  const onCanvasReadyRef = useRef(onCanvasReady);
  onCanvasReadyRef.current = onCanvasReady;

  useEffect(() => {
    if (progress !== undefined) {
      handleRef.current?.setProgress(progress);
    }
  }, [progress]);

  useEffect(() => {
    handleRef.current?.setName(activeTicker || "EQUENCY");
  }, [activeTicker]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    if (prefersReducedMotion()) return;

    // --- SETUP SCENE, CAMERA, RENDERER ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf8f7f4, 0.04);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 8.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(0x0284c7, 3.2, 16);
    goldLight.position.set(4, 3, 5);
    scene.add(goldLight);

    const indigoLight = new THREE.PointLight(0x4f46e5, 2.2, 16);
    indigoLight.position.set(-4, -3, -2);
    scene.add(indigoLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(0, 8, 4);
    scene.add(sunLight);

    // Root Group
    const root = new THREE.Group();
    scene.add(root);

    // Ambient Web3 Spatial Quantum Data Nodes (LayerZero / Monad style)
    const ambientCount = 200;
    const ambientPos = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      ambientPos[i * 3] = (Math.random() - 0.5) * 16;
      ambientPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      ambientPos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    const ambientGeom = new THREE.BufferGeometry();
    ambientGeom.setAttribute("position", new THREE.BufferAttribute(ambientPos, 3));
    const ambientMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
    });
    const ambientPoints = new THREE.Points(ambientGeom, ambientMat);
    scene.add(ambientPoints);

    // State Variables
    let targetProgress = 0;
    let smoothProgress = 0;
    let pulseBoost = 1;
    let mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let currentName = activeTicker || "EQUENCY";

    // Interactive Drag Orbit & Inertia Physics
    const userRotation = { x: 0, y: 0 };
    const dragVelocity = { x: 0, y: 0 };
    let isDragging = false;
    let startPointer = { x: 0, y: 0 };
    let lastPointer = { x: 0, y: 0 };
    let pointerDownTime = 0;

    // Raycaster for hover & click
    const raycaster = new THREE.Raycaster();
    const pointerCoord = new THREE.Vector2(-10, -10);
    let isHovering3D = false;

    // Helper to smoothly modulate opacities across a group's meshes, points, and lines
    function setGroupOpacity(group: THREE.Group, opacity: number) {
      group.traverse((child) => {
        const obj = child as any;
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: any) => {
            if (!m) return;
            m.transparent = true;
            if (m.userData.baseOpacity === undefined) {
              m.userData.baseOpacity = m.opacity !== undefined ? m.opacity : 1.0;
            }
            m.opacity = Math.max(0, Math.min(1, m.userData.baseOpacity * opacity));
          });
        }
      });
    }

    // ── CHAPTER 0: 3D TICKER PLAQUE & DIAMOND CORE ──
    const ch0Group = new THREE.Group();
    root.add(ch0Group);

    // Dynamic 2D Canvas Texture for the 3D Ticker Badge with Web3 Holographic Aesthetics
    const textCanvas = document.createElement("canvas");
    textCanvas.width = 1024;
    textCanvas.height = 360;
    const textCtx = textCanvas.getContext("2d")!;
    const textTexture = new THREE.CanvasTexture(textCanvas);
    textTexture.minFilter = THREE.LinearFilter;
    textTexture.generateMipmaps = false;

    function renderTextPlate(text: string) {
      textCtx.clearRect(0, 0, 1024, 360);

      // Cyber Holographic Glass Background
      const grad = textCtx.createLinearGradient(40, 40, 984, 320);
      grad.addColorStop(0, "rgba(8, 12, 22, 0.92)");
      grad.addColorStop(1, "rgba(15, 23, 42, 0.88)");
      textCtx.fillStyle = grad;
      textCtx.beginPath();
      textCtx.roundRect(40, 40, 944, 280, 20);
      textCtx.fill();

      // Cyber Grid Lines inside the plate
      textCtx.strokeStyle = "rgba(0, 240, 255, 0.08)";
      textCtx.lineWidth = 1;
      for (let x = 60; x < 960; x += 40) {
        textCtx.beginPath();
        textCtx.moveTo(x, 50);
        textCtx.lineTo(x, 310);
        textCtx.stroke();
      }

      // Glowing Cyan Border
      textCtx.lineWidth = 2.5;
      textCtx.strokeStyle = "rgba(0, 240, 255, 0.75)";
      textCtx.beginPath();
      textCtx.roundRect(40, 40, 944, 280, 20);
      textCtx.stroke();

      // Corner Tech Brackets (Web3 HUD markers)
      textCtx.lineWidth = 4;
      textCtx.strokeStyle = "#00f0ff";
      // Top-Left
      textCtx.beginPath(); textCtx.moveTo(40, 70); textCtx.lineTo(40, 40); textCtx.lineTo(70, 40); textCtx.stroke();
      // Top-Right
      textCtx.beginPath(); textCtx.moveTo(984, 70); textCtx.lineTo(984, 40); textCtx.lineTo(954, 40); textCtx.stroke();
      // Bottom-Left
      textCtx.beginPath(); textCtx.moveTo(40, 290); textCtx.lineTo(40, 320); textCtx.lineTo(70, 320); textCtx.stroke();
      // Bottom-Right
      textCtx.beginPath(); textCtx.moveTo(984, 290); textCtx.lineTo(984, 320); textCtx.lineTo(954, 320); textCtx.stroke();

      // Live Status Beacon + Header
      textCtx.fillStyle = "#00f0ff";
      textCtx.beginPath();
      textCtx.arc(80, 92, 6, 0, Math.PI * 2);
      textCtx.fill();

      textCtx.font = "bold 20px monospace";
      textCtx.fillStyle = "#38bdf8";
      textCtx.fillText("ROBINHOOD TESTNET #46630 // LIVE PROTOCOL CORE", 102, 98);

      // Large Main Ticker with Holographic Glow
      textCtx.font = "900 98px -apple-system, BlinkMacSystemFont, monospace";
      textCtx.fillStyle = "#ffffff";
      const clean = (text || "EQUENCY").toUpperCase();
      textCtx.fillText(clean, 80, 206);

      // Cryptographic Hash & Deterministic Stamp
      const pseudoHash = "0x" + Array.from(clean).reduce((acc, c) => acc + c.charCodeAt(0).toString(16), "7f").padEnd(16, "0").slice(0, 16);
      textCtx.font = "600 21px monospace";
      textCtx.fillStyle = "rgba(148, 163, 184, 0.95)";
      textCtx.fillText(`SEC 424B4 · DETERMINISTIC MATH · HASH [${pseudoHash}...]`, 80, 268);

      textTexture.needsUpdate = true;
    }
    renderTextPlate(currentName);

    const plateGeom = new THREE.PlaneGeometry(3.2, 1.15);
    const plateMat = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const plateMesh = new THREE.Mesh(plateGeom, plateMat);
    plateMesh.position.set(0, -1.3, 0);
    ch0Group.add(plateMesh);

    // Faceted Diamond Octahedron
    const octGeom = new THREE.OctahedronGeometry(1.25, 0);
    const octMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.9,
      flatShading: true,
      transparent: true,
      opacity: 0.95,
    });
    const octMesh = new THREE.Mesh(octGeom, octMat);
    ch0Group.add(octMesh);

    // Wireframe Halo with Cyan Glow
    const wireGeom = new THREE.OctahedronGeometry(1.28, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const wireMesh = new THREE.Mesh(wireGeom, wireMat);
    ch0Group.add(wireMesh);

    // Outer Geometric Tesseract Cage
    const cageGeom = new THREE.IcosahedronGeometry(1.6, 0);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const cageMesh = new THREE.Mesh(cageGeom, cageMat);
    ch0Group.add(cageMesh);

    // Orbital Coordinates Rings
    const ring1Geom = new THREE.TorusGeometry(2.0, 0.015, 16, 96);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.65 });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    ring1.rotation.x = Math.PI * 0.35;
    ch0Group.add(ring1);

    const ring2Geom = new THREE.TorusGeometry(2.35, 0.012, 16, 96);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.5 });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.y = Math.PI * 0.4;
    ch0Group.add(ring2);

    // ── CHAPTER 1: INGESTION PIPELINE (SEAL & REVEAL CAPSULE) ──
    const ch1Group = new THREE.Group();
    root.add(ch1Group);

    const cylGeom = new THREE.CylinderGeometry(1.0, 1.0, 0.6, 32);
    const cylMat = new THREE.MeshStandardMaterial({
      color: 0x20242c,
      metalness: 0.82,
      roughness: 0.24,
      transparent: true,
      opacity: 1.0,
    });
    const topCap = new THREE.Mesh(cylGeom, cylMat);
    const botCap = new THREE.Mesh(cylGeom, cylMat);
    ch1Group.add(topCap);
    ch1Group.add(botCap);

    // Inner Glowing Core
    const innerSphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.75, 1),
      new THREE.MeshBasicMaterial({ color: 0xeb5729, wireframe: true, transparent: true, opacity: 0.85 })
    );
    ch1Group.add(innerSphere);

    // Pipeline Data Stream Particles
    const streamCount = 90;
    const streamPos = new Float32Array(streamCount * 3);
    const streamSeeds: { r: number; a: number; y: number; s: number }[] = [];
    for (let i = 0; i < streamCount; i++) {
      const r = 1.4 + Math.random() * 0.8;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3;
      streamSeeds.push({ r, a, y, s: 0.8 + Math.random() * 1.5 });
      streamPos[i * 3] = Math.cos(a) * r;
      streamPos[i * 3 + 1] = y;
      streamPos[i * 3 + 2] = Math.sin(a) * r;
    }
    const streamGeom = new THREE.BufferGeometry();
    streamGeom.setAttribute("position", new THREE.BufferAttribute(streamPos, 3));
    const streamPoints = new THREE.Points(
      streamGeom,
      new THREE.PointsMaterial({ color: 0xeb5729, size: 0.05, transparent: true, opacity: 0.75 })
    );
    ch1Group.add(streamPoints);

    // ── CHAPTER 2: QUANTITATIVE STRATEGY VECTORS ──
    const ch2Group = new THREE.Group();
    root.add(ch2Group);

    const stratSpheres: THREE.Mesh[] = [];
    const stratColors = [0xeb5729, 0x2e4cd8, 0x059669];
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const sMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 0),
        new THREE.MeshStandardMaterial({
          color: stratColors[i],
          metalness: 0.75,
          roughness: 0.25,
          wireframe: i === 1,
          transparent: true,
          opacity: 1.0,
        })
      );
      sMesh.position.set(Math.cos(angle) * 1.8, (i - 1) * 0.8, Math.sin(angle) * 1.8);
      ch2Group.add(sMesh);
      stratSpheres.push(sMesh);
    }
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      stratSpheres[0].position,
      stratSpheres[1].position,
      stratSpheres[2].position,
      stratSpheres[0].position,
    ]);
    const stratLines = new THREE.Line(
      lineGeom,
      new THREE.LineBasicMaterial({ color: 0xeb5729, transparent: true, opacity: 0.5 })
    );
    ch2Group.add(stratLines);

    // ── CHAPTER 3: NON-CUSTODIAL VAULT CYLINDER ──
    const ch3Group = new THREE.Group();
    root.add(ch3Group);

    const vaultBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.3, 1.8, 36, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x1a1d24,
        roughness: 0.22,
        metalness: 0.9,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0,
      })
    );
    ch3Group.add(vaultBase);

    const vaultRings: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const vRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.32, 0.02, 16, 64),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xeb5729 : 0x2e4cd8, transparent: true, opacity: 0.85 })
      );
      vRing.rotation.x = Math.PI / 2;
      vRing.position.y = (i - 1.5) * 0.5;
      ch3Group.add(vRing);
      vaultRings.push(vRing);
    }

    // ── CHAPTER 4: TRUTH & PROOF SHIELD ──
    const ch4Group = new THREE.Group();
    root.add(ch4Group);

    const shieldGeom = new THREE.TetrahedronGeometry(1.5, 0);
    const shieldMesh = new THREE.Mesh(
      shieldGeom,
      new THREE.MeshStandardMaterial({
        color: 0x1c1e24,
        roughness: 0.15,
        metalness: 0.88,
        flatShading: true,
        transparent: true,
        opacity: 1.0,
      })
    );
    ch4Group.add(shieldMesh);

    const shieldWire = new THREE.Mesh(
      new THREE.TetrahedronGeometry(1.54, 0),
      new THREE.MeshBasicMaterial({ color: 0xeb5729, wireframe: true, transparent: true, opacity: 0.85 })
    );
    ch4Group.add(shieldWire);

    // ── CHAPTER 5: INSTANCED MESH 10x10 DATA MATRIX ──
    const ch5Group = new THREE.Group();
    root.add(ch5Group);

    const matrixCount = 100;
    const boxGeom = new THREE.BoxGeometry(0.24, 1.4, 0.24);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x232730,
      roughness: 0.35,
      metalness: 0.7,
      transparent: true,
      opacity: 1.0,
    });
    const instancedMatrix = new THREE.InstancedMesh(boxGeom, boxMat, matrixCount);
    ch5Group.add(instancedMatrix);

    const dummy = new THREE.Object3D();

    // Group list for continuous per-chapter processing
    const chapterGroups = [ch0Group, ch1Group, ch2Group, ch3Group, ch4Group, ch5Group];

    // Horizontal waypoints corresponding to alternating editorial layout:
    // Ch 0 (is-left): 3D on right (+2.2)
    // Ch 1 (is-right): 3D on left (-2.2)
    // Ch 2 (is-left): 3D on right (+2.2)
    // Ch 3 (is-right): 3D on left (-2.2)
    // Ch 4 (is-left): 3D on right (+2.2)
    // Ch 5 (is-right): 3D on left (-2.2)
    const WAYPOINTS_X = [2.2, -2.2, 2.2, -2.2, 2.2, -2.2];

    function getStageX(p: number): number {
      const clamped = Math.max(0, Math.min(WAYPOINTS_X.length - 1, p));
      const idx = Math.floor(clamped);
      if (idx >= WAYPOINTS_X.length - 1) return WAYPOINTS_X[WAYPOINTS_X.length - 1];
      const t = clamped - idx;
      // Hermite smoothstep for butter-smooth acceleration & deceleration:
      const s = t * t * (3 - 2 * t);
      return WAYPOINTS_X[idx] + (WAYPOINTS_X[idx + 1] - WAYPOINTS_X[idx]) * s;
    }

    // Resize Handler
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Global Pointer Move for Parallax
    const onWindowPointerMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
      pointerCoord.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerCoord.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onWindowPointerMove, { passive: true });

    // Interactive Drag Orbit & Click on 3D Model
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      startPointer.x = e.clientX;
      startPointer.y = e.clientY;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
      pointerDownTime = performance.now();
      dragVelocity.x = 0;
      dragVelocity.y = 0;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {}
      container.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;

      // Apply drag to orientation
      userRotation.y += dx * 0.007;
      userRotation.x += dy * 0.007;

      // Track inertia velocity
      dragVelocity.y = dx * 0.006;
      dragVelocity.x = dy * 0.006;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {}
      container.style.cursor = isHovering3D ? "pointer" : "grab";

      // If clicked without dragging (tap/click), test raycast hit on 3D elements
      const dist = Math.hypot(e.clientX - startPointer.x, e.clientY - startPointer.y);
      const elapsed = performance.now() - pointerDownTime;
      if (dist < 8 && elapsed < 350) {
        raycaster.setFromCamera(pointerCoord, camera);
        const hits = raycaster.intersectObjects(root.children, true);
        if (hits.length > 0) {
          handle.pulse();
        }
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);

    // Handle Interface
    const handle: StoryCanvasHandle = {
      setProgress(p: number) {
        targetProgress = Math.max(0, Math.min(5, p));
      },
      setName(name: string) {
        currentName = name;
        renderTextPlate(name);
      },
      pulse() {
        pulseBoost = 2.4;
      },
      resize: onResize,
      dispose() {
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onWindowPointerMove);
        container.removeEventListener("pointerdown", onPointerDown);
        container.removeEventListener("pointermove", onPointerMove);
        container.removeEventListener("pointerup", onPointerUp);
        container.removeEventListener("pointercancel", onPointerUp);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
        textTexture.dispose();
        ambientGeom.dispose();
        ambientMat.dispose();
      },
    };
    handleRef.current = handle;
    onCanvasReadyRef.current?.(handle);

    // Render Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Ambient particle gentle celestial drift
      ambientPoints.rotation.y = time * 0.025;
      ambientPoints.rotation.x = Math.sin(time * 0.02) * 0.04;

      // RobinID dampening: buttery smooth progression with zero jerk
      smoothProgress += (targetProgress - smoothProgress) * 0.075;

      // Pulse boost decay
      if (pulseBoost > 1) {
        pulseBoost += (1 - pulseBoost) * 0.05;
      }
      const speed = pulseBoost;

      // Parallax smooth interpolation
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      // Interactive user drag orbit & inertia physics
      if (!isDragging) {
        dragVelocity.x *= 0.92;
        dragVelocity.y *= 0.92;
        userRotation.x += dragVelocity.x;
        userRotation.y += dragVelocity.y;

        // Ambient idle rotation
        userRotation.y += delta * 0.12 * speed;
        // Gentle auto-restoration of vertical pitch
        userRotation.x = THREE.MathUtils.lerp(userRotation.x, 0, delta * 1.6);
      }
      userRotation.x = Math.max(-0.9, Math.min(0.9, userRotation.x));

      root.rotation.x = userRotation.x;
      root.rotation.y = userRotation.y;

      // Camera subtle perspective tilt from mouse parallax
      camera.position.x = mouse.x * 0.35;
      camera.position.y = mouse.y * 0.25;
      camera.lookAt(0, 0, 0);

      // Raycast to check hover over active 3D model
      raycaster.setFromCamera(pointerCoord, camera);
      const hits = raycaster.intersectObjects(root.children, true);
      isHovering3D = hits.length > 0;
      if (!isDragging) {
        container.style.cursor = isHovering3D ? "pointer" : "grab";
      }

      // ROOT HORIZONTAL STAGE GLIDE:
      // Glides smoothly from right to left / left to right across the screen
      const isMobile = window.innerWidth < 860;
      const targetStageX = isMobile ? 0 : getStageX(smoothProgress);
      root.position.x = targetStageX + mouse.x * 0.2;
      root.position.y = (isMobile ? 1.1 : 0) + mouse.y * 0.15;

      // SEAMLESS PER-CHAPTER TRANSITIONS:
      // Instead of jarring scaling at (0,0,0), chapters glide naturally in depth and elevation
      chapterGroups.forEach((group, idx) => {
        const d = smoothProgress - idx;
        const absD = Math.abs(d);

        if (absD >= 1.0) {
          group.visible = false;
        } else {
          group.visible = true;
          const w = 1.0 - absD;
          // Hermite smoothstep fade
          const smoothFade = w * w * (3 - 2 * w);

          setGroupOpacity(group, smoothFade);

          // Glide gracefully along depth and elevation:
          // Negative Z pushes upcoming/exiting items further into the dark fog
          group.position.set(0, d * 0.85, -absD * 2.8);
          group.scale.setScalar(0.88 + 0.12 * smoothFade);
        }
      });

      // Chapter-specific rotational and dynamic life animations:

      // Ch 0: Start / Plaque & Diamond
      if (ch0Group.visible) {
        ch0Group.rotation.y += delta * 0.35 * speed;
        octMesh.rotation.x += delta * 0.28 * speed;
        octMesh.rotation.y += delta * 0.38 * speed;
        wireMesh.rotation.copy(octMesh.rotation);
        ring1.rotation.z += delta * 0.22;
        ring2.rotation.z -= delta * 0.26;
        plateMesh.rotation.y = Math.sin(time * 1.5) * 0.05;
      }

      // Ch 1: Pipeline / Seal Capsule
      if (ch1Group.visible) {
        topCap.position.y = 0.6 + Math.sin(time * 2.2) * 0.12;
        botCap.position.y = -0.6 - Math.sin(time * 2.2) * 0.12;
        innerSphere.rotation.y += delta * 0.8;
        innerSphere.rotation.x += delta * 0.35;
        streamPoints.rotation.y += delta * 0.35;

        // Update particle stream
        const posAttr = streamGeom.attributes.position as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;
        for (let i = 0; i < streamCount; i++) {
          const s = streamSeeds[i];
          const a = s.a + time * s.s;
          posArr[i * 3] = Math.cos(a) * s.r;
          posArr[i * 3 + 1] = s.y + Math.sin(a * 2) * 0.2;
          posArr[i * 3 + 2] = Math.sin(a) * s.r;
        }
        posAttr.needsUpdate = true;
      }

      // Ch 2: Strategies Vectors
      if (ch2Group.visible) {
        ch2Group.rotation.y += delta * 0.35;
        stratSpheres.forEach((s, idx) => {
          s.rotation.x += delta * 0.45 * (idx + 1);
          s.position.y = Math.sin(time * 1.5 + idx) * 0.25;
        });
      }

      // Ch 3: Vault Cylinder
      if (ch3Group.visible) {
        vaultBase.rotation.y += delta * 0.22;
        vaultRings.forEach((r, idx) => {
          r.rotation.z += delta * 0.25 * (idx % 2 === 0 ? 1 : -1);
        });
      }

      // Ch 4: Shield / Proof
      if (ch4Group.visible) {
        shieldMesh.rotation.y += delta * 0.45;
        shieldMesh.rotation.x += delta * 0.22;
        shieldWire.rotation.y -= delta * 0.35;
      }

      // Ch 5: Instanced Matrix Data Wave
      if (ch5Group.visible) {
        ch5Group.rotation.y = Math.sin(time * 0.35) * 0.18;
        for (let i = 0; i < matrixCount; i++) {
          const x = (i % 10) - 4.5;
          const z = Math.floor(i / 10) - 4.5;
          const h = 0.4 + (Math.sin(x * 0.5 + time * 2) + Math.cos(z * 0.5 + time * 1.8) + 2) * 0.35;
          dummy.position.set(x * 0.32, -1.2 + h * 0.5, z * 0.32);
          dummy.scale.set(1, h, 1);
          dummy.updateMatrix();
          instancedMatrix.setMatrixAt(i, dummy.matrix);
        }
        instancedMatrix.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      handle.dispose();
    };
  }, []);

  return <div ref={containerRef} className="story-canvas" aria-hidden="true" />;
}
