"use client";

import {
  footerLine,
  identity,
  personalCluster,
  skills,
  stats,
  workCluster,
} from "@/lib/content";

// The Order scene. Normal document flow — scrolls up over the fixed canvas
// once the corridor journey completes, constellation wall glowing behind.

export default function Finale() {
  return (
    <section className="relative z-10 bg-gradient-to-b from-transparent via-[#06070ae6] to-bg">
      <div className="mx-auto max-w-5xl px-6 pt-[38vh] pb-24">
        <div className="font-mono text-[10px] tracking-[0.3em] text-signal/80 uppercase">
          SCN 04 // order
        </div>
        <h2 className="mt-4 text-4xl font-medium sm:text-6xl">
          chaos, processed.
        </h2>

        {/* stats */}
        <div className="mt-14 grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.caption} className="bg-bg p-6">
              <div className="text-3xl font-medium text-signal">{s.value}</div>
              <div className="mt-2 text-xs leading-relaxed text-dim">
                {s.caption}
              </div>
            </div>
          ))}
        </div>

        {/* work cluster */}
        <div className="mt-24">
          <h3 className="font-mono text-xs tracking-[0.25em] text-dim uppercase">
            systems built at work
          </h3>
          <div className="mt-6 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {workCluster.map((w) => (
              <div
                key={w.name}
                className="group bg-bg p-6 transition-colors hover:bg-white/[0.03]"
              >
                <div className="font-medium">{w.name}</div>
                <p className="mt-2 text-xs leading-relaxed text-dim">{w.line}</p>
                <div className="mt-4 font-mono text-[10px] text-dim/60">
                  {w.stack}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* personal cluster */}
        <div className="mt-24">
          <h3 className="font-mono text-xs tracking-[0.25em] text-dim uppercase">
            things i build for myself
          </h3>
          <a
            href={personalCluster.featured.href}
            target="_blank"
            rel="noreferrer"
            className="mt-6 block border border-signal/25 bg-signal/[0.04] p-8 transition-colors hover:bg-signal/[0.08]"
          >
            <div className="flex items-baseline justify-between gap-4">
              <div className="text-xl font-medium text-signal">
                {personalCluster.featured.name}
              </div>
              <div className="font-mono text-[10px] text-dim">
                {personalCluster.featured.stack}
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-dim">
              {personalCluster.featured.line}
            </p>
          </a>
          <div className="mt-px grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {personalCluster.rest.map((p) => (
              <div key={p.name} className="bg-bg p-5">
                <div className="font-mono text-sm">{p.name}</div>
                <p className="mt-1 text-xs text-dim">{p.line}</p>
              </div>
            ))}
          </div>
        </div>

        {/* skills */}
        <div className="mt-24 grid gap-6 sm:grid-cols-2">
          {skills.map((s) => (
            <div key={s.group} className="border-l border-white/15 pl-5">
              <div className="font-mono text-[10px] tracking-[0.25em] text-signal/70 uppercase">
                {s.group}
              </div>
              <p className="mt-2 text-sm text-dim">{s.items}</p>
            </div>
          ))}
        </div>

        {/* contact */}
        <div className="mt-28 border-t border-white/10 pt-14">
          <p className="font-mono text-xs text-dim">
            {">"} open to data · automation · ai roles
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href={`mailto:${identity.email}`}
              className="border border-signal bg-signal px-6 py-3 font-mono text-xs tracking-wider text-bg transition-opacity hover:opacity-85"
            >
              say hello
            </a>
            <a
              href={identity.github}
              target="_blank"
              rel="noreferrer"
              className="border border-white/20 px-6 py-3 font-mono text-xs tracking-wider transition-colors hover:border-signal hover:text-signal"
            >
              github
            </a>
            <a
              href={identity.linkedin}
              target="_blank"
              rel="noreferrer"
              className="border border-white/20 px-6 py-3 font-mono text-xs tracking-wider transition-colors hover:border-signal hover:text-signal"
            >
              linkedin
            </a>
          </div>
          <p className="mt-16 font-mono text-[10px] leading-relaxed text-dim/50">
            {footerLine}
          </p>
        </div>
      </div>
    </section>
  );
}
