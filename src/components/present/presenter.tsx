"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from "lucide-react";
import type { Slide } from "@/lib/presentation";

/**
 * Projection mode: one stanza per screen, big type, dark background.
 * Keys: → / Space / PageDown next · ← / PageUp previous · Home / End · F fullscreen ·
 * B or . blank screen · Esc exit. Tap the right / left half on touch screens.
 */
export function Presenter({ slides, exitHref, title }: { slides: Slide[]; exitHref: string; title: string }) {
  const t = useTranslations("present");
  const router = useRouter();
  const [i, setI] = useState(0);
  const [blank, setBlank] = useState(false);
  const [full, setFull] = useState(false);
  const [idle, setIdle] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((delta: number) => {
    setBlank(false);
    setI((v) => Math.min(slides.length - 1, Math.max(0, v + delta)));
  }, [slides.length]);

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.().catch(() => undefined);
  }, []);

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
        case "Enter":
          go(1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
        case "Backspace":
          go(-1);
          break;
        case "Home":
          setI(0);
          break;
        case "End":
          setI(slides.length - 1);
          break;
        case "f":
        case "F":
          toggleFull();
          break;
        case "b":
        case "B":
        case ".":
          setBlank((v) => !v);
          break;
        case "Escape":
          if (!document.fullscreenElement) router.push(exitHref);
          return;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, router, exitHref, slides.length, toggleFull]);

  // Keep the screen awake while projecting.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => undefined);
    return () => void lock?.release().catch(() => undefined);
  }, []);

  // Hide controls and cursor after 2.5 s without movement.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 2500);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("touchstart", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("touchstart", wake);
    };
  }, []);

  const slide = slides[i];
  const btn = "inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-[#f2ecdc] border-none cursor-pointer hover:bg-white/20";

  return (
    <div
      ref={rootRef}
      data-present
      className={`present fixed inset-0 z-[90] flex flex-col select-none ${idle ? "cursor-none" : ""}`}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const start = touch.current;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        else go(e.changedTouches[0].clientX > window.innerWidth / 2 ? 1 : -1);
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button,a")) return;
        if (!("ontouchstart" in window)) go(e.clientX > window.innerWidth / 2 ? 1 : -1);
      }}
    >
      <div className={`flex items-center justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2 transition-opacity ${idle ? "opacity-0" : "opacity-100"}`}>
        <a href={exitHref} className={btn} aria-label={t("exit")} onClick={(e) => { e.preventDefault(); router.push(exitHref); }}>
          <X size={20} />
        </a>
        <span className="font-ui text-[13px] text-[#a8b89a] truncate">{title}</span>
        <button type="button" className={btn} onClick={toggleFull} aria-label={full ? t("exitFullscreen") : t("fullscreen")}>
          {full ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-[6vw] pb-6 overflow-hidden">
        {!blank && slide && (
          <div key={slide.key} className="w-full max-w-[1400px] text-center animate-[fadeIn_180ms_ease-out]">
            {slide.kicker && <p className="font-ui text-[clamp(13px,1.6vw,22px)] tracking-[0.12em] uppercase text-[#a8b89a] m-0 mb-[3vh]">{slide.kicker}</p>}
            {slide.kind === "title" ? (
              <>
                <p className="m-0 text-[clamp(64px,14vw,200px)] leading-none">{slide.lines[0]}</p>
                <p className="m-0 mt-[4vh] text-[clamp(26px,4vw,56px)] text-[#e3d9bf]">{slide.lines[1]}</p>
              </>
            ) : (
              <div className={`present-text ${slide.kind === "refrain" ? "italic text-[#e3d9bf]" : ""}`}>
                {slide.lines.map((l, k) => (
                  <p key={k} className="m-0">{l}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`flex items-center justify-center gap-4 pb-[max(14px,env(safe-area-inset-bottom))] transition-opacity ${idle ? "opacity-0" : "opacity-100"}`}>
        <button type="button" className={btn} onClick={() => go(-1)} disabled={i === 0} aria-label={t("previous")}>
          <ChevronLeft size={22} />
        </button>
        <span className="font-ui text-[13px] text-[#a8b89a] tabular-nums min-w-[64px] text-center">
          {slides.length ? `${i + 1} / ${slides.length}` : t("empty")}
        </span>
        <button type="button" className={btn} onClick={() => go(1)} disabled={i >= slides.length - 1} aria-label={t("next")}>
          <ChevronRight size={22} />
        </button>
      </div>
      <p className={`sr-only`} aria-live="polite">{slide?.lines.join(" ")}</p>
    </div>
  );
}
