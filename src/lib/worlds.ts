// SAVE FILE — the four worlds. Single source for ids, palettes and hub
// layout, shared by the canvas portals and the DOM layer. Palettes come
// from the rebuild charter; genre vibes only, no game IP.

export type WorldId = "frontier" | "neon" | "depths" | "voxel";

export interface WorldMeta {
  id: WorldId;
  index: string;
  name: string;
  tag: string; // one line, part of the ≤12-words budget
  color: string;
  rgb: [number, number, number]; // normalized, for shader tinting
  x: number; // hub slot
}

export const WORLDS: WorldMeta[] = [
  {
    id: "frontier",
    index: "01",
    name: "FRONTIER",
    tag: "the grind era",
    color: "#c4622d",
    rgb: [0.769, 0.384, 0.176],
    x: -4.8,
  },
  {
    id: "neon",
    index: "02",
    name: "NEON CITY",
    tag: "ai & automation",
    color: "#ff2d78",
    rgb: [1.0, 0.176, 0.471],
    x: -1.6,
  },
  {
    id: "depths",
    index: "03",
    name: "HOLLOW DEPTHS",
    tag: "learning in the dark",
    color: "#5fd4c0",
    rgb: [0.373, 0.831, 0.753],
    x: 1.6,
  },
  {
    id: "voxel",
    index: "04",
    name: "VOXEL PLAINS",
    tag: "systems from blocks",
    color: "#7cb85c",
    rgb: [0.486, 0.722, 0.361],
    x: 4.8,
  },
];

export const worldById = (id: WorldId) => WORLDS.find((w) => w.id === id)!;
