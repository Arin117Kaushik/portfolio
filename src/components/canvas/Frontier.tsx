"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// WORLD 01 — FRONTIER. Dusk western built from silhouette flats against
// a gradient sky, the particle field re-tinted to drifting dust by the
// world sweep. Everything here is canvas-drawn placeholder art in the
// final composition positions — AI plates swap in per the prompt sheet.
// The journey rides the existing rig: camera z = -2 → deeper as p grows.

const INK = "#150d09"; // warm near-black for all silhouettes

function skyTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#160809");
  grad.addColorStop(0.32, "#3d1210");
  grad.addColorStop(0.55, "#7a2318");
  grad.addColorStop(0.74, "#c4622d");
  grad.addColorStop(0.86, "#e8894a");
  grad.addColorStop(1, "#8a3c1e");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  // low sun with a wide glow
  const sun = g.createRadialGradient(614, 358, 8, 614, 358, 150);
  sun.addColorStop(0, "rgba(255, 226, 178, 0.95)");
  sun.addColorStop(0.18, "rgba(255, 190, 120, 0.55)");
  sun.addColorStop(1, "rgba(255, 160, 90, 0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "rgba(255, 232, 190, 0.9)";
  g.beginPath();
  g.arc(614, 358, 34, 0, Math.PI * 2);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function makeFlat(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 256) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = INK;
  g.strokeStyle = INK;
  draw(g, w, h);
  return new THREE.CanvasTexture(c);
}

const drawMesa = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(w * 0.08, h * 0.55);
  g.lineTo(w * 0.2, h * 0.5);
  g.lineTo(w * 0.26, h * 0.28);
  g.lineTo(w * 0.55, h * 0.26);
  g.lineTo(w * 0.62, h * 0.48);
  g.lineTo(w * 0.8, h * 0.52);
  g.lineTo(w * 0.92, h * 0.7);
  g.lineTo(w, h);
  g.closePath();
  g.fill();
};

const drawHomestead = (g: CanvasRenderingContext2D, w: number, h: number) => {
  // cabin
  g.fillRect(w * 0.12, h * 0.55, w * 0.3, h * 0.45);
  g.beginPath();
  g.moveTo(w * 0.08, h * 0.55);
  g.lineTo(w * 0.27, h * 0.32);
  g.lineTo(w * 0.46, h * 0.55);
  g.closePath();
  g.fill();
  g.fillRect(w * 0.36, h * 0.38, w * 0.035, h * 0.14); // chimney
  // windmill
  const bx = w * 0.72;
  g.beginPath();
  g.moveTo(bx - w * 0.05, h);
  g.lineTo(bx - w * 0.012, h * 0.2);
  g.lineTo(bx + w * 0.012, h * 0.2);
  g.lineTo(bx + w * 0.05, h);
  g.closePath();
  g.fill();
  g.lineWidth = 6;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    g.beginPath();
    g.moveTo(bx, h * 0.18);
    g.lineTo(bx + Math.cos(a) * w * 0.09, h * 0.18 + Math.sin(a) * w * 0.09);
    g.stroke();
  }
};

const drawFence = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.lineWidth = 8;
  for (let i = 0; i < 9; i++) {
    const x = (i / 8) * (w - 20) + 10;
    g.beginPath();
    g.moveTo(x, h * 0.25 + (i % 3) * 4);
    g.lineTo(x, h);
    g.stroke();
  }
  g.lineWidth = 6;
  [0.45, 0.7].forEach((ry) => {
    g.beginPath();
    g.moveTo(0, h * ry);
    g.lineTo(w, h * ry + 6);
    g.stroke();
  });
};

const drawPole = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(w / 2, 0);
  g.lineTo(w / 2, h);
  g.stroke();
  g.lineWidth = 7;
  [0.08, 0.2].forEach((ry) => {
    g.beginPath();
    g.moveTo(w * 0.2, h * ry);
    g.lineTo(w * 0.8, h * ry);
    g.stroke();
  });
};

const drawBrush = (g: CanvasRenderingContext2D, w: number, h: number) => {
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * w;
    const r = 8 + Math.random() * 22;
    g.beginPath();
    g.arc(x, h - r * 0.6, r, 0, Math.PI * 2);
    g.fill();
  }
};

