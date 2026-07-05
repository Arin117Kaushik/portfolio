"use client";

import { useEffect, useRef } from "react";

// Custom cursor: an instant dot + a damped trailing ring that swells over
// anything interactive. Fine pointers only — touch devices never see it.
// mix-blend-difference keeps it visible over both the black corridor and
// the bright signal accents.

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("custom-cursor");

    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let rx = x;
    let ry = y;
    let scale = 1;
    let targetScale = 1;
    let seen = false;
    let last = performance.now();
    let raf: number;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      seen = true;
      const el = e.target instanceof Element && e.target.closest("a, button");
      targetScale = el ? 2.2 : 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-12 * dt);
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      scale += (targetScale - scale) * k;
      if (dot.current) {
        dot.current.style.opacity = seen ? "1" : "0";
        dot.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      if (ring.current) {
        ring.current.style.opacity = seen ? "1" : "0";
        ring.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${scale})`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("custom-cursor");
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 hidden md:block">
      <div
        ref={dot}
        className="absolute h-1.5 w-1.5 rounded-full bg-signal"
        style={{ opacity: 0 }}
      />
      <div
        ref={ring}
        className="absolute h-8 w-8 rounded-full border border-white"
        style={{ opacity: 0, mixBlendMode: "difference" }}
      />
    </div>
  );
}
