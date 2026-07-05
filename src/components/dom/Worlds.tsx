"use client";

import { useEffect, useRef } from "react";
import { scrollState, useUIStore, windowAlpha, worldState } from "@/lib/store";
import { worldById } from "@/lib/worlds";

// DOM layer for the SAVE FILE structure. Hub whisper, built-world beat
// captions (fixed slot, ≤12 words, swap in place), and under-construction
// screens for worlds that haven't shipped. Story first — anyone who wants
// the full text can ask the terminal or just contact Arin.

interface Beat {
  label: string;
  text: string;
  window: [number, number];
}

const FRONTIER_BEATS: Beat[] = [
  {
    label: "MEMORY 01 // THE LEDGER",
    text: "250+ vehicle cases tracked weekly. by hand, until it wasn't.",
    window: [0.1, 0.28],
  },
  {
    label: "MEMORY 02 // THE RECKONING",
    text: "six sheets reconciled by phone number — blockers flag themselves.",
    window: [0.38, 0.56],
  },
  {
    label: "MEMORY 03 // THE LESSON",
    text: "3 hours of lookups became zero. the grind built the builder.",
    window: [0.62, 0.78],
  },
];

function FrontierDom() {
  const setWorld = useUIStore((s) => s.setWorld);
  const hint = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      const p = scrollState.current;
      const settled = worldState.t; // captions wait for the dive to land
      if (hint.current) {
        hint.current.style.opacity = String(
          Math.max(0, 1 - p * 16) * settled
        );
      }
      FRONTIER_BEATS.forEach((b, i) => {
        const el = beatRefs.current[i];
        if (!el) return;
        const a = windowAlpha(p, b.window[0], b.window[1]) * settled;
        el.style.opacity = String(a);
        el.style.transform = `translateY(${(1 - a) * 22}px)`;
      });
      if (end.current) {
        const a = Math.min(1, Math.max(0, (p - 0.84) / 0.06)) * settled;
        end.current.style.opacity = String(a);
        end.current.style.pointerEvents = a > 0.6 ? "auto" : "none";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 font-mono">
      {/* ride hint */}
      <div
        ref={hint}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em] text-[#e8894a]"
        style={{ opacity: 0 }}
      >
        ❯ RIDE
      </div>

      {/* fixed caption slot — one beat at a time */}
      {FRONTIER_BEATS.map((b, i) => (
        <div
          key={b.label}
          ref={(el) => {
            beatRefs.current[i] = el;
          }}
          className="absolute bottom-16 left-6 max-w-md sm:left-16"
          style={{ opacity: 0 }}
        >
          <div className="text-[10px] tracking-[0.3em] text-[#e8894a]">
            {b.label}
          </div>
          <div className="mt-3 text-lg leading-relaxed text-[#f5e6d8] sm:text-xl">
            {b.text}
          </div>
        </div>
      ))}

      {/* world clear */}
      <div
        ref={end}
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ opacity: 0 }}
      >
        <div className="text-[10px] tracking-[0.4em] text-[#e8894a]">
          WORLD 01 CLEAR
        </div>
        <button
          onClick={() => setWorld("hub")}
          className="mt-8 cursor-pointer border border-[#c4622d99] px-6 py-3 text-xs tracking-[0.2em] text-[#e8894a] transition-all hover:scale-105"
        >
          ← BACK TO WORLDS
        </button>
      </div>
    </div>
  );
}

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

  if (world === "frontier") return <FrontierDom />;

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
