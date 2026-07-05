"use client";

import { useEffect } from "react";
import { audio, WORLD_CHIMES } from "@/lib/audio";
import { scrollState, useUIStore } from "@/lib/store";

// Watches the journey and cues the score. Renders nothing; all state
// lives in a rAF loop against scrollState, same pattern as the overlays.

// the shared beat windows every world journey uses (see Worlds.tsx)
const BEATS: [number, number][] = [
  [0.1, 0.28],
  [0.38, 0.56],
  [0.62, 0.78],
];
const CLEAR_AT = 0.86; // world-clear resolve

export default function SoundDirector() {
  useEffect(() => {
    // returning visitor with sound on: re-arm on the first gesture,
    // since the AudioContext can't start without one
    let stored = false;
    try {
      stored = localStorage.getItem("snd") === "1";
    } catch {}
    const rearm = () => {
      if (stored && !audio.enabled) audio.toggle();
      window.dispatchEvent(new Event("snd-change"));
    };
    if (stored) window.addEventListener("pointerdown", rearm, { once: true });

    // every world change retunes the drone; entering a world lands with
    // a thump (the dive), returning to the hub just changes the weather
    let lastWorld = useUIStore.getState().world;
    const unsub = useUIStore.subscribe((state) => {
      if (state.world === lastWorld) return;
      lastWorld = state.world;
      audio.setPatch(state.world);
      if (state.world !== "hub") audio.thump();
    });

    // one latch per beat window + one for the clear; re-armed when the
    // scroll backs out, so reversing the journey replays the cues
    const chimed = BEATS.map(() => false);
    const thumped = BEATS.map(() => false);
    let cleared = false;
    let lastP = scrollState.current;
    let lastT = performance.now();
    let raf: number;

    const loop = () => {
      const now = performance.now();
      const dt = Math.max(0.001, (now - lastT) / 1000);
      const p = scrollState.current;
      const velocity = (p - lastP) / dt;
      lastP = p;
      lastT = now;

      audio.frame(velocity, scrollState.ambient);

      const world = useUIStore.getState().world;
      const triad = WORLD_CHIMES[world];
      if (triad) {
        BEATS.forEach(([a, b], i) => {
          if (p >= a && p < b) {
            if (!chimed[i]) {
              chimed[i] = true;
              audio.chime(triad[i]);
            }
          } else if (p < a - 0.03) {
            chimed[i] = false;
            thumped[i] = false;
          }
          if (p >= b && !thumped[i]) {
            thumped[i] = true;
            audio.thump();
          }
        });
        if (p >= CLEAR_AT && !cleared) {
          cleared = true;
          audio.snapResolve();
        } else if (p < CLEAR_AT - 0.06) {
          cleared = false;
        }
      }

      // diegetic ambience — sparse, random, never rhythmic
      if (world === "depths" && Math.random() < dt * 0.14) audio.drip();
      if (world === "camp" && Math.random() < dt * 1.6) audio.crackle();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // UI micro-sounds — delegated so no link needs wiring
    const isInteractive = (e: Event) =>
      e.target instanceof Element && e.target.closest("a, button");
    const over = (e: PointerEvent) => {
      const el = isInteractive(e);
      const from =
        e.relatedTarget instanceof Element &&
        e.relatedTarget.closest("a, button");
      if (el && el !== from) audio.blip();
    };
    const down = (e: PointerEvent) => {
      if (isInteractive(e)) audio.tick();
    };
    window.addEventListener("pointerover", over);
    window.addEventListener("pointerdown", down);

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      window.removeEventListener("pointerdown", rearm);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
    };
  }, []);

  return null;
}
