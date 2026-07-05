"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  footerLine,
  identity,
  personalCluster,
  skills,
  stats,
  workCluster,
} from "@/lib/content";
import { focusState } from "@/lib/store";
import { CountUp, Magnetic, Reveal, Scramble } from "./interactive";
import Terminal from "./Terminal";

// The Order scene — styled as the pipeline's OUTPUT, not a card dashboard:
// full-width log rows, thin rules, mono annotations, big readout numbers.
// Normal document flow scrolling over the fixed canvas; every row hover
// feeds focusState so the settled particle field gathers toward it.

const HUES: [number, number, number][] = [
  [0.44, 0.95, 0.87], // signal cyan
  [0.545, 0.49, 1.0], // taxonomy violet
  [1.0, 0.745, 0.42], // channel amber
];

/** Row that tells the particle field where the reader is. */
function FocusRow({
  hue,
  children,
  className,
}: {
  hue: number;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const enter = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    focusState.x = ((r.left + r.width / 2) / window.innerWidth) * 2 - 1;
    focusState.y = -(((r.top + r.height / 2) / window.innerHeight) * 2 - 1);
    [focusState.r, focusState.g, focusState.b] = HUES[hue % HUES.length];
    focusState.strength = 1;
  };
  const leave = () => {
    focusState.strength = 0;
  };

  return (
    <div ref={ref} onPointerEnter={enter} onPointerLeave={leave} className={className}>
      {children}
    </div>
  );
}

export default function Finale() {
  const skewRef = useRef<HTMLDivElement>(null);

  // velocity skew: the artifact sheet shears slightly with scroll speed,
  // damped back to rest — content feels like it has inertia, not a PDF
  useEffect(() => {
    let last = window.scrollY;
    let lastT = performance.now();
    let skew = 0;
    let raf: number;
    const loop = () => {
      const now = performance.now();
      const dt = Math.max(0.001, (now - lastT) / 1000);
      const v = (window.scrollY - last) / dt;
      last = window.scrollY;
      lastT = now;
      const target = Math.max(-2, Math.min(2, v * 0.0011));
      skew += (target - skew) * (1 - Math.exp(-8 * dt));
      if (skewRef.current)
        skewRef.current.style.transform = `skewY(${skew.toFixed(3)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="relative z-10 bg-gradient-to-b from-transparent via-[#06070ab3] to-[#06070ae0]">
      <div ref={skewRef} className="mx-auto max-w-5xl px-6 pt-[38vh] pb-24">
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-[10px] tracking-[0.3em] text-signal/80 uppercase">
            SCN 04 // order
          </div>
          <div className="font-mono text-[10px] text-dim/50">
            output artifact — v1.0
          </div>
        </div>
        <Scramble
          as="h2"
          text="chaos, processed."
          className="mt-4 block text-4xl font-medium sm:text-6xl"
        />

        {/* stats — readout line, no boxes */}
        <Reveal className="mt-16">
          <div className="flex flex-wrap gap-x-12 gap-y-8">
            {stats.map((s) => (
              <div key={s.caption} className="border-l border-white/15 pl-5">
                <CountUp
                  value={s.value}
                  className="text-3xl font-medium text-signal"
                />
                <div className="mt-2 max-w-[11rem] text-xs leading-relaxed text-dim">
                  {s.caption}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* work log */}
        <div className="mt-28">
          <div className="flex items-baseline justify-between">
            <h3 className="font-mono text-xs tracking-[0.25em] text-dim uppercase">
              systems built at work
            </h3>
            <span className="font-mono text-[10px] text-dim/50">
              artifacts // {String(workCluster.length).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-6 border-t border-white/10">
            {workCluster.map((w, i) => (
              <Reveal key={w.name} delay={i * 40}>
                <FocusRow
                  hue={i}
                  className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-5 border-b border-white/10 py-5 sm:grid-cols-[2.5rem_1fr_auto]"
                >
                  <span className="font-mono text-[10px] text-dim/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="font-medium transition-colors duration-300 group-hover:text-signal">
                      {w.name}
                    </div>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-dim">
                      {w.line}
                    </p>
                  </div>
                  <span className="hidden font-mono text-[10px] text-dim/60 sm:block">
                    {w.stack}
                  </span>
                </FocusRow>
              </Reveal>
            ))}
          </div>
        </div>

        {/* personal log */}
        <div className="mt-28">
          <h3 className="font-mono text-xs tracking-[0.25em] text-dim uppercase">
            things i build for myself
          </h3>
          <Reveal className="mt-8">
            <FocusRow hue={0} className="group">
              <a
                href={personalCluster.featured.href}
                target="_blank"
                rel="noreferrer"
                className="block border-l-2 border-signal/50 py-1 pl-6 transition-colors hover:border-signal"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div className="text-xl font-medium text-signal">
                    {personalCluster.featured.name}
                  </div>
                  <div className="font-mono text-[10px] text-dim">
                    {personalCluster.featured.stack}
                  </div>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dim">
                  {personalCluster.featured.line}
                </p>
              </a>
            </FocusRow>
          </Reveal>
          <div className="mt-8 grid gap-x-12 sm:grid-cols-2">
            {personalCluster.rest.map((p, i) => (
              <Reveal key={p.name} delay={i * 40}>
                <FocusRow
                  hue={i + 1}
                  className="group border-t border-white/10 py-4"
                >
                  <div className="font-mono text-sm transition-colors duration-300 group-hover:text-signal">
                    {p.name}
                  </div>
                  <p className="mt-1 text-xs text-dim">{p.line}</p>
                </FocusRow>
              </Reveal>
            ))}
          </div>
        </div>

        {/* skills */}
        <Reveal className="mt-28">
          <div className="grid gap-6 sm:grid-cols-2">
            {skills.map((s) => (
              <div key={s.group} className="border-l border-white/15 pl-5">
                <div className="font-mono text-[10px] tracking-[0.25em] text-signal/70 uppercase">
                  {s.group}
                </div>
                <p className="mt-2 text-sm text-dim">{s.items}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* contact — the pipeline's shell */}
        <div className="mt-28 border-t border-white/10 pt-14">
          <p className="font-mono text-xs text-dim">
            {">"} open to data · automation · ai roles
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto]">
            <Reveal>
              <Terminal />
            </Reveal>
            <div className="flex flex-row flex-wrap gap-x-8 gap-y-4 lg:flex-col lg:pt-2">
              {[
                { label: "say hello", href: `mailto:${identity.email}` },
                { label: "github", href: identity.github },
                { label: "linkedin", href: identity.linkedin },
              ].map((l) => (
                <Magnetic key={l.label}>
                  <a
                    href={l.href}
                    target={l.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="font-mono text-xs tracking-wider text-dim transition-colors hover:text-signal"
                  >
                    {">"} {l.label}
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>
          <p className="mt-16 font-mono text-[10px] leading-relaxed text-dim/50">
            {footerLine}
          </p>
        </div>
      </div>
    </section>
  );
}
