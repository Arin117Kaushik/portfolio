import { create } from "zustand";

// Mutable scroll state kept outside React to avoid re-render storms.
// `target` is set by the scroll listener; `current` is damped toward it
// once per frame inside the R3F loop, and read by DOM overlays in their
// own rAF loops.
export const scrollState = {
  target: 0,
  current: 0,
};

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __scroll: typeof scrollState }).__scroll = scrollState;
}

interface UIState {
  scene: number;
  quality: "high" | "low";
  setScene: (s: number) => void;
  setQuality: (q: "high" | "low") => void;
}

export const useUIStore = create<UIState>((set) => ({
  scene: 0,
  quality: "high",
  setScene: (scene) => set({ scene }),
  setQuality: (quality) => set({ quality }),
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
