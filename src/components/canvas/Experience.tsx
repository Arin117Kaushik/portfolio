"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Particles from "./Particles";
import Stations from "./Stations";
import Effects from "./Effects";
import {
  pointerState,
  scrollState,
  sceneForProgress,
  useUIStore,
} from "@/lib/store";

const CAM_START = 8;
const CAM_END = -218;

function Rig() {
  const setScene = useUIStore((s) => s.setScene);
  const lastScene = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });
  const { camera } = useThree();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      // NDC for the particle shader — window-level, so it keeps working
      // when the finale DOM sits between cursor and canvas
      pointerState.x = mouse.current.x;
      pointerState.y = -mouse.current.y;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, delta) => {
    // clamp delta: rAF freezes entirely in hidden windows, and the first
    // frame back would otherwise arrive with a multi-second dt and teleport
    // every damped value
    const dt = Math.min(delta, 0.1);
    // damp scroll once per frame — single writer for scrollState.current
    const k = 1 - Math.exp(-4.5 * dt);
    scrollState.current += (scrollState.target - scrollState.current) * k;
    scrollState.ambient += (scrollState.post - scrollState.ambient) * k;

    const p = scrollState.current;
    const z = CAM_START + (CAM_END - CAM_START) * p;

    // gentle sway + mouse parallax; both fade as order takes over
    const sway = Math.sin(p * Math.PI * 3) * 0.8 * (1 - p);
    camera.position.set(
      sway + mouse.current.x * 0.4,
      mouse.current.y * -0.3,
      z
    );
    camera.lookAt(mouse.current.x * 0.2, mouse.current.y * -0.15, z - 12);

    const scene = sceneForProgress(p);
    if (scene !== lastScene.current) {
      lastScene.current = scene;
      setScene(scene);
    }
  });

  return null;
}

export default function Experience() {
  const setQuality = useUIStore((s) => s.setQuality);

  useEffect(() => {
    const isMobile =
      /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent) ||
      window.innerWidth < 768;
    if (isMobile) setQuality("low");
  }, [setQuality]);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 400, position: [0, 0, CAM_START] }}
        dpr={[1, 1.75]}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
        }}
        onCreated={(state) => {
          state.gl.setClearColor(new THREE.Color("#06070a"));
          if (process.env.NODE_ENV !== "production") {
            (window as unknown as { __three: unknown }).__three = state;
          }
        }}
      >
        <Rig />
        <Particles />
        <Stations />
        <Effects />
      </Canvas>
      {/* vignette as a DOM overlay — free, and immune to composer issues */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}
