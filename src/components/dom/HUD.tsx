"use client";

import { useEffect, useRef, useState } from "react";
import { identity, sceneLabels } from "@/lib/content";
import { audio } from "@/lib/audio";
import { scrollState, useUIStore } from "@/lib/store";

// Fixed chrome around the experience. Terminal voice lives here.
export default function HUD() {
  const scene = useUIStore((s) => s.scene);
  const bar = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const [snd, setSnd] = useState(false);

  useEffect(() => {
    // SoundDirector may re-arm audio on the first gesture for returning
    // visitors — keep the label honest
    const sync = () => setSnd(audio.enabled);
    window.addEventListener("snd-change", sync);
    return () => window.removeEventListener("snd-change", sync);
  }, []);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      const p = scrollState.current;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (hint.current)
        hint.current.style.opacity = String(Math.max(0, 1 - p * 12));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 font-mono text-[11px] tracking-wider">
      {/* top-left: identity */}
      <div className="absolute left-6 top-6">
        <div className="text-sm text-ink">
          {identity.name}
          <span className="cursor-blink text-signal">_</span>
        </div>
        <div className="mt-1 text-dim">{identity.tagline}</div>
      </div>

      {/* top-right: scene label */}
      <div className="absolute right-6 top-6 text-right">
        <div className="text-signal/80">{sceneLabels[scene]}</div>
        <div className="mt-1 text-dim/60">pipeline // live</div>
      </div>

      {/* bottom-left: scroll hint */}
      <div ref={hint} className="absolute bottom-8 left-6 text-dim">
        {identity.hint}
      </div>

      {/* bottom-right: sound toggle */}
      <button
        onClick={() => setSnd(audio.toggle())}
        className="pointer-events-auto absolute right-6 bottom-8 cursor-pointer text-dim transition-colors hover:text-signal"
        aria-label={snd ? "mute sound" : "enable sound"}
      >
        snd //{" "}
        <span className={snd ? "text-signal" : "text-dim/60"}>
          {snd ? "on" : "off"}
        </span>
      </button>

      {/* bottom: progress line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10">
        <div
          ref={bar}
          className="h-full origin-left bg-signal/70"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </div>
  );
}
