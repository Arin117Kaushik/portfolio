import { create } from "zustand";
import { worldById, type WorldId } from "./worlds";

// Mutable scroll state kept outside React to avoid re-render storms.
// `target` is set by the scroll listener; `current` is damped toward it
// once per frame inside the R3F loop, and read by DOM overlays in their
// own rAF loops. `post` tracks travel INTO the finale (0..1 after the
// corridor ends); `ambient` is its damped twin driving the particle
// field's settle-behind-content state.
export const scrollState = {
  target: 0,
  current: 0,
  post: 0,
  ambient: 0,
};

// Pointer in NDC, fed by a window-level listener — canvas pointer events
// die under the finale DOM, this doesn't. The swarm stays reactive
// everywhere.
export const pointerState = { x: 0, y: 0 };

// World transition state, damped by the Rig (single writer for `t`).
// t: 0 = at the hub, 1 = fully inside a world. The camera dives on it,
// portals dissolve on it, and the particle field sweeps to the world's
// palette (r/g/b) on it — one canvas, no cuts.
export const worldState = {
  t: 0,
  target: 0,
  r: 1,
  g: 1,
  b: 1,
};

// DOM→shader focus link. Finale rows write a target here on hover (row
// centre in NDC + that row's hue); Particles damps its uniforms toward
// it every frame. The settled field gathers and re-tints around whatever
// the cursor is reading — the content and the swarm are one organism.
export const focusState = {
  x: 0,
  y: 0,
  r: 0.44,
  g: 0.95,
  b: 0.87,
  strength: 0,
};

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __scroll: typeof scrollState }).__scroll = scrollState;
}

interface UIState {
  scene: number;
  quality: "high" | "low";
  // SAVE FILE rebuild: nothing scrolls until the player presses START.
  // The boot gate is also the sound-unlock gesture.
  booted: boolean;
  // "hub" = level select; a WorldId = inside that world
  world: WorldId | "hub";
  setScene: (s: number) => void;
  setQuality: (q: "high" | "low") => void;
  setBooted: (b: boolean) => void;
  setWorld: (w: WorldId | "hub") => void;
}

export const useUIStore = create<UIState>((set) => ({
  scene: 0,
  quality: "high",
  booted: false,
  world: "hub",
  setScene: (scene) => set({ scene }),
  setQuality: (quality) => set({ quality }),
  setBooted: (booted) => set({ booted }),
  setWorld: (world) => {
    set({ world });
    worldState.target = world === "hub" ? 0 : 1;
    if (world !== "hub") {
      [worldState.r, worldState.g, worldState.b] = worldById(world).rgb;
    }
  },
}));

// Scene boundaries in scroll progress.
export const SCENE_THRESHOLDS = [0.15, 0.38, 0.58, 0.8];

export function sceneForProgress(p: number): number {
  let s = 0;
  for (let i = 0; i < SCENE_THRESHOLDS.length; i++) {
    if (p >= SCENE_THRESHOLDS[i]) s = i + 1;
  }
  return s;
}

// Smooth visibility window: fades in over `edge` after a, out before b.
export function windowAlpha(p: number, a: number, b: number, edge = 0.04): number {
  const rise = Math.min(1, Math.max(0, (p - a) / edge));
  const fall = 1 - Math.min(1, Math.max(0, (p - (b - edge)) / edge));
  return Math.max(0, Math.min(rise, fall));
}
