"use client";

import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  duration?: string;
}

export function AudioPlayer({ src, duration }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(pct);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
  };

  return (
    <div className="flex items-center gap-3 bg-[var(--color-linen)] rounded-[var(--radius-md)] px-3 py-2">
      <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} />
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-[var(--color-forest)] text-[var(--color-parchment)] flex items-center justify-center cursor-pointer border-none shrink-0"
      >
        {playing ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
      </button>
      <div className="flex-1 h-1 bg-[var(--color-sand)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-forest)] rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {duration && (
        <span className="text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)] shrink-0">
          {duration}
        </span>
      )}
    </div>
  );
}