// 8-frame gallop cycle, drawn as a stylized silhouette — the flipbook
// machinery and staging are final; AI-rendered frames replace the sheet
function horseSheet() {
  const cell = 256;
  const c = document.createElement("canvas");
  c.width = cell * 4;
  c.height = cell * 2;
  const g = c.getContext("2d")!;
  g.fillStyle = INK;
  g.strokeStyle = INK;
  g.lineCap = "round";

  for (let f = 0; f < 8; f++) {
    const ph = f / 8;
    const x0 = (f % 4) * cell;
    const y0 = f < 4 ? 0 : cell;
    const cx = x0 + cell / 2;
    const cy = y0 + cell / 2 + Math.sin(ph * Math.PI * 4) * 7;

    g.save();
    g.translate(cx, cy);
    g.rotate(Math.sin(ph * Math.PI * 2) * 0.06);
    // body
    g.beginPath();
    g.ellipse(0, 0, 64, 23, 0, 0, Math.PI * 2);
    g.fill();
    // neck + head
    g.lineWidth = 26;
    g.beginPath();
    g.moveTo(46, -6);
    g.lineTo(76, -40);
    g.stroke();
    g.beginPath();
    g.ellipse(86, -48, 20, 9, -0.5, 0, Math.PI * 2);
    g.fill();
    // tail
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(-62, -10);
    g.quadraticCurveTo(-92, -18 + Math.sin(ph * Math.PI * 2) * 10, -100, 4);
    g.stroke();
    // legs — front pair and rear pair half a cycle apart
    const leg = (hx: number, phase: number, rear: boolean) => {
      const a = Math.sin(phase * Math.PI * 2) * 0.85 + (rear ? -0.15 : 0.15);
      const kx = hx + Math.sin(a) * 34;
      const ky = 18 + Math.cos(a) * 34;
      const a2 = a + Math.sin(phase * Math.PI * 2 + 1.2) * 0.7;
      g.lineWidth = 15;
      g.beginPath();
      g.moveTo(hx, 12);
      g.lineTo(kx, ky);
      g.stroke();
      g.lineWidth = 11;
      g.beginPath();
      g.moveTo(kx, ky);
      g.lineTo(kx + Math.sin(a2) * 30, ky + Math.cos(a2) * 30);
      g.stroke();
    };
    leg(38, ph, false);
    leg(26, ph + 0.12, false);
    leg(-34, ph + 0.5, true);
    leg(-46, ph + 0.62, true);
    g.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.repeat.set(0.25, 0.5);
  return tex;
}

function Horse({ z, y, speed, offset, scale }: { z: number; y: number; speed: number; offset: number; scale: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => horseSheet(), []);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    // steps at 10fps — the flipbook look, "on 2s"
    const f = Math.floor(t * 10 + offset * 8) % 8;
    tex.offset.set((f % 4) / 4, f < 4 ? 0.5 : 0);
    // gallop across the plain, wrap around
    m.position.x = ((t * speed + offset * 34) % 44) - 22;
  });

  return (
    <mesh ref={mesh} position={[0, y, z]} scale={[scale, scale, 1]}>
      <planeGeometry args={[2.4, 2.4]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

interface FlatSpec {
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void;
  x: number;
  z: number;
  w: number;
  h: number;
  texW?: number;
  texH?: number;
}

const GROUND_Y = -3.2;

const FLATS: FlatSpec[] = [
  { draw: drawFence, x: -6, z: -18, w: 13, h: 2.0 },
  { draw: drawMesa, x: 12, z: -32, w: 24, h: 9 },
  { draw: drawBrush, x: -10, z: -36, w: 6, h: 1.4 },
  { draw: drawPole, x: -7, z: -48, w: 2.6, h: 8, texW: 128, texH: 384 },
  { draw: drawHomestead, x: 8.5, z: -58, w: 13, h: 7 },
  { draw: drawPole, x: -7, z: -78, w: 2.6, h: 8, texW: 128, texH: 384 },
  { draw: drawFence, x: 7, z: -88, w: 13, h: 2.0 },
  { draw: drawBrush, x: 10.5, z: -94, w: 6, h: 1.4 },
  { draw: drawPole, x: -7, z: -108, w: 2.6, h: 8, texW: 128, texH: 384 },
  { draw: drawMesa, x: -14, z: -118, w: 28, h: 10.5 },
  { draw: drawHomestead, x: -9, z: -138, w: 11, h: 6 },
  { draw: drawMesa, x: 13, z: -155, w: 26, h: 9.5 },
];

function Flat({ spec }: { spec: FlatSpec }) {
  const tex = useMemo(
    () => makeFlat(spec.draw, spec.texW ?? 512, spec.texH ?? 256),
    [spec]
  );
  return (
    <mesh position={[spec.x, GROUND_Y + spec.h / 2, spec.z]}>
      <planeGeometry args={[spec.w, spec.h]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

function SkyAndGround() {
  const sky = useRef<THREE.Mesh>(null);
  const ground = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => skyTexture(), []);

  // both follow the camera down the corridor so the horizon never ends
  useFrame(({ camera }) => {
    if (sky.current) {
      sky.current.position.set(camera.position.x, 9, camera.position.z - 85);
    }
    if (ground.current) {
      ground.current.position.set(0, GROUND_Y, camera.position.z - 90);
    }
  });

  return (
    <>
      <mesh ref={sky}>
        <planeGeometry args={[260, 110]} />
        <meshBasicMaterial map={tex} depthWrite={false} fog={false} />
      </mesh>
      <mesh ref={ground} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 280]} />
        <meshBasicMaterial color="#1c0f0a" />
      </mesh>
    </>
  );
}

export default function Frontier() {
  return (
    <group>
      <SkyAndGround />
      {FLATS.map((spec, i) => (
        <Flat key={i} spec={spec} />
      ))}
      <Horse z={-64} y={-2.15} speed={5.2} offset={0} scale={1} />
      <Horse z={-67} y={-2.2} speed={4.6} offset={0.4} scale={0.85} />
      <Horse z={-70} y={-2.25} speed={5.8} offset={0.75} scale={0.7} />
    </group>
  );
}
