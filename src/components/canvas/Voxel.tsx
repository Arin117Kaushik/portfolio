"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/store";

// WORLD 04 — VOXEL PLAINS. A cozy block world that ASSEMBLES as you
// travel: every block rises and pops into place just ahead of the
// camera (scrubbed by scroll, so riding backwards un-builds it).
// Trees, a farm that builds itself mid-ride, crop rows, and a sunrise
// gate at the end. One InstancedMesh carries the whole world.

const GROUND_Y = -3.2;
const STEP = 2; // block lattice pitch
// nearly gapless — open seams let the bright sky slit through stacked
// blocks and bloom into streaks; color variation alone reads as voxels
const SIZE = 1.97;

// palette — flat colors per block type, vertex-lit feel comes from bloom
const GRASS = ["#7cb85c", "#6fae52", "#86c266"];
const SOIL = "#9c6b43";
const WOOD = "#7a5230";
const LEAF = ["#5da84e", "#529a45"];
const GOLD = "#ffd97a";
const STONE = "#9aa3ad";

interface Block {
  x: number;
  y: number;
  z: number;
  color: string;
}

function buildWorld(): Block[] {
  const blocks: Block[] = [];
  const rng = (() => {
    // deterministic layout — the world is the same on every visit
    let s = 1337;
    return () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
  })();

  const push = (x: number, y: number, z: number, color: string) =>
    blocks.push({ x, y, z, color });

  // ground plain, with occasional soil pits and grass mounds
  for (let z = -8; z >= -168; z -= STEP) {
    for (let x = -8; x <= 8; x += STEP) {
      const r = rng();
      if (r < 0.1) continue; // gaps read as un-generated chunks
      const color = r < 0.2 ? SOIL : GRASS[Math.floor(rng() * GRASS.length)];
      push(x, GROUND_Y, z, color);
      if (rng() < 0.06) push(x, GROUND_Y + STEP, z, GRASS[0]); // mound
    }
  }

  // trees — trunk + leaf crown
  const trees: [number, number][] = [
    [-6, -22],
    [8, -38],
    [-8, -58],
    [6, -74],
    [-6, -112],
    [8, -130],
    [-8, -148],
  ];
  trees.forEach(([tx, tz]) => {
    push(tx, GROUND_Y + STEP, tz, WOOD);
    push(tx, GROUND_Y + STEP * 2, tz, WOOD);
    for (let dx = -STEP; dx <= STEP; dx += STEP) {
      for (let dz = -STEP; dz <= STEP; dz += STEP) {
        if (Math.abs(dx) === STEP && Math.abs(dz) === STEP && rng() < 0.5)
          continue; // clipped corners — hand-placed look
        push(tx + dx, GROUND_Y + STEP * 3, tz + dz, LEAF[Math.floor(rng() * 2)]);
      }
    }
    push(tx, GROUND_Y + STEP * 4, tz, LEAF[0]);
  });

  // the farm — a small workshop that assembles itself mid-ride
  const fx = 7;
  const fz = -92;
  for (let dx = 0; dx <= STEP * 2; dx += STEP) {
    for (let dz = 0; dz <= STEP * 2; dz += STEP) {
      const edge = dx === 0 || dx === STEP * 2 || dz === 0 || dz === STEP * 2;
      if (edge) {
        push(fx + dx, GROUND_Y + STEP, fz - dz, WOOD);
        // door gap on the ride-facing wall
        if (!(dx === 0 && dz === STEP))
          push(fx + dx, GROUND_Y + STEP * 2, fz - dz, WOOD);
      }
    }
  }
  for (let dx = 0; dx <= STEP * 2; dx += STEP)
    for (let dz = 0; dz <= STEP * 2; dz += STEP)
      push(fx + dx, GROUND_Y + STEP * 3, fz - dz, STONE); // slab roof
  push(fx + STEP, GROUND_Y + STEP * 4, fz - STEP, STONE); // cap

  // crop rows outside the farm — the gold that grows from routine
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 5; i++)
      push(-4 - row * STEP, GROUND_Y + STEP, -84 - i * STEP, GOLD);

  // sunrise gate — the journey-end landmark, a golden arch on a hill
  const gz = -180;
  for (let x = -6; x <= 6; x += STEP)
    push(x, GROUND_Y, gz, GRASS[Math.floor(rng() * 3)]);
  for (let h = 1; h <= 5; h++) {
    push(-4, GROUND_Y + STEP * h, gz, GOLD);
    push(4, GROUND_Y + STEP * h, gz, GOLD);
  }
  for (let x = -4; x <= 4; x += STEP) push(x, GROUND_Y + STEP * 6, gz, GOLD);

  return blocks;
}

