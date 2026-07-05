"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// WORLD 02 — NEON CITY. Rain-slick data metropolis: tower flats with lit
// windows, flickering glyph signs, layered scrolling rain, and a giant
// data-ring landmark at the far end of the ride. Arin's pipelines ARE
// the city — the beats (DOM layer) name the systems as you pass their
// districts. Canvas placeholder art in final positions; AI plates swap in.

const GROUND_Y = -3.2;
const PALETTE = ["#ff2d78", "#6ff2dd", "#8b7dff"];

function towerTexture(seed: number) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0d0a14";
  g.fillRect(0, 0, c.width, c.height);
  // lit windows
  const cols = 6 + (seed % 3);
  const rows = 16;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (Math.random() < 0.42) {
        const col = PALETTE[(x + y + seed) % 3];
        g.fillStyle = col;
        g.globalAlpha = 0.25 + Math.random() * 0.5;
        g.fillRect(
          14 + x * ((c.width - 28) / cols),
          18 + y * ((c.height - 36) / rows),
          (c.width - 28) / cols - 8,
          (c.height - 36) / rows - 10
        );
      }
    }
  }
  // neon edge strip
  g.globalAlpha = 1;
  g.strokeStyle = PALETTE[seed % 3];
  g.lineWidth = 5;
  g.shadowColor = PALETTE[seed % 3];
  g.shadowBlur = 14;
  g.beginPath();
  g.moveTo(4, 0);
  g.lineTo(4, c.height);
  g.stroke();
  return new THREE.CanvasTexture(c);
}

// abstract glyph sign — invented strokes, deliberately unreadable
function signTexture(hue: string) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 320;
  const g = c.getContext("2d")!;
  g.strokeStyle = hue;
  g.shadowColor = hue;
  g.shadowBlur = 12;
  g.lineWidth = 5;
  g.strokeRect(8, 8, c.width - 16, c.height - 16);
  g.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const y = 40 + i * 52;
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(30 + Math.random() * 20, y);
    g.lineTo(90 + Math.random() * 10, y + 8 + Math.random() * 14);
    if (Math.random() > 0.5) {
      g.moveTo(64, y - 8);
      g.lineTo(64, y + 26);
    }
    g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function rainTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const len = 18 + Math.random() * 45;
    g.strokeStyle = `rgba(180, 210, 255, ${0.08 + Math.random() * 0.16})`;
    g.lineWidth = 1 + Math.random();
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x - 3, y + len);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function skylineTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#05040a");
  grad.addColorStop(0.55, "#120a1e");
  grad.addColorStop(0.8, "#2a1030");
  grad.addColorStop(1, "#3d1038");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  // distant towers with pinprick windows
  for (let i = 0; i < 42; i++) {
    const w = 18 + Math.random() * 52;
    const h = 60 + Math.random() * 210;
    const x = Math.random() * c.width;
    g.fillStyle = "#07050d";
    g.fillRect(x, c.height - h, w, h);
    for (let j = 0; j < h / 14; j++) {
      if (Math.random() < 0.3) {
        g.fillStyle = PALETTE[(i + j) % 3];
        g.globalAlpha = 0.35;
        g.fillRect(x + 3 + Math.random() * (w - 8), c.height - h + j * 14, 2.5, 4);
        g.globalAlpha = 1;
      }
    }
  }
  return new THREE.CanvasTexture(c);
}

