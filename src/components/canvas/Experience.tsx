"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Particles from "./Particles";
import Stations from "./Stations";
import StationArt from "./StationArt";
import Hub from "./Hub";
import Effects from "./Effects";
import {
  pointerState,
  scrollState,
  sceneForProgress,
  useUIStore,
} from "@/lib/store";

const CAM_START = 8;
const CAM_END = -218;

// Cinematic weave (Dogstudio-style dual curve): z stays LINEAR — every fade,
// panel window and station position is tuned against it — while x/y ride a
// Catmull-Rom path. Keyframes are uniform in progress (p = i/8, matching
// getPoint's parameterisation). Amplitude caps at ±1.4 because the stations
// sit on the axis; at each station window the path eases back near centre,
// offset a touch AWAY from that station's panel side so the machine never
// hides behind the copy. Endpoints are (0,0): centred boarding, centred grid.
const WEAVE = new THREE.CatmullRomCurve3(
  [
    [0, 0], // p 0.000  hero — dead centre
    [1.3, 0.55], // p 0.125  drift out right
    [0.5, -0.25], // p 0.250  station 1 (panel right → bias left of it)
    [-1.4, 0.5], // p 0.375  big counter-swing
    [-0.5, -0.3], // p 0.500  station 2 (panel left → bias left)
    [1.2, 0.6], // p 0.625  swing back
    [0.45, 0.25], // p 0.750  station 3 (panel right)
    [-0.8, 0.35], // p 0.875  last drift
    [0, 0], // p 1.000  constellation — centred
  ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
  false,
  "catmullrom",
  0.5
);
// look-at samples the SAME curve 12 units ahead (the lookAt depth), so the
// camera steers into turns instead of panning flatly through them
const DP_AHEAD = 12 / (CAM_START - CAM_END);

function Rig() {
  const setScene = useUIStore((s) => s.setScene);
  const lastScene = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });
  const weavePos = useRef(new THREE.Vector3());
  const weaveAhead = useRef(new THREE.Vector3());
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

    const pc = THREE.MathUtils.clamp(p, 0, 1);
    const w = WEAVE.getPoint(pc, weavePos.current);
    const wa = WEAVE.getPoint(
      Math.min(1, pc + DP_AHEAD),
      weaveAhead.current
    );

    camera.position.set(
      w.x + mouse.current.x * 0.4,
      w.y + mouse.current.y * -0.3,
      z
    );
    // look-at leads the position curve — softened so stations stay framed
    camera.lookAt(
      wa.x * 0.6 + mouse.current.x * 0.2,
      wa.y * 0.6 + mouse.current.y * -0.15,
      z - 12
    );
    // bank into lateral turns like a craft, not a tripod; lookAt has just
    // rebuilt the orientation, so a post-roll about the view axis is safe
    const bank = THREE.MathUtils.clamp((wa.x - w.x) * -0.35, -0.045, 0.045);
    camera.rotateZ(bank);

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
        <StationArt />
        <Hub />
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
