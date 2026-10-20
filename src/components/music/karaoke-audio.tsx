"use client";

import { useEffect, useRef, useState } from "react";

export type KaraokeLine = { line: number; text: string; startMs: number; endMs: number };

/** Index of the line sung at `ms` (the last one started), or -1. */
export function lineAt(lines: KaraokeLine[], ms: number): number {
  let current = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].startMs <= ms) current = i;
  return current;
}

/** An audio player with the hymn's lines lit in time (karaoke). Clicking a line jumps to it. */
export function KaraokeAudio({ src, lines, compact = false }: { src: string; lines: KaraokeLine[]; compact?: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const box = useRef<HTMLOListElement>(null);
  const [current, setCurrent] = useState(-1);

  useEffect(() => {
    const el = audio.current;
    if (!el || !lines.length) return;
    let raf = 0;
    const tick = () => {
      setCurrent(lineAt(lines, el.currentTime * 1000));
      if (!el.paused) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener("play", start);
    el.addEventListener("seeked", start);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("play", start);
      el.removeEventListener("seeked", start);
    };
  }, [lines]);

  useEffect(() => {
    const li = box.current?.children[current] as HTMLElement | undefined;
    const ol = box.current;
    if (li && ol) ol.scrollTo({ top: li.offsetTop - ol.clientHeight / 2 + li.clientHeight / 2, behavior: "smooth" });
  }, [current]);

  return (
    <div className="flex flex-col gap-2">
      <audio ref={audio} controls preload="metadata" src={src} className="w-full h-10" />
      {lines.length > 0 && (
        <ol ref={box} className={`list-none m-0 p-2 overflow-auto relative bg-linen rounded-[var(--radius-md)] ${compact ? "max-h-40" : "max-h-64"}`}>
          {lines.map((l, i) => (
            <li key={`${l.line}-${l.startMs}`}>
              <button
                type="button"
                onClick={() => {
                  if (!audio.current) return;
                  audio.current.currentTime = l.startMs / 1000;
                  void audio.current.play();
                }}
                className={`w-full text-left bg-transparent border-none cursor-pointer px-2 py-1 rounded font-display text-[16px] leading-snug transition-colors ${
                  i === current ? "text-forest bg-green-light" : i < current ? "text-text-muted" : "text-text-body"
                }`}
              >
                {l.text}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
