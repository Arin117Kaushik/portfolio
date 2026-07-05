"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WORLDS } from "@/lib/worlds";

// THE CAMP — the exit scene. A fire at dusk after the four worlds:
// crossed logs, a flickering flame flipbook, rising embers, a tent,
// and the worlds themselves as four colored lights on the horizon.
// The terminal (DOM) sits beside the fire; this is just the warmth.

const INK = "#0d0805";
const GROUND_Y = -3.2;

function nightSkyTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#05060f");
  grad.addColorStop(0.55, "#0b0d1d");
  grad.addColorStop(0.82, "#241226");
  grad.addColorStop(1, "#3a1a20");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  // stars
  for (let i = 0; i < 130; i++) {
    g.fillStyle = `rgba(230, 236, 245, ${0.25 + Math.random() * 0.6})`;
    g.beginPath();
    g.arc(
      Math.random() * c.width,
      Math.random() * c.height * 0.75,
      Math.random() * 1.3 + 0.3,
      0,
      Math.PI * 2
    );
    g.fill();
  }
  // rolling horizon silhouette
  g.fillStyle = "#060409";
  g.beginPath();
  g.moveTo(0, c.height);
  for (let x = 0; x <= c.width; x += 32) {
    g.lineTo(x, c.height - 40 - Math.sin(x * 0.008) * 22 - Math.sin(x * 0.021) * 12);
  }
  g.lineTo(c.width, c.height);
  g.closePath();
  g.fill();
  // the four worlds — distant lights along the horizon
  WORLDS.forEach((w, i) => {
    const x = 220 + i * 190;
    const y = c.height - 68;
    const glow = g.createRadialGradient(x, y, 1, x, y, 26);
    glow.addColorStop(0, `${w.color}dd`);
    glow.addColorStop(0.35, `${w.color}44`);
    glow.addColorStop(1, `${w.color}00`);
    g.fillStyle = glow;
    g.fillRect(x - 26, y - 26, 52, 52);
  });
  return new THREE.CanvasTexture(c);
}

