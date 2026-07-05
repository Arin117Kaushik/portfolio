"use client";

import { useEffect, useRef, useState } from "react";
import { scrollState, useUIStore, windowAlpha, worldState } from "@/lib/store";
import { worldById, type WorldId } from "@/lib/worlds";
import {
  identity,
  personalCluster,
  skills,
  stations,
  workCluster,
} from "@/lib/content";
import Terminal from "./Terminal";

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

const EMBER = "#e8894a";

// THE CAMP — the only place on the site where density is allowed, and
// even here it's opt-in: the terminal, and `ls artifacts` for the index.
function CampDom() {
  const setWorld = useUIStore((s) => s.setWorld);
  const wrap = useRef<HTMLDivElement>(null);
  const [indexOpen, setIndexOpen] = useState(false);

  // fade in once the dive settles, same contract as the journeys
  useEffect(() => {
    let raf: number;
    const loop = () => {
      if (wrap.current) {
        const a = Math.max(0, (worldState.t - 0.55) / 0.45);
        wrap.current.style.opacity = String(a);
        wrap.current.style.pointerEvents = a > 0.6 ? "auto" : "none";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const open = () => setIndexOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndexOpen(false);
    };
    window.addEventListener("artifacts-open", open);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("artifacts-open", open);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      <div
        ref={wrap}
        className="fixed inset-0 z-10 font-mono"
        style={{ opacity: 0, pointerEvents: "none" }}
      >
        <div className="absolute right-6 top-1/2 w-full max-w-md -translate-y-1/2 px-2 sm:right-16">
          <div
            className="text-[10px] tracking-[0.35em]"
            style={{ color: EMBER }}
          >
            THE CAMP
          </div>
          <div className="mt-3 text-sm text-dim">
            &gt; want the full story? say hello.
          </div>
          <div className="mt-4">
            <Terminal />
          </div>
          <div className="mt-4 flex items-center gap-6 text-[10px] tracking-[0.2em]">
            <a
              href={`mailto:${identity.email}`}
              className="text-dim transition-colors hover:text-signal"
            >
              MAIL
            </a>
            <a
              href={identity.github}
              target="_blank"
              rel="noreferrer"
              className="text-dim transition-colors hover:text-signal"
            >
              GITHUB
            </a>
            <a
              href={identity.linkedin}
              target="_blank"
              rel="noreferrer"
              className="text-dim transition-colors hover:text-signal"
            >
              LINKEDIN
            </a>
            <button
              onClick={() => setWorld("hub")}
              className="ml-auto cursor-pointer transition-colors hover:text-signal"
              style={{ color: EMBER }}
            >
              ← WORLDS
            </button>
          </div>
        </div>
      </div>

      {/* full index — everything, for whoever asks for everything */}
      {indexOpen && (
        <div className="fixed inset-0 z-30 overflow-y-auto bg-black/90 font-mono backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <div className="flex items-baseline justify-between">
              <div
                className="text-xs tracking-[0.35em]"
                style={{ color: EMBER }}
              >
                ARTIFACTS // FULL INDEX
              </div>
              <button
                onClick={() => setIndexOpen(false)}
                className="cursor-pointer text-[10px] tracking-[0.2em] text-dim transition-colors hover:text-signal"
              >
                [ ESC ] CLOSE
              </button>
            </div>

            <div className="mt-10 text-[10px] tracking-[0.3em] text-dim/60">
              FLAGSHIPS
            </div>
            {stations.map((s) => (
              <div key={s.id} className="mt-6 border-l pl-4" style={{ borderColor: `${EMBER}44` }}>
                <div className="text-sm text-ink">{s.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-dim">
                  {s.line}
                </div>
                <div className="mt-2 text-[10px] text-dim/60">
                  {s.stack} · <span style={{ color: EMBER }}>{s.metric}</span>{" "}
                  {s.metricCaption}
                </div>
              </div>
            ))}

            <div className="mt-12 text-[10px] tracking-[0.3em] text-dim/60">
              WORKSHOP
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {workCluster.map((w) => (
                <div key={w.name}>
                  <div className="text-xs text-ink">{w.name}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-dim">
                    {w.line}
                  </div>
                  <div className="mt-1 text-[10px] text-dim/50">{w.stack}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-[10px] tracking-[0.3em] text-dim/60">
              PERSONAL
            </div>
            <div className="mt-4">
              <a
                href={personalCluster.featured.href}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-ink underline decoration-dotted underline-offset-4 hover:text-signal"
              >
                {personalCluster.featured.name}
              </a>
              <div className="mt-1 text-[11px] leading-relaxed text-dim">
                {personalCluster.featured.line}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {personalCluster.rest.map((p) => (
                <div key={p.name} className="text-[11px] text-dim">
                  <span className="text-ink">{p.name}</span> — {p.line}
                </div>
              ))}
            </div>

            <div className="mt-12 text-[10px] tracking-[0.3em] text-dim/60">
              SKILLS
            </div>
            <div className="mt-4 space-y-2">
              {skills.map((s) => (
                <div key={s.group} className="text-[11px] text-dim">
                  <span style={{ color: EMBER }}>{s.group}</span> · {s.items}
                </div>
              ))}
            </div>

            <div className="mt-16 text-center text-[10px] tracking-[0.2em] text-dim/40">
              &gt; the short version was the ride. this is the rest.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Worlds() {
  const booted = useUIStore((s) => s.booted);
  const world = useUIStore((s) => s.world);
  const setWorld = useUIStore((s) => s.setWorld);

  if (!booted) return null;

  if (world === "hub") {
    return (
      <>
        <div className="pointer-events-none fixed inset-x-0 top-14 z-10 text-center font-mono">
          <div className="text-xs tracking-[0.45em] text-ink">SELECT WORLD</div>
          <div className="mt-2 text-[10px] tracking-[0.2em] text-dim/60">
            four worlds shaped how i build
          </div>
        </div>
        {/* the exit is always visible from the hub — the fire's lit */}
        <button
          onClick={() => setWorld("camp")}
          className="pointer-events-auto fixed bottom-14 left-1/2 z-10 -translate-x-1/2 cursor-pointer border px-5 py-2.5 font-mono text-[10px] tracking-[0.3em] transition-all hover:scale-105"
          style={{ borderColor: "#e8894a55", color: "#e8894a" }}
        >
          ▲ CAMP // SAY HELLO
        </button>
      </>
    );
  }

  if (world === "camp") return <CampDom />;

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
