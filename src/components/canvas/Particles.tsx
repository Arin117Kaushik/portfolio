"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState, useUIStore } from "@/lib/store";

// One shader carries the whole chaos→order journey. Order is spatial:
// particles deeper in the corridor (-z) are progressively more ordered,
// so travelling forward IS the narrative. A flagged subset snaps into a
// constellation wall at the end of the scroll.

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uPointer; // NDC
  attribute vec4 aSeed;
  attribute float aCat;
  attribute vec4 aGrid; // xyz target, w = isGridParticle
  varying vec3 vColor;
  varying float vAlpha;

  vec3 jitterField(vec3 p) {
    return vec3(
      sin(p.y * 1.7 + uTime * 0.6) + sin(p.z * 0.8 + uTime * 0.35),
      sin(p.z * 1.3 + uTime * 0.5) + sin(p.x * 0.9 + uTime * 0.42),
      sin(p.x * 1.1 + uTime * 0.7) + sin(p.y * 0.7 + uTime * 0.3)
    ) * 0.5;
  }

  void main() {
    vec3 pos = position;

    // 0 at corridor mouth (chaos) → 1 deep in the corridor (order)
    float orderT = clamp((-pos.z - 20.0) / 200.0, 0.0, 1.0);
    float chaosAmp = 1.0 - orderT;

    vec3 jitter = jitterField(position * 0.15) * (2.6 * chaosAmp + 0.15);
    pos += jitter;

    // ordered particles ride laminar flow lines
    pos.x += orderT * sin(uTime * 0.4 + aSeed.x * 6.283) * 0.25;
    pos.y += orderT * cos(uTime * 0.33 + aSeed.y * 6.283) * 0.18;

    // constellation snap near the end of the scroll
    if (aGrid.w > 0.5) {
      float t = smoothstep(0.76 + aSeed.y * 0.1, 0.9 + aSeed.z * 0.08, uProgress);
      pos = mix(pos, aGrid.xyz, t);
    }

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float dist = max(0.1, -mv.z);
    float size = (aSeed.w * 3.0 + 2.0) * (1.0 + chaosAmp * 1.1) * (150.0 / dist);
    gl_PointSize = min(size, 18.0);
    vec4 clip = projectionMatrix * mv;

    // pointer repulsion in screen space — the swarm parts around the cursor
    // at every stage of the journey, including behind the finale content
    vec2 pnd = clip.xy / max(0.0001, clip.w);
    vec2 away = pnd - uPointer;
    float pd = length(away * vec2(1.0, 0.6));
    float push = 0.09 * exp(-pd * pd * 22.0);
    clip.xy += normalize(away + 0.0001) * push * clip.w;

    gl_Position = clip;

    // colour journey: noise-grey → signal cyan, category hues mid-corridor
    vec3 grey = vec3(0.42, 0.47, 0.53);
    vec3 cyan = vec3(0.44, 0.95, 0.87);
    vec3 catCol = 0.55 + 0.45 * cos(6.283 * (aCat / 6.0) + vec3(0.0, 2.1, 4.2));
    float catMix = smoothstep(0.35, 0.55, orderT) * (1.0 - smoothstep(0.8, 0.95, orderT));

    vec3 col = mix(grey, cyan, smoothstep(0.15, 0.9, orderT));
    vColor = mix(col, catCol, catMix * 0.65);

    // near fade avoids giant sprites in your face; exponential fog controls
    // additive stacking at the vanishing point — a hard cutoff can't, because
    // 100+ units of corridor all project into the same few hundred pixels
    float nearFade = smoothstep(2.0, 7.0, dist);
    float fog = exp(-max(0.0, dist - 14.0) * 0.06);
    vAlpha = (0.06 + 0.11 * aSeed.x) * nearFade * fog;

    // screen-space guard: distant particles all project onto the same few
    // hundred pixels at the vanishing point; zero them there. Near particles
    // are exempt, so the effect reads as a clear flight channel — which also
    // keeps the hero copy legible inside it.
    vec2 ndc = pnd;
    float centerFade = smoothstep(0.14, 0.55, length(ndc * vec2(1.0, 0.8)));
    vAlpha *= mix(1.0, centerFade, smoothstep(12.0, 32.0, dist));
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`;

const CORRIDOR_START = 30;
const CORRIDOR_END = -260;
const GRID_Z = -230;
const GRID_COLS = 60;
const GRID_ROWS = 50;

export default function Particles() {
  const quality = useUIStore((s) => s.quality);
  const count = quality === "high" ? 30000 : 10000;
  const material = useRef<THREE.ShaderMaterial>(null);

  const { positions, seeds, cats, grids } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    const cats = new Float32Array(count);
    const grids = new Float32Array(count * 4);

    const gridCount = GRID_COLS * GRID_ROWS; // 3000 constellation particles
    const spacing = 0.42;

    for (let i = 0; i < count; i++) {
      // cylindrical corridor distribution around the camera path
      const r = 4 + Math.pow(Math.random(), 0.85) * 30;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(theta) * r * 0.8;
      positions[i * 3 + 2] =
        CORRIDOR_START + Math.random() * (CORRIDOR_END - CORRIDOR_START);

      seeds[i * 4] = Math.random();
      seeds[i * 4 + 1] = Math.random();
      seeds[i * 4 + 2] = Math.random();
      seeds[i * 4 + 3] = Math.random();

      cats[i] = Math.floor(Math.random() * 6);

      if (i < gridCount) {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        grids[i * 4] = (col - GRID_COLS / 2) * spacing;
        grids[i * 4 + 1] = (row - GRID_ROWS / 2) * spacing;
        grids[i * 4 + 2] = GRID_Z - Math.random() * 2;
        grids[i * 4 + 3] = 1;
      } else {
        grids[i * 4 + 3] = 0;
      }
    }
    return { positions, seeds, cats, grids };
  }, [count]);

  useFrame((state) => {
    if (!material.current) return;
    const u = material.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uProgress.value = scrollState.current;
    // ease the pointer so the swarm feels like it has mass
    u.uPointer.value.lerp(state.pointer, 0.08);
  });

  return (
    <points key={count}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 4]} />
        <bufferAttribute attach="attributes-aCat" args={[cats, 1]} />
        <bufferAttribute attach="attributes-aGrid" args={[grids, 4]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uPointer: { value: new THREE.Vector2(0, 0) },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
