"use client";

import { RefObject, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Three machines along the corridor. Kept deliberately spare — emissive
// geometry + bloom does the work; the particles are the protagonist.

// Planet-approach reveal: a station is invisible from afar and materializes
// as the camera closes in. Perspective supplies the growth; we supply the fade.
const FADE_FAR = 55;
const FADE_NEAR = 22;

function useProximityFade(ref: RefObject<THREE.Group | null>, stationZ: number) {
  useFrame(({ camera }) => {
    const g = ref.current;
    if (!g) return;
    const d = Math.abs(camera.position.z - stationZ);
    const t = THREE.MathUtils.clamp((FADE_FAR - d) / (FADE_FAR - FADE_NEAR), 0, 1);
    const fade = t * t * (3 - 2 * t);
    g.visible = fade > 0.003;
    if (!g.visible) return;
    g.traverse((o) => {
      const mat = (o as THREE.Mesh).material as
        | (THREE.Material & { opacity: number })
        | undefined;
      if (mat && mat.transparent) {
        if (o.userData.baseOpacity === undefined) o.userData.baseOpacity = mat.opacity;
        mat.opacity = o.userData.baseOpacity * fade;
      }
    });
  });
}

function VahanGate() {
  const root = useRef<THREE.Group>(null);
  const outer = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);

  useProximityFade(root, -50);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (outer.current) outer.current.rotation.z = t * 0.15;
    if (inner.current) {
      inner.current.rotation.z = -t * 0.4;
      const pulse = 1 + Math.sin(t * 2.2) * 0.03;
      inner.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={root} position={[0, 0, -50]}>
      <mesh ref={outer}>
        <torusGeometry args={[6.2, 0.07, 16, 96]} />
        <meshBasicMaterial color="#6ff2dd" transparent opacity={0.9} />
      </mesh>
      <mesh ref={inner}>
        <torusGeometry args={[4.6, 0.04, 12, 72]} />
        <meshBasicMaterial color="#3a8f84" transparent opacity={0.7} />
      </mesh>
      {/* CAPTCHA glyph bars inside the gate */}
      {[-1.6, -0.5, 0.6, 1.7].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, 0.3 * (i - 1.5)]}>
          <boxGeometry args={[0.12, 2.2 - Math.abs(i - 1.5) * 0.4, 0.12]} />
          <meshBasicMaterial color="#6ff2dd" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function TaxonomyLattice() {
  const g = useRef<THREE.Group>(null);

  useProximityFade(g, -110);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (g.current && g.current.visible) {
      g.current.rotation.y = t * 0.12;
      g.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    }
  });

  return (
    <group ref={g} position={[0, 0, -110]}>
      {[10, 7, 4].map((s, i) => (
        <lineSegments key={i}>
          <edgesGeometry args={[new THREE.BoxGeometry(s, s, s)]} />
          <lineBasicMaterial
            color="#8b7dff"
            transparent
            opacity={0.55 - i * 0.12}
          />
        </lineSegments>
      ))}
    </group>
  );
}

function SignalChannels() {
  const g = useRef<THREE.Group>(null);

  useProximityFade(g, -170);

  useFrame((state) => {
    if (g.current && g.current.visible)
      g.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });

  const lanes = [-3, -1.5, 0, 1.5, 3];

  return (
    <group ref={g} position={[0, 0, -170]}>
      {lanes.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 40, 8]} />
          <meshBasicMaterial
            color={i === 2 ? "#ffbe6b" : "#c9955a"}
            transparent
            opacity={i === 2 ? 0.9 : 0.45}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Stations() {
  return (
    <>
      <VahanGate />
      <TaxonomyLattice />
      <SignalChannels />
    </>
  );
}
