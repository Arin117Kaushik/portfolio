"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { identity } from "@/lib/content";

// The contact block as a working terminal — diegetic to the pipeline
// fiction. `sudo hire-me` is the CTA. Plain links live beside it for
// recruiters who won't type.

interface Line {
  prompt?: boolean;
  text: string;
}

const BANNER: Line[] = [
  { text: "pipeline shell v1.0 — connected" },
  { text: "type `help` for available commands" },
];

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const run = (raw: string): Line[] => {
    const cmd = raw.trim().toLowerCase();
    switch (cmd) {
      case "help":
        return [
          { text: "available commands:" },
          { text: "  sudo hire-me    open a channel (mail)" },
          { text: "  github          view the source" },
          { text: "  linkedin        the formal profile" },
          { text: "  whoami          who built this" },
          { text: "  stack           what this site runs on" },
          { text: "  clear           clean the buffer" },
        ];
      case "hire-me":
      case "hire me":
        return [{ text: "permission denied — try `sudo hire-me`" }];
      case "sudo hire-me":
      case "sudo hire me":
        setTimeout(() => {
          window.location.href = `mailto:${identity.email}?subject=let's talk`;
        }, 600);
        return [
          { text: "access granted. opening channel to arin..." },
          { text: `→ ${identity.email}` },
        ];
      case "github":
        setTimeout(() => window.open(identity.github, "_blank"), 300);
        return [{ text: `→ ${identity.github}` }];
      case "linkedin":
        setTimeout(() => window.open(identity.linkedin, "_blank"), 300);
        return [{ text: `→ ${identity.linkedin}` }];
      case "whoami":
        return [
          { text: `${identity.name} — ${identity.sub}` },
          { text: identity.positioning.toLowerCase() },
        ];
      case "stack":
        return [
          { text: "next.js 15 · react three fiber · three.js · zustand" },
          { text: "one 30k-particle shader · web audio · no card grids" },
        ];
      case "clear":
        setLines([]);
        return [];
      case "":
        return [];
      default:
        return [{ text: `command not found: ${cmd} — try \`help\`` }];
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const out = run(value);
    setLines((prev) =>
      value.trim().toLowerCase() === "clear"
        ? []
        : [...prev, { prompt: true, text: value }, ...out]
    );
    setValue("");
  };

  return (
    <div
      className="cursor-text border border-white/10 bg-black/40 font-mono text-xs backdrop-blur-sm"
      onClick={() => input.current?.focus()}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-[10px] text-dim/60">
        <span className="h-2 w-2 rounded-full bg-signal/50" />
        arin@pipeline:~
      </div>
      <div ref={scroller} className="h-52 overflow-y-auto px-4 py-3">
        {lines.map((l, i) => (
          <div key={i} className="leading-relaxed whitespace-pre-wrap">
            {l.prompt ? (
              <span>
                <span className="text-signal">$ </span>
                <span className="text-ink">{l.text}</span>
              </span>
            ) : (
              <span className="text-dim">{l.text}</span>
            )}
          </div>
        ))}
        <form onSubmit={onSubmit} className="flex items-center">
          <span className="text-signal">$&nbsp;</span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-transparent text-ink outline-none"
            spellCheck={false}
            autoComplete="off"
            aria-label="terminal input"
          />
        </form>
      </div>
    </div>
  );
}
