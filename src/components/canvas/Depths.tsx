"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/store";

// WORLD 03 — HOLLOW DEPTHS. A vast quiet cavern: silhouette stalactites
// and stalagmites, hanging roots, bioluminescent mushroom clusters and
// drifting wisps. The player orb is the only light — a soft pool that
// travels with the camera. The ride ends at a luminous root-heart.
// Canvas placeholder art in final positions; AI plates swap in later.

const INK = "#05070d"; // cool near-black for all silhouettes
const TEAL = "#5fd4c0";
const GHOST = "#dfe7ee";
const GROUND_Y = -3.2;
const CEIL_Y = 6.4;

function cavernTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#04050a");
  grad.addColorStop(0.5, "#0a0e1a");
  grad.addColorStop(1, "#070b14");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  // faint bioluminescent haze pooling low in the cave
  const glow = g.createRadialGradient(512, 470, 30, 512, 470, 420);
  glow.addColorStop(0, "rgba(95, 212, 192, 0.16)");
  glow.addColorStop(0.5, "rgba(95, 212, 192, 0.05)");
  glow.addColorStop(1, "rgba(95, 212, 192, 0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, c.width, c.height);
  // distant rock teeth against the haze
  g.fillStyle = "#030408";
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * c.width;
    const w = 30 + Math.random() * 90;
    const h = 60 + Math.random() * 190;
    g.beginPath();
    g.moveTo(x - w / 2, c.height);
    g.lineTo(x, c.height - h);
    g.lineTo(x + w / 2, c.height);
    g.closePath();
    g.fill();
    if (Math.random() < 0.5) {
      const hh = 50 + Math.random() * 150;
      g.beginPath();
      g.moveTo(x - w / 2, 0);
      g.lineTo(x + 10, hh);
      g.lineTo(x + w / 2, 0);
      g.closePath();
      g.fill();
    }
  }
  // pinprick spores in the haze
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(150, 230, 215, ${0.12 + Math.random() * 0.3})`;
    g.beginPath();
    g.arc(
      Math.random() * c.width,
      c.height * 0.45 + Math.random() * c.height * 0.5,
      0.8 + Math.random() * 1.6,
      0,
      Math.PI * 2
    );
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

function makeFlat(
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 256
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = INK;
  g.strokeStyle = INK;
  draw(g, w, h);
  return new THREE.CanvasTexture(c);
}

// jagged rising teeth — flip=true renders them hanging from the ceiling
const drawTeeth =
  (flip: boolean) => (g: CanvasRenderingContext2D, w: number, h: number) => {
    if (flip) {
      g.translate(0, h);
      g.scale(1, -1);
    }
    let x = 0;
    g.beginPath();
    g.moveTo(0, h);
    while (x < w) {
      const tw = 40 + Math.random() * 90;
      const th = h * (0.35 + Math.random() * 0.6);
      g.lineTo(x + tw * 0.5, h - th);
      g.lineTo(x + tw, h);
      x += tw;
    }
    g.lineTo(w, h);
    g.closePath();
    g.fill();
  };

const drawRoots = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const x = (i / 5.5) * w + Math.random() * 24;
    let px = x;
    let py = 0;
    g.lineWidth = 9 - i * 0.8;
    g.beginPath();
    g.moveTo(px, py);
    const segs = 5 + Math.floor(Math.random() * 3);
    for (let s = 0; s < segs; s++) {
      px += (Math.random() - 0.5) * 46;
      py += h / segs;
      g.lineTo(px, py * (0.6 + Math.random() * 0.35));
    }
    g.stroke();
  }
};

// glowing mushroom cluster — the caps carry their own light
function mushroomTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 160;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 5; i++) {
    const x = 30 + i * 48 + Math.random() * 14;
    const s = 0.5 + Math.random() * 0.8;
    const capW = 34 * s;
    const capH = 20 * s;
    const stemH = 40 * s;
    const y = c.height - 8;
    // stem
    g.strokeStyle = "rgba(120, 190, 180, 0.5)";
    g.lineWidth = 6 * s;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x, y - stemH);
    g.stroke();
    // cap glow
    const glow = g.createRadialGradient(x, y - stemH, 2, x, y - stemH, capW * 2);
    glow.addColorStop(0, "rgba(95, 212, 192, 0.85)");
    glow.addColorStop(0.4, "rgba(95, 212, 192, 0.25)");
    glow.addColorStop(1, "rgba(95, 212, 192, 0)");
    g.fillStyle = glow;
    g.fillRect(x - capW * 2, y - stemH - capW * 2, capW * 4, capW * 4);
    // cap
    g.fillStyle = TEAL;
    g.beginPath();
    g.ellipse(x, y - stemH, capW, capH, 0, Math.PI, 0);
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

// 8-frame wisp: a soft breathing orb with drifting spark satellites
function wispSheet() {
  const cell = 128;
  const c = document.createElement("canvas");
  c.width = cell * 4;
  c.height = cell * 2;
  const g = c.getContext("2d")!;
  for (let f = 0; f < 8; f++) {
    const ph = f / 8;
    const x0 = (f % 4) * cell;
    const y0 = f < 4 ? 0 : cell;
    const cx = x0 + cell / 2;
    const cy = y0 + cell / 2;
    const breathe = 1 + Math.sin(ph * Math.PI * 2) * 0.25;
    const r = 16 * breathe;
    const glow = g.createRadialGradient(cx, cy, 1, cx, cy, r * 2.6);
    glow.addColorStop(0, "rgba(223, 231, 238, 0.95)");
    glow.addColorStop(0.25, "rgba(160, 230, 215, 0.5)");
    glow.addColorStop(1, "rgba(95, 212, 192, 0)");
    g.fillStyle = glow;
    g.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
    // satellites orbiting on the flipbook cadence
    for (let s = 0; s < 3; s++) {
      const a = ph * Math.PI * 2 + (s / 3) * Math.PI * 2;
      g.fillStyle = "rgba(200, 240, 230, 0.8)";
      g.beginPath();
      g.arc(cx + Math.cos(a) * r * 1.9, cy + Math.sin(a) * r * 1.4, 2.2, 0, Math.PI * 2);
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.repeat.set(0.25, 0.5);
  return tex;
}

function Wisp({
  x,
  y,
  z,
  offset,
  scale,
}: {
  x: number;
  y: number;
  z: number;
  offset: number;
  scale: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => wispSheet(), []);
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    // steps at 9fps — the hand-animated look
    const f = Math.floor(t * 9 + offset * 8) % 8;
    tex.offset.set((f % 4) / 4, f < 4 ? 0.5 : 0);
    // slow lantern drift
    m.position.set(
      x + Math.sin(t * 0.3 + offset * 9) * 1.6,
      y + Math.sin(t * 0.45 + offset * 5) * 0.9,
      z
    );
  });
  return (
    <mesh ref={mesh} position={[x, y, z]} scale={[scale, scale, 1]}>
      <planeGeometry args={[1.6, 1.6]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// the player orb's light pool — travels just ahead of the camera, the
// only warm presence in the dark
function OrbLight() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    const glow = g.createRadialGradient(128, 128, 4, 128, 128, 126);
    glow.addColorStop(0, "rgba(223, 231, 238, 0.34)");
    glow.addColorStop(0.3, "rgba(150, 225, 210, 0.13)");
    glow.addColorStop(1, "rgba(95, 212, 192, 0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  useFrame(({ camera, clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;
    // a lantern low over the path, not a fog bank in the lens
    m.position.set(
      camera.position.x + Math.sin(t * 0.6) * 0.4,
      -1.6 + Math.sin(t * 0.8) * 0.25,
      camera.position.z - 7
    );
    // hand the finale to the root-heart — the orb dims as it approaches
    if (mat.current) {
      const fade =
        1 - THREE.MathUtils.clamp((scrollState.current - 0.72) / 0.12, 0, 1);
      mat.current.opacity = fade;
    }
  });
  return (
    <mesh ref={mesh}>
      <planeGeometry args={[4.2, 4.2]} />
      <meshBasicMaterial
        ref={mat}
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// journey-end landmark: a luminous root-heart, breathing slowly
function RootHeart() {
  const g = useRef<THREE.Group>(null);
  const coreTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    const glow = ctx.createRadialGradient(256, 256, 10, 256, 256, 250);
    glow.addColorStop(0, "rgba(230, 245, 240, 0.95)");
    glow.addColorStop(0.2, "rgba(150, 230, 215, 0.55)");
    glow.addColorStop(0.6, "rgba(95, 212, 192, 0.16)");
    glow.addColorStop(1, "rgba(95, 212, 192, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 512, 512);
    // root strands feeding the core
    ctx.strokeStyle = "rgba(95, 212, 192, 0.5)";
    ctx.lineCap = "round";
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.lineWidth = 3 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(256 + Math.cos(a) * 60, 256 + Math.sin(a) * 60);
      ctx.quadraticCurveTo(
        256 + Math.cos(a + 0.5) * 160,
        256 + Math.sin(a + 0.5) * 160,
        256 + Math.cos(a + 0.2) * 246,
        256 + Math.sin(a + 0.2) * 246
      );
      ctx.stroke();
    }
    return new THREE.CanvasTexture(c);
  }, []);
  useFrame((state) => {
    if (!g.current) return;
    const t = state.clock.elapsedTime;
    // a slow heartbeat, not a machine pulse
    const beat = 1 + Math.max(0, Math.sin(t * 1.1)) ** 6 * 0.09;
    g.current.scale.setScalar(beat);
    g.current.rotation.z = Math.sin(t * 0.12) * 0.1;
  });
  return (
    <group ref={g} position={[0, 1.5, -185]}>
      <mesh>
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial
          map={coreTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

interface FlatSpec {
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
}

const FLATS: FlatSpec[] = [
  // ground teeth and ceiling teeth alternating down the cavern
  { draw: drawTeeth(false), x: -9, y: GROUND_Y + 2.5, z: -16, w: 16, h: 5 },
  { draw: drawTeeth(true), x: 7, y: CEIL_Y - 2, z: -24, w: 18, h: 6 },
  { draw: drawRoots, x: -5, y: CEIL_Y - 3.5, z: -34, w: 8, h: 7 },
  { draw: drawTeeth(false), x: 10, y: GROUND_Y + 3, z: -44, w: 20, h: 6 },
  { draw: drawTeeth(true), x: -8, y: CEIL_Y - 2.5, z: -56, w: 17, h: 7 },
  { draw: drawRoots, x: 6, y: CEIL_Y - 3.5, z: -68, w: 8, h: 7 },
  { draw: drawTeeth(false), x: -11, y: GROUND_Y + 3.5, z: -82, w: 22, h: 7 },
  { draw: drawTeeth(true), x: 9, y: CEIL_Y - 3, z: -96, w: 19, h: 8 },
  { draw: drawRoots, x: -6, y: CEIL_Y - 3.5, z: -108, w: 9, h: 7 },
  { draw: drawTeeth(false), x: 8, y: GROUND_Y + 3, z: -122, w: 20, h: 6 },
  { draw: drawTeeth(true), x: -7, y: CEIL_Y - 2.5, z: -136, w: 18, h: 7 },
  { draw: drawTeeth(false), x: -12, y: GROUND_Y + 4, z: -154, w: 26, h: 8 },
];

const MUSHROOMS: [number, number][] = [
  // [x, z] clusters lighting the path edges
  [-5.5, -28],
  [6, -50],
  [-6.5, -74],
  [5, -100],
  [-5, -128],
  [6.5, -150],
];

function Flat({ spec }: { spec: FlatSpec }) {
  const tex = useMemo(() => makeFlat(spec.draw), [spec]);
  return (
    <mesh position={[spec.x, spec.y, spec.z]}>
      <planeGeometry args={[spec.w, spec.h]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

function CavernShell() {
  const back = useRef<THREE.Mesh>(null);
  const floor = useRef<THREE.Mesh>(null);
  const ceil = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => cavernTexture(), []);
  // the cave travels with the camera so the dark never runs out
  useFrame(({ camera }) => {
    if (back.current)
      back.current.position.set(camera.position.x, 2, camera.position.z - 85);
    if (floor.current)
      floor.current.position.set(0, GROUND_Y, camera.position.z - 90);
    if (ceil.current)
      ceil.current.position.set(0, CEIL_Y, camera.position.z - 90);
  });
  return (
    <>
      <mesh ref={back}>
        <planeGeometry args={[260, 110]} />
        <meshBasicMaterial map={tex} depthWrite={false} fog={false} />
      </mesh>
      <mesh ref={floor} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 280]} />
        <meshBasicMaterial color="#04060b" />
      </mesh>
      <mesh ref={ceil} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 280]} />
        <meshBasicMaterial color="#03050a" />
      </mesh>
    </>
  );
}

export default function Depths() {
  const mushTex = useMemo(() => mushroomTexture(), []);
  return (
    <group>
      <CavernShell />
      {FLATS.map((spec, i) => (
        <Flat key={i} spec={spec} />
      ))}
      {MUSHROOMS.map(([x, z], i) => (
        <mesh key={i} position={[x, GROUND_Y + 0.55, z]}>
          <planeGeometry args={[2.6, 1.6]} />
          <meshBasicMaterial
            map={mushTex}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      <Wisp x={-3} y={1.2} z={-30} offset={0} scale={1} />
      <Wisp x={4} y={0.4} z={-62} offset={0.35} scale={0.8} />
      <Wisp x={-4.5} y={2} z={-92} offset={0.6} scale={1.15} />
      <Wisp x={3.5} y={1} z={-118} offset={0.2} scale={0.7} />
      <Wisp x={-2.5} y={0.2} z={-146} offset={0.8} scale={0.95} />
      <OrbLight />
      <RootHeart />
    </group>
  );
}
