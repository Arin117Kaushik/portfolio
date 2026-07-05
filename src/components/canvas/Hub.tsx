"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { audio } from "@/lib/audio";
import { pointerState, useUIStore } from "@/lib/store";
import { WORLDS, WorldMeta } from "@/lib/worlds";

// Level select — four world portals floating in the particle field
// (Active Theory pattern: content as objects in the world, not a menu).
// Cards are canvas-generated for now; each becomes a live window into
// its world once that world ships.

function portalTexture(w: WorldMeta) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 660;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(6, 7, 10, 0.92)";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = w.color;
  g.lineWidth = 4;
  g.strokeRect(16, 16, c.width - 32, c.height - 32);
  // faint inner glow wash at the top
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, `${w.color}30`);
  grad.addColorStop(0.45, "transparent");
  g.fillStyle = grad;
  g.fillRect(16, 16, c.width - 32, c.height - 32);

  g.textAlign = "center";
  g.fillStyle = `${w.color}aa`;
  g.font = "600 96px monospace";
  g.fillText(w.index, c.width / 2, 170);
  g.fillStyle = "#e8ecef";
  g.font = "700 52px monospace";
  g.fillText(w.name, c.width / 2, 340);
  g.fillStyle = "rgba(138, 148, 160, 0.9)";
  g.font = "26px monospace";
  g.fillText(w.tag, c.width / 2, 400);
  g.fillStyle = w.color;
  g.font = "600 28px monospace";
  g.fillText("ENTER →", c.width / 2, 580);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function Portal({ w, i }: { w: WorldMeta; i: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const hot = useRef(false);
  const hover = useRef(0);
  const tex = useMemo(() => portalTexture(w), [w]);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    hover.current +=
      ((hot.current ? 1 : 0) - hover.current) * (1 - Math.exp(-10 * dt));
    m.position.x = w.x + pointerState.x * (0.22 + i * 0.04);
    m.position.y =
      Math.sin(t * 0.7 + i * 1.7) * 0.16 +
      pointerState.y * 0.15 +
      hover.current * 0.1;
    m.rotation.y = -w.x * 0.028 + pointerState.x * 0.05;
    m.scale.setScalar(1 + hover.current * 0.07);
    (m.material as THREE.MeshBasicMaterial).opacity =
      0.82 + hover.current * 0.18;
  });

  return (
    <mesh
      ref={mesh}
      position={[w.x, 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!hot.current) audio.blip();
        hot.current = true;
      }}
      onPointerOut={() => {
        hot.current = false;
      }}
      onClick={(e) => {
        e.stopPropagation();
        audio.tick();
        useUIStore.getState().setWorld(w.id);
      }}
    >
      <planeGeometry args={[2.7, 3.5]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

export default function Hub() {
  const booted = useUIStore((s) => s.booted);
  const world = useUIStore((s) => s.world);

  // invisible groups are skipped by the raycaster, so portals can't be
  // clicked before boot or from inside a world
  return (
    <group visible={booted && world === "hub"} position={[0, 0, 0]}>
      {booted && world === "hub" && WORLDS.map((w, i) => <Portal key={w.id} w={w} i={i} />)}
    </group>
  );
}
