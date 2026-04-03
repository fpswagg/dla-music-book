"use client";

import { Heart, Play } from "lucide-react";
import { Tag } from "./tag";
import { StatusBadge } from "./status-badge";

interface SongCardProps {
  index: number;
  title: string;
  meta: string;
  status: "finished" | "draft";
  tags: Array<{ name: string; isMood?: boolean }>;
  duration?: string;
  hasPreview?: boolean;
  isLiked?: boolean;
  likeCount?: number;
  onLike?: () => void;
  onPlay?: () => void;
  onClick?: () => void;
}

export function SongCard({
  index,
  title,
  meta,
  status,
  tags,
  duration,
  hasPreview,
  isLiked,
  likeCount,
  onLike,
  onPlay,
  onClick,
}: SongCardProps) {
  return (
    <div
      className="bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)] overflow-hidden cursor-pointer hover:border-[var(--color-green-muted)] transition-colors"
      onClick={onClick}
    >
      <div className="flex gap-3 p-[14px_16px_10px]">
        <div className="text-[22px] leading-none text-[var(--color-stone)] font-[var(--font-display)] min-w-[28px]">
          {String(index).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)] mb-0.5 truncate">
            {title}
          </div>
          <div className="text-[12px] text-[var(--color-green-muted)] font-[var(--font-ui)]">
            {meta}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
          {tags.map((tag) => (
            <Tag key={tag.name} label={tag.name} variant={tag.isMood ? "mood" : "keyword"} />
          ))}
        </div>
      )}

      <div className="h-[0.5px] bg-[var(--color-stone)] mx-4 opacity-60" />

      <div className="flex items-center gap-2 px-4 py-2">
        {hasPreview && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlay?.(); }}
            className="w-7 h-7 rounded-full bg-[var(--color-forest)] text-[var(--color-parchment)] flex items-center justify-center cursor-pointer border-none"
          >
            <Play size={11} fill="currentColor" />
          </button>
        )}
        {duration && (
          <span className="text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
            {duration}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onLike?.(); }}
          className="ml-auto flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-amber)] cursor-pointer bg-transparent border-none"
        >
          <Heart size={16} fill={isLiked ? "var(--color-amber)" : "none"} stroke={isLiked ? "var(--color-amber)" : "currentColor"} />
          {likeCount !== undefined && likeCount > 0 && (
            <span className="text-[11px] font-[var(--font-ui)]">{likeCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}
