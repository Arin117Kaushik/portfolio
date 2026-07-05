"use client";

import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { useUIStore } from "@/lib/store";

// The boot gate — every award site earns its world with a loading moment
// (Henry's START screen, Bruno's ignition, Aether's preloader). A console
// boot log types in, then PRESS START. The click doubles as the sound-
// unlock gesture, and the particle field flares on ignition.

const BOOT_LINES = [
  "ARIN.SYS v2.0 — save file found",
  "mounting worlds: frontier / neon / depths / voxel",
  "calibrating particle field .......... 30,000 OK",
  "audio driver .......... ready",
];

const LINE_DELAY = 520; // ms between log lines

export default function Boot() {
  const booted = useUIStore((s) => s.booted);
  const setBooted = useUIStore((s) => s.setBooted);
  const [lines, setLines] = useState(0);
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lines >= BOOT_LINES.length) {
      const t = setTimeout(() => setReady(true), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLines((n) => n + 1), LINE_DELAY);
    return () => clearTimeout(t);
  }, [lines]);

  const start = () => {
    if (!ready || fading) return;
    // the START click is a user gesture — unlock sound unless the player
    // muted it on a previous visit
    let muted = false;
    try {
      muted = localStorage.getItem("snd") === "0";
    } catch {}
    if (!muted && !audio.enabled) {
      audio.toggle();
      window.dispatchEvent(new Event("snd-change"));
    }
    setFading(true);
    setTimeout(() => setBooted(true), 700);
  };

  if (booted) return null;

  return (
    <div
      ref={overlay}
      onClick={start}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg font-mono transition-opacity duration-700"
      style={{ opacity: fading ? 0 : 1, cursor: ready ? "pointer" : "default" }}
    >
      <div className="w-[min(520px,88vw)]">
        <div className="text-xs tracking-[0.2em] text-signal">
          SAVE FILE
          <span className="cursor-blink">_</span>
        </div>

        <div className="mt-6 min-h-[7.5rem] space-y-2 text-[11px] leading-relaxed text-dim">
          {BOOT_LINES.slice(0, lines).map((l) => (
            <div key={l}>
              <span className="text-signal/60">{">"}</span> {l}
            </div>
          ))}
        </div>

        {/* progress line fills with the log */}
        <div className="mt-6 h-px w-full bg-white/10">
          <div
            className="h-full bg-signal/80 transition-all duration-500"
            style={{ width: `${(lines / BOOT_LINES.length) * 100}%` }}
          />
        </div>

        <div
          className="mt-10 text-center text-sm tracking-[0.35em] text-ink transition-opacity duration-500"
          style={{ opacity: ready ? 1 : 0 }}
        >
          <span className="cursor-blink">▶</span> PRESS START
        </div>
        <div
          className="mt-3 text-center text-[10px] tracking-wider text-dim/60 transition-opacity duration-500"
          style={{ opacity: ready ? 1 : 0 }}
        >
          sound on — toggle anytime, bottom right
        </div>
      </div>
    </div>
  );
}
