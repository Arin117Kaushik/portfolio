"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointerState } from "@/lib/store";
import { useProximityFade } from "./Stations";

// Image-driven station art — PLACEHOLDER EDITION. All the machinery for
// Phase 3 (layered 2.5D dioramas with pointer parallax + an anime-style
// flipbook stepping "on 2s/3s") running against canvas-generated stand-in
// textures. When Arin's AI images land, each makeLayerTexture call swaps
// for a TextureLoader load of the real file — nothing else changes.
// Frame specs the images must match live in [[AI Image Prompts - Portfolio]].

interface ArtConfig {
  z: number;
  hex: string;
  label: string;
  side: 1 | -1; // which side of the axis the wisp + offsets favour
}

const ART: ArtConfig[] = [
  { z: -68, hex: "#6ff2dd", label: "STATION 01 // VAHAN GATE", side: -1 },
  { z: -118, hex: "#8b7dff", label: "STATION 02 // TAXONOMY", side: 1 },
  { z: -170, hex: "#ffbe6b", label: "STATION 03 // SIGNAL", side: -1 },
];

function makeLayerTexture(label: string, sub: string, hex: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 640;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(8, 10, 14, 0.88)";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = hex;
  g.lineWidth = 3;
  g.globalAlpha = 0.85;
  g.strokeRect(24, 24, c.width - 48, c.height - 48);
  g.globalAlpha = 0.12;
  g.beginPath();
  g.moveTo(24, 24);
  g.lineTo(c.width - 24, c.height - 24);
  g.moveTo(c.width - 24, 24);
  g.lineTo(24, c.height - 24);
  g.stroke();
  g.globalAlpha = 1;
  g.textAlign = "center";
  g.fillStyle = hex;
  g.font = "600 44px monospace";
  g.fillText(label, c.width / 2, c.height / 2 - 10);
  g.fillStyle = "rgba(232, 236, 239, 0.55)";
  g.font = "26px monospace";
  g.fillText(sub, c.width / 2, c.height / 2 + 38);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

// 4×2 sprite sheet, 8 cells: an arc that completes one sweep across the
// loop plus an orbiting dot — enough motion to prove the stepping reads.
function makeFlipbookTexture(hex: string) {
  const cell = 256;
  const c = document.createElement("canvas");
  c.width = cell * 4;
  c.height = cell * 2;
  const g = c.getContext("2d")!;
  for (let f = 0; f < 8; f++) {
    const x0 = (f % 4) * cell;
    const y0 = f < 4 ? 0 : cell;
    g.fillStyle = "rgba(8, 10, 14, 0.8)";
    g.fillRect(x0 + 6, y0 + 6, cell - 12, cell - 12);
    const cx = x0 + cell / 2;
    const cy = y0 + cell / 2;
    const a = ((f + 1) / 8) * Math.PI * 2;
    g.strokeStyle = hex;
    g.lineWidth = 8;
    g.beginPath();
    g.arc(cx, cy, 70, -Math.PI / 2, -Math.PI / 2 + a);
    g.stroke();
    g.fillStyle = hex;
    g.beginPath();
    g.arc(cx + Math.cos(a) * 96, cy + Math.sin(a) * 96, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(232, 236, 239, 0.4)";
    g.font = "22px monospace";
    g.textAlign = "center";
    g.fillText(`f${f + 1}/8`, cx, y0 + cell - 26);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.repeat.set(0.25, 0.5);
  return tex;
}

function ArtLayer({
  tex,
  base,
  size,
  opacity,
  parallax,
}: {
  tex: THREE.Texture;
  base: [number, number, number];
  size: [number, number];
  opacity: number;
  parallax: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  // deeper layers drift less — that differential IS the 2.5D effect
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.x = base[0] + pointerState.x * parallax;
    ref.current.position.y = base[1] + pointerState.y * parallax * 0.6;
  });

  return (
    <mesh ref={ref} position={base}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function Flipbook({ hex, position }: { hex: string; position: [number, number, number] }) {
  const tex = useMemo(() => makeFlipbookTexture(hex), [hex]);

  // steps at 9fps regardless of render rate — "on 2s/3s"; the choppiness
  // against the smooth field is the anime look, not a defect
  useFrame((state) => {
    const f = Math.floor(state.clock.elapsedTime * 9) % 8;
    tex.offset.set((f % 4) / 4, f < 4 ? 0.5 : 0);
  });

  return (
    <mesh position={position}>
      <planeGeometry args={[2.3, 2.3]} />
      <meshBasicMaterial map={tex} transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}

function StationArtGroup({ cfg, index }: { cfg: ArtConfig; index: number }) {
  const g = useRef<THREE.Group>(null);
  useProximityFade(g, cfg.z);

  const n = String(index + 1).padStart(2, "0");
  const textures = useMemo(
    () => ({
      back: makeLayerTexture(cfg.label, `art slot — back plate`, cfg.hex),
      mid: makeLayerTexture(`HERO ${n}`, `art slot — mid layer`, cfg.hex),
      front: makeLayerTexture(`DETAIL ${n}`, `art slot — front cutout`, cfg.hex),
    }),
    [cfg.hex, cfg.label, n]
  );

  return (
    <group ref={g}>
      <ArtLayer
        tex={textures.back}
        base={[0, 0.4, cfg.z - 8]}
        size={[15, 9.4]}
        opacity={0.22}
        parallax={0.18}
      />
      <ArtLayer
        tex={textures.mid}
        base={[cfg.side * 1.6, 0.9, cfg.z - 4.5]}
        size={[8.5, 5.3]}
        opacity={0.34}
        parallax={0.45}
      />
      <ArtLayer
        tex={textures.front}
        base={[cfg.side * -2.6, -1.1, cfg.z - 1.8]}
        size={[4.6, 2.9]}
        opacity={0.42}
        parallax={0.85}
      />
      <Flipbook hex={cfg.hex} position={[cfg.side * 5.2, 1.4, cfg.z - 2.5]} />
    </group>
  );
}

export default function StationArt() {
  return (
    <>
      {ART.map((cfg, i) => (
        <StationArtGroup key={cfg.label} cfg={cfg} index={i} />
      ))}
    </>
  );
}