// 8-frame glitch data-pulse: expanding ring + displaced glitch bars
function pulseSheet() {
  const cell = 256;
  const c = document.createElement("canvas");
  c.width = cell * 4;
  c.height = cell * 2;
  const g = c.getContext("2d")!;
  for (let f = 0; f < 8; f++) {
    const ph = (f + 1) / 8;
    const x0 = (f % 4) * cell;
    const y0 = f < 4 ? 0 : cell;
    const cx = x0 + cell / 2;
    const cy = y0 + cell / 2;
    g.strokeStyle = "#6ff2dd";
    g.shadowColor = "#6ff2dd";
    g.shadowBlur = 16;
    g.lineWidth = 5;
    g.globalAlpha = 1 - ph * 0.6;
    g.beginPath();
    g.arc(cx, cy, 18 + ph * 88, 0, Math.PI * 2);
    g.stroke();
    // glitch bars slicing the ring
    g.globalAlpha = 0.8;
    g.fillStyle = "#ff2d78";
    for (let b = 0; b < 3; b++) {
      const by = cy - 60 + Math.random() * 120;
      g.fillRect(cx - 70 + Math.random() * 40, by, 60 + Math.random() * 60, 4);
    }
    g.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.repeat.set(0.25, 0.5);
  return tex;
}

function Tower({ seed, x, z, w, h }: { seed: number; x: number; z: number; w: number; h: number }) {
  const tex = useMemo(() => towerTexture(seed), [seed]);
  return (
    <mesh position={[x, GROUND_Y + h / 2, z]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

function Sign({ hue, x, y, z, flickerSeed }: { hue: string; x: number; y: number; z: number; flickerSeed: number }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => signTexture(hue), [hue]);
  useFrame((state) => {
    if (!mat.current) return;
    const t = state.clock.elapsedTime;
    // neon flicker: mostly steady, occasional brown-out
    const buzz = Math.sin(t * 31 + flickerSeed * 17) * Math.sin(t * 7 + flickerSeed);
    mat.current.opacity = buzz > 0.93 ? 0.35 : 0.92;
  });
  return (
    <mesh position={[x, y, z]} rotation={[0, x > 0 ? -0.35 : 0.35, 0]}>
      <planeGeometry args={[1.5, 3.75]} />
      <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

function Rain() {
  const texes = useMemo(() => [rainTexture(), rainTexture(), rainTexture()], []);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.1);
    texes.forEach((tex, i) => {
      tex.offset.y += dt * (0.55 - i * 0.14);
      const m = meshes.current[i];
      if (m) {
        m.position.set(
          camera.position.x,
          2 - i,
          camera.position.z - 10 - i * 9
        );
      }
    });
  });
  return (
    <>
      {texes.map((tex, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
        >
          <planeGeometry args={[34 + i * 10, 22]} />
          <meshBasicMaterial
            map={tex}
            transparent
            opacity={0.5 - i * 0.12}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  );
}

function Pulse({ x, y, z }: { x: number; y: number; z: number }) {
  const tex = useMemo(() => pulseSheet(), []);
  useFrame((state) => {
    const f = Math.floor(state.clock.elapsedTime * 9) % 8;
    tex.offset.set((f % 4) / 4, f < 4 ? 0.5 : 0);
  });
  return (
    <mesh position={[x, y, z]}>
      <planeGeometry args={[2.6, 2.6]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// journey-end landmark: a slow data-ring the whole ride aims at
function DataRing() {
  const g = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!g.current) return;
    const t = state.clock.elapsedTime;
    g.current.rotation.z = t * 0.1;
    const pulse = 1 + Math.sin(t * 1.4) * 0.02;
    g.current.scale.setScalar(pulse);
  });
  return (
    <group ref={g} position={[0, 2.5, -185]}>
      <mesh>
        <torusGeometry args={[9, 0.12, 12, 96]} />
        <meshBasicMaterial color="#8b7dff" transparent opacity={0.85} />
      </mesh>
      <mesh>
        <torusGeometry args={[6.6, 0.06, 10, 72]} />
        <meshBasicMaterial color="#ff2d78" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function SkyAndStreet() {
  const sky = useRef<THREE.Mesh>(null);
  const street = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => skylineTexture(), []);
  useFrame(({ camera }) => {
    if (sky.current)
      sky.current.position.set(camera.position.x, 8, camera.position.z - 85);
    if (street.current)
      street.current.position.set(0, GROUND_Y, camera.position.z - 90);
  });
  return (
    <>
      <mesh ref={sky}>
        <planeGeometry args={[260, 110]} />
        <meshBasicMaterial map={tex} depthWrite={false} fog={false} />
      </mesh>
      <mesh ref={street} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 280]} />
        <meshBasicMaterial color="#0a0714" />
      </mesh>
    </>
  );
}

const TOWERS: [number, number, number, number][] = [
  // [x, z, w, h] — a canyon of light either side of the ride
  [-8, -14, 5, 13],
  [7.5, -22, 4.5, 10],
  [-7, -34, 4, 15],
  [9, -42, 6, 12],
  [-9.5, -55, 5, 11],
  [7, -64, 4.2, 16],
  [-7.5, -78, 4.8, 12],
  [10, -88, 6, 14],
  [-8, -100, 4.2, 10],
  [7.2, -112, 4.6, 15],
  [-10, -126, 5.5, 12],
  [8, -138, 4.4, 11],
  [-7.4, -152, 4.6, 14],
  [9.5, -164, 5.2, 12],
];

export default function NeonCity() {
  return (
    <group>
      <SkyAndStreet />
      {TOWERS.map(([x, z, w, h], i) => (
        <Tower key={i} seed={i + 3} x={x} z={z} w={w} h={h} />
      ))}
      <Sign hue="#ff2d78" x={-5.6} y={0.5} z={-30} flickerSeed={1} />
      <Sign hue="#6ff2dd" x={5.4} y={1.4} z={-60} flickerSeed={2} />
      <Sign hue="#8b7dff" x={-5.2} y={0.2} z={-96} flickerSeed={3} />
      <Sign hue="#ff2d78" x={5.6} y={1} z={-132} flickerSeed={4} />
      <Pulse x={4.6} y={1.8} z={-38} />
      <Pulse x={-4.8} y={2.4} z={-106} />
      <Rain />
      <DataRing />
    </group>
  );
}