// camera z for a given progress once the dive has landed (wt = 1):
// z = CAM_START + (CAM_END - CAM_START) * p - DIVE_DEPTH
const camZ = (p: number) => 8 - 226 * p - 10;

const REVEAL_AHEAD = 42; // blocks start rising this far ahead of the camera
const POP_RANGE = 14; // and land over this distance

function Terrain() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const blocks = useMemo(() => buildWorld(), []);

  // colors are static — write them once
  const colorArray = useMemo(() => {
    const arr = new Float32Array(blocks.length * 3);
    const c = new THREE.Color();
    blocks.forEach((b, i) => {
      c.set(b.color);
      c.toArray(arr, i * 3);
    });
    return arr;
  }, [blocks]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const cz = camZ(scrollState.current);
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      // distance the camera still has to travel to reach this block
      const d = cz - b.z;
      const raw = (REVEAL_AHEAD - d) / POP_RANGE;
      const t = THREE.MathUtils.clamp(raw, 0, 1);
      const s = t * t * (3 - 2 * t); // smoothstep pop
      dummy.position.set(b.x, b.y - (1 - s) * 3.2, b.z);
      dummy.scale.setScalar(s * SIZE);
      dummy.rotation.set(0, (1 - s) * 0.6, 0); // settle with a small twist
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, blocks.length]}>
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
        />
      </boxGeometry>
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}

function skyTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, "#8fd3ff");
  grad.addColorStop(0.62, "#bfe6ff");
  grad.addColorStop(0.8, "#ffe9b8");
  grad.addColorStop(1, "#ffd97a");
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  // square sun — everything here is blocks, even the sky
  g.fillStyle = "#fff3c9";
  g.fillRect(700, 300, 70, 70);
  g.fillStyle = "rgba(255, 243, 201, 0.4)";
  g.fillRect(686, 286, 98, 98);
  // blocky clouds
  g.fillStyle = "rgba(255, 255, 255, 0.9)";
  const cloud = (x: number, y: number, s: number) => {
    g.fillRect(x, y, 90 * s, 22 * s);
    g.fillRect(x + 20 * s, y - 16 * s, 55 * s, 18 * s);
    g.fillRect(x + 60 * s, y + 10 * s, 50 * s, 16 * s);
  };
  cloud(120, 120, 1);
  cloud(420, 80, 0.7);
  cloud(760, 150, 1.2);
  cloud(260, 210, 0.55);
  return new THREE.CanvasTexture(c);
}

function SkyAndGround() {
  const sky = useRef<THREE.Mesh>(null);
  const ground = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => skyTexture(), []);
  useFrame(({ camera }) => {
    if (sky.current)
      sky.current.position.set(camera.position.x, 9, camera.position.z - 85);
    if (ground.current)
      ground.current.position.set(0, GROUND_Y - 1, camera.position.z - 90);
  });
  return (
    <>
      <mesh ref={sky}>
        <planeGeometry args={[260, 110]} />
        <meshBasicMaterial map={tex} depthWrite={false} fog={false} />
      </mesh>
      {/* the void under the un-generated world — warm, not scary */}
      <mesh ref={ground} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 280]} />
        <meshBasicMaterial color="#6f9c50" />
      </mesh>
    </>
  );
}

// drifting block-birds: tiny white squares flapping on a flipbook cadence
function Birds() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ camera, clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.children.forEach((bird, i) => {
      bird.position.set(
        camera.position.x - 8 + ((t * 1.4 + i * 7) % 20),
        3.5 + Math.sin(t * 6 + i * 2) * 0.18 + i * 0.8,
        camera.position.z - 40 - i * 6
      );
      bird.scale.y = 0.5 + Math.abs(Math.sin(t * 6 + i * 2)) * 0.5;
    });
  });
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <planeGeometry args={[0.5, 0.3]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function Voxel() {
  return (
    <group>
      <SkyAndGround />
      <Terrain />
      <Birds />
    </group>
  );
}
