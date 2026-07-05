"use client";

import { useEffect, useRef } from "react";
import { scrollState, useUIStore, windowAlpha, worldState } from "@/lib/store";
import { worldById, type WorldId } from "@/lib/worlds";

// DOM layer for the SAVE FILE structure. Hub whisper, per-world journey
// captions (fixed slot, ≤12 words, swap in place), and under-construction
// screens for worlds that haven't shipped. Story first — anyone who wants
// the full text can ask the terminal or just contact Arin.

interface Beat {
  label: string;
  text: string;
  window: [number, number];
}

interface JourneyConfig {
  accent: string; // labels, hint, clear chrome
  body: string; // caption text color
  hint: string;
  clear: string;
  beats: Beat[];
}

const JOURNEYS: Partial<Record<WorldId, JourneyConfig>> = {
  frontier: {
    accent: "#e8894a",
    body: "#f5e6d8",
    hint: "❯ RIDE",
    clear: "WORLD 01 CLEAR",
    beats: [
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
    ],
  },
  neon: {
    accent: "#6ff2dd",
    body: "#eafbff",
    hint: "❯ JACK IN",
    clear: "WORLD 02 CLEAR",
    beats: [
      {
        label: "SYSTEM 01 // VAHAN GATE",
        text: "a bot solves government CAPTCHAs weekly — 250+ registrations, zero touch.",
        window: [0.1, 0.28],
      },
      {
        label: "SYSTEM 02 // CLASSIFIER",
        text: "claude sorts 600+ rows of chaos into 80 clean categories.",
        window: [0.38, 0.56],
      },
      {
        label: "SYSTEM 03 // SIGNAL",
        text: "500+ gmail threads scanned nightly. the team briefed by sunrise.",
        window: [0.62, 0.78],
      },
    ],
  },
  depths: {
    accent: "#5fd4c0",
    body: "#dfe7ee",
    hint: "❯ DESCEND",
    clear: "WORLD 03 CLEAR",
    beats: [
      {
        label: "ECHO 01 // FIRST LIGHT",
        text: "no classroom down here. curiosity was the only torch.",
        window: [0.1, 0.28],
      },
      {
        label: "ECHO 02 // THE DESCENT",
        text: "every bug a dark tunnel. every fix leaves a lantern.",
        window: [0.38, 0.56],
      },
      {
        label: "ECHO 03 // WHAT GLOWS",
        text: "python, apps script, LLM agents — learned by breaking things.",
        window: [0.62, 0.78],
      },
    ],
  },
  // the one bright world — dark ink captions, not white
  voxel: {
    accent: "#6b4a16",
    body: "#2e2414",
    hint: "❯ BUILD",
    clear: "WORLD 04 CLEAR",
    beats: [
      {
        label: "BLOCK 01 // FOUNDATION",
        text: "one spreadsheet. then another. small blocks, stacked daily.",
        window: [0.1, 0.28],
      },
      {
        label: "BLOCK 02 // THE WORKSHOP",
        text: "billing, MLS, dashboards — a farm of systems that run themselves.",
        window: [0.38, 0.56],
      },
      {
        label: "BLOCK 03 // THE HARVEST",
        text: "3 hours a day handed back. the builder moves to new ground.",
        window: [0.62, 0.78],
      },
    ],
  },
};

function JourneyDom({ cfg }: { cfg: JourneyConfig }) {
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
        hint.current.style.opacity = String(Math.max(0, 1 - p * 16) * settled);
      }
      cfg.beats.forEach((b, i) => {
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
  }, [cfg]);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 font-mono">
      <div
        ref={hint}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs tracking-[0.3em]"
        style={{ opacity: 0, color: cfg.accent }}
      >
        {cfg.hint}
      </div>

      {/* fixed caption slot — one beat at a time */}
      {cfg.beats.map((b, i) => (
        <div
          key={b.label}
          ref={(el) => {
            beatRefs.current[i] = el;
          }}
          className="absolute bottom-16 left-6 max-w-md sm:left-16"
          style={{ opacity: 0 }}
        >
          <div
            className="text-[10px] tracking-[0.3em]"
            style={{ color: cfg.accent }}
          >
            {b.label}
          </div>
          <div
            className="mt-3 text-lg leading-relaxed sm:text-xl"
            style={{ color: cfg.body }}
          >
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
        <div
          className="text-[10px] tracking-[0.4em]"
          style={{ color: cfg.accent }}
        >
          {cfg.clear}
        </div>
        <button
          onClick={() => setWorld("hub")}
          className="mt-8 cursor-pointer border px-6 py-3 text-xs tracking-[0.2em] transition-all hover:scale-105"
          style={{ borderColor: `${cfg.accent}99`, color: cfg.accent }}
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

  const journey = JOURNEYS[world];
  if (journey) return <JourneyDom cfg={journey} />;

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
