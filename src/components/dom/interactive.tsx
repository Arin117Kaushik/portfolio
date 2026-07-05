"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// Interaction primitives for the DOM layer. Everything here is pointer-math
// + CSS transforms — no per-frame React renders, no layout thrash.

const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#$%&01";

/** Text that decodes into place, terminal-style, when it enters the viewport. */
export function Scramble({
  text,
  className,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  as?: "span" | "h2" | "h3" | "div";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || done) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        let frame = 0;
        const total = Math.max(14, text.length * 1.6);
        const id = setInterval(() => {
          frame++;
          const settled = Math.floor((frame / total) * text.length);
          el.textContent =
            text.slice(0, settled) +
            text
              .slice(settled)
              .split("")
              .map((ch) =>
                ch === " "
                  ? " "
                  : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0]
              )
              .join("");
          if (settled >= text.length) {
            clearInterval(id);
            el.textContent = text;
            setDone(true);
          }
        }, 28);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text, done]);

  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      {text}
    </Tag>
  );
}

/** Fade-up reveal on viewport entry. One transition, no re-renders after. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        el.style.transitionDelay = `${delay}ms`;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(18px)",
        transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}

/** Number that counts up when visible. Handles "250+", "40%", "3 hrs → 0". */
export function CountUp({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const match = value.match(/\d+/);
    if (!match) return;
    const target = parseInt(match[0], 10);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1100;
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = value.replace(
            match[0],
            String(Math.round(target * eased))
          );
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

/** Card with 3D tilt + a cyan glow that follows the cursor. */
export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(700px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateZ(0)`;
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg)";
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className ?? ""}`}
      style={{ transition: "transform 0.18s ease-out" }}
    >
      {children}
    </div>
  );
}

/** Wrapper that makes its child lean toward the cursor, then spring back. */
export function Magnetic({
  children,
  strength = 0.32,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transition = "transform 0.12s ease-out";
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    },
    [strength]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.4)";
    el.style.transform = "translate(0px, 0px)";
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`inline-block ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