// 8-frame fire: a hand-drawn teardrop flame, licking differently each cell
function flameSheet() {
  const cell = 256;
  const c = document.createElement("canvas");
  c.width = cell * 4;
  c.height = cell * 2;
  const g = c.getContext("2d")!;
  for (let f = 0; f < 8; f++) {
    const ph = f / 8;
    const x0 = (f % 4) * cell;
    const y0 = f < 4 ? 0 : cell;
    const cx = x0 + cell / 2;
    const base = y0 + cell * 0.86;
    const sway = Math.sin(ph * Math.PI * 2) * 14;
    const h = cell * (0.55 + Math.sin(ph * Math.PI * 4) * 0.07);
    const tongue = (w: number, hh: number, color: string, dx: number) => {
      g.fillStyle = color;
      g.beginPath();
      g.moveTo(cx - w + dx * 0.3, base);
      g.quadraticCurveTo(cx - w * 0.9 + dx, base - hh * 0.5, cx + dx + sway * (hh / h), base - hh);
      g.quadraticCurveTo(cx + w * 0.9 + dx, base - hh * 0.5, cx + w + dx * 0.3, base);
      g.closePath();
      g.fill();
    };
    tongue(52, h, "#c4400f", 0);
    tongue(36, h * 0.78, "#e8791e", Math.sin(ph * Math.PI * 2 + 1) * 8);
    tongue(20, h * 0.52, "#ffc84a", Math.sin(ph * Math.PI * 2 + 2.4) * 6);
    // a spark or two leaving the tip
    if (f % 2 === 0) {
      g.fillStyle = "#ffd97a";
      g.beginPath();
      g.arc(cx + sway, base - h - 14 - (f % 4) * 6, 3, 0, Math.PI * 2);
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.repeat.set(0.25, 0.5);
  return tex;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  const glow = g.createRadialGradient(128, 128, 4, 128, 128, 126);
  glow.addColorStop(0, "rgba(255, 170, 80, 0.5)");
  glow.addColorStop(0.35, "rgba(220, 110, 40, 0.18)");
  glow.addColorStop(1, "rgba(200, 90, 30, 0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function emberTexture() {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const g = c.getContext("2d")!;
  const glow = g.createRadialGradient(16, 16, 1, 16, 16, 15);
  glow.addColorStop(0, "rgba(255, 200, 120, 1)");
  glow.addColorStop(0.4, "rgba(255, 140, 60, 0.6)");
  glow.addColorStop(1, "rgba(255, 120, 40, 0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

function tentTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const g = c.getContext("2d")!;
  g.fillStyle = INK;
  // tent
  g.beginPath();
  g.moveTo(40, 300);
  g.lineTo(230, 60);
  g.lineTo(420, 300);
  g.closePath();
  g.fill();
  // opening, faintly warm from the fire
  g.fillStyle = "rgba(120, 60, 25, 0.55)";
  g.beginPath();
  g.moveTo(180, 300);
  g.lineTo(230, 150);
  g.lineTo(280, 300);
  g.closePath();
  g.fill();
  // guy line + peg
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(230, 60);
  g.lineTo(480, 296);
  g.stroke();
  return new THREE.CanvasTexture(c);
}

const FIRE_X = -2.4;
const FIRE_Z = -10;

function Fire() {
  const flame = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const flameTex = useMemo(() => flameSheet(), []);
  const glowTex = useMemo(() => glowTexture(), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // fire on 3s — slower than the horses, fire is lazy
    const f = Math.floor(t * 8) % 8;
    flameTex.offset.set((f % 4) / 4, f < 4 ? 0.5 : 0);
    if (glow.current) {
      const flicker =
        1 + Math.sin(t * 7.3) * 0.05 + Math.sin(t * 13.7) * 0.04;
      glow.current.scale.setScalar(flicker * 5.2);
    }
    if (flame.current) {
      flame.current.scale.x = 1 + Math.sin(t * 9.1) * 0.04;
    }
  });
  return (
    <group position={[FIRE_X, 0, FIRE_Z]}>
      {/* crossed logs */}
      <mesh position={[0, GROUND_Y + 0.72, 0.02]} rotation={[0, 0, 0.5]}>
        <planeGeometry args={[1.7, 0.22]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <mesh position={[0, GROUND_Y + 0.72, 0.01]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[1.7, 0.22]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      {/* warm pool on the ground + air glow */}
      <mesh ref={glow} position={[0, GROUND_Y + 1.1, -0.1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glowTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={flame} position={[0, GROUND_Y + 1.35, 0]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial
          map={flameTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

const EMBERS = Array.from({ length: 10 }, (_, i) => ({
  offset: i * 0.73,
  speed: 0.5 + (i % 3) * 0.2,
  drift: (i % 2 === 0 ? 1 : -1) * (0.2 + (i % 4) * 0.1),
}));

function Embers() {
  const group = useRef<THREE.Group>(null);
  const tex = useMemo(() => emberTexture(), []);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.children.forEach((ember, i) => {
      const e = EMBERS[i];
      const life = ((t * e.speed + e.offset) % 3) / 3; // 0 → 1 and gone
      ember.position.set(
        FIRE_X + Math.sin(t * 1.3 + i * 2) * 0.3 * life + e.drift * life,
        GROUND_Y + 1.5 + life * 3.4,
        FIRE_Z + 0.1
      );
      const m = (ember as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = (1 - life) * 0.85;
      ember.scale.setScalar(0.08 + (1 - life) * 0.06);
    });
  });
  return (
    <group ref={group}>
      {EMBERS.map((_, i) => (
        <mesh key={i}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={tex}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Camp() {
  const skyTex = useMemo(() => nightSkyTexture(), []);
  const tentTex = useMemo(() => tentTexture(), []);
  return (
    <group>
      {/* static scene — the camera parks at the hub seat during camp */}
      <mesh position={[0, 6, -60]}>
        <planeGeometry args={[160, 70]} />
        <meshBasicMaterial map={skyTex} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, GROUND_Y, -30]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 90]} />
        <meshBasicMaterial color="#0a0605" />
      </mesh>
      <mesh position={[-7.5, GROUND_Y + 1.15, -14]}>
        <planeGeometry args={[4.6, 2.9]} />
        <meshBasicMaterial map={tentTex} transparent depthWrite={false} />
      </mesh>
      <Fire />
      <Embers />
    </group>
  );
}
