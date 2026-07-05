"use client";

import { useUIStore } from "@/lib/store";
import { worldById } from "@/lib/worlds";

// DOM layer for the SAVE FILE structure: a whisper of copy over the hub,
// and a placeholder screen per world until each journey ships (charter
// R4–R7). Word budget: never more than twelve on screen.

export default function Worlds() {
  const booted = useUIStore((s) => s.booted);
  const world = useUIStore((s) => s.world);
  const setWorld = useUIStore((s) => s.setWorld);

  if (!booted) return null;

  if (world === "hub") {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-14 z-10 text-center font-mono">
        <div className="text-xs tracking-[0.45em] text-ink">SELECT WORLD</div>
        <div className="mt-2 text-[10px] tracking-[0.2em] text-dim/60">
          four worlds shaped how i build
        </div>
      </div>
    );
  }

  const w = worldById(world);
  return (
    <div
      className="fixed inset-0 z-10 flex flex-col items-center justify-center font-mono"
      style={{
        background: `radial-gradient(ellipse at center, ${w.color}22 0%, #06070aee 72%)`,
      }}
    >
      <div className="text-[10px] tracking-[0.35em] text-dim">
        WORLD {w.index}
      </div>
      <div
        className="mt-3 text-3xl tracking-[0.25em] sm:text-4xl"
        style={{ color: w.color }}
      >
        {w.name}
      </div>
      <div className="mt-4 text-xs tracking-wider text-dim">
        under construction — coming online soon
      </div>
      <button
        onClick={() => setWorld("hub")}
        className="mt-12 cursor-pointer border px-6 py-3 text-xs tracking-[0.2em] transition-all hover:scale-105"
        style={{ borderColor: `${w.color}66`, color: w.color }}
      >
        ← BACK TO WORLDS
      </button>
    </div>
  );
}
