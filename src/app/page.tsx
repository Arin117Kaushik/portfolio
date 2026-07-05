"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import HUD from "@/components/dom/HUD";
import Panels from "@/components/dom/Panels";
import Finale from "@/components/dom/Finale";
import SoundDirector from "@/components/dom/SoundDirector";
import Cursor from "@/components/dom/Cursor";
import { scrollState } from "@/lib/store";

const Experience = dynamic(() => import("@/components/canvas/Experience"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-0 flex items-center justify-center bg-bg font-mono text-xs text-dim">
      <span>
        booting pipeline<span className="cursor-blink">_</span>
      </span>
    </div>
  ),
});

export default function Home() {
  const driver = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // a narrative site always boards at the beginning — also defeats
    // browser scroll restoration racing us after dev reloads
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    // restoration can still fire after mount on a hard reload; catch it
    // two frames later, after the browser has had its say
    const rafId = requestAnimationFrame(() =>
      requestAnimationFrame(() => window.scrollTo(0, 0))
    );

    const onScroll = () => {
      if (!driver.current) return;
      const max = driver.current.offsetHeight - window.innerHeight;
      scrollState.target = Math.min(1, Math.max(0, window.scrollY / max));
      // past the corridor: how far the finale has risen into view
      scrollState.post = Math.min(
        1,
        Math.max(0, (window.scrollY - max) / (window.innerHeight * 1.2))
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <Experience />
      <HUD />
      <Panels />
      <SoundDirector />
      <Cursor />
      {/* scroll driver: the corridor journey */}
      <div ref={driver} className="h-[700vh]" />
      <Finale />
    </>
  );
}
