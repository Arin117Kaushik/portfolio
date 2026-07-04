"use client";

import { useEffect, useRef } from "react";
import { identity, stations } from "@/lib/content";
import { scrollState, windowAlpha } from "@/lib/store";

// Scroll-windowed overlays: hero copy + one panel per station.
// Styles are driven imperatively in a rAF loop — no per-frame React renders.

export default function Panels() {
  const heroRef = useRef<HTMLDivElement>(null);
  const stationRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      const p = scrollState.current;

      if (heroRef.current) {
        const a = windowAlpha(p, -0.06, 0.13, 0.05); // a < -edge so alpha is a full 1 at p=0
        heroRef.current.style.opacity = String(a);
        heroRef.current.style.transform = `translateY(${(1 - a) * -24}px)`;
        heroRef.current.style.visibility = a <= 0.01 ? "hidden" : "visible";
      }

      stations.forEach((s, i) => {
        const el = stationRefs.current[i];
        if (!el) return;
        const a = windowAlpha(p, s.window[0], s.window[1]);
        el.style.opacity = String(a);
        el.style.transform = `translateY(${(1 - a) * 28}px)`;
        el.style.visibility = a <= 0.01 ? "hidden" : "visible";
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/* hero */}
      <div
        ref={heroRef}
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="max-w-3xl text-3xl leading-snug font-medium sm:text-5xl sm:leading-tight">
          {identity.positioning}
        </p>
        <p className="mt-6 font-mono text-xs tracking-[0.3em] text-dim uppercase">
          {identity.sub}
        </p>
      </div>

      {/* station panels */}
      {stations.map((s, i) => (
        <div
          key={s.id}
          ref={(el) => {
            stationRefs.current[i] = el;
          }}
          className={`absolute top-1/2 w-[min(400px,85vw)] -translate-y-1/2 border border-white/10 bg-black/45 p-6 backdrop-blur-md ${
            s.side === "right" ? "right-6 sm:right-16" : "left-6 sm:left-16"
          }`}
          style={{ opacity: 0 }}
        >
          <div className="font-mono text-[10px] tracking-[0.25em] text-signal/80">
            {s.label}
          </div>
          <h2 className="mt-3 text-2xl font-medium">{s.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-dim">{s.line}</p>
          <div className="mt-4 font-mono text-[10px] tracking-wider text-dim/70">
            {s.stack}
          </div>
          <div className="mt-5 border-t border-white/10 pt-4">
            <span className="text-3xl font-medium text-signal">{s.metric}</span>
            <span className="ml-3 text-xs text-dim">{s.metricCaption}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
