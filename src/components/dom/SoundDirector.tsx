"use client";

import { useEffect } from "react";
import { stations } from "@/lib/content";
import { audio, STATION_FREQS } from "@/lib/audio";
import { scrollState } from "@/lib/store";

// Watches the journey and cues the score. Renders nothing; all state
// lives in a rAF loop against scrollState, same pattern as the overlays.

const SNAP_AT = 0.86; // constellation resolve — matches the shader's snap band

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

    // one latch per station window + one for the snap; re-armed when the
    // scroll backs out, so reversing the journey replays the cues
    const chimed = stations.map(() => false);
    const thumped = stations.map(() => false);
    let snapped = false;
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

      stations.forEach((s, i) => {
        const [a, b] = s.window;
        if (p >= a && p < b) {
          if (!chimed[i]) {
            chimed[i] = true;
            audio.chime(STATION_FREQS[i]);
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

      if (p >= SNAP_AT && !snapped) {
        snapped = true;
        audio.snapResolve();
      } else if (p < SNAP_AT - 0.06) {
        snapped = false;
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // UI micro-sounds — delegated so the finale links need no wiring
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
      window.removeEventListener("pointerdown", rearm);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
    };
  }, []);

  return null;
}
