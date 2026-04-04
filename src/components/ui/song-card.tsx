"use client";

import { Play } from "lucide-react";
import { Tag } from "./tag";
import { StatusBadge } from "./status-badge";
import { LikeButton } from "@/components/songs/like-button";

interface SongCardProps {
  index: number;
  title: string;
  meta: string;
  status?: "finished" | "draft";
  tags: Array<{ name: string; key?: string; category?: string; isMood?: boolean }>;
  duration?: string;
  hasPreview?: boolean;
  songId: string;
  isLiked?: boolean;
  likeCount?: number;
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
  songId,
  isLiked,
  likeCount,
  onPlay,
  onClick,
}: SongCardProps) {
  return (
    <div
      className="group bg-[var(--color-parchment)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)] overflow-hidden cursor-pointer hover:border-[var(--color-forest)] transition-colors"
      onClick={onClick}
    >
      <div className="flex gap-3 p-[14px_16px_10px]">
        <div className="text-[22px] leading-none text-[var(--color-stone)] group-hover:text-[var(--color-forest)] transition-colors font-[var(--font-display)] min-w-[28px]">
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
        {status && <StatusBadge status={status} />}
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
            className="w-7 h-7 rounded-full bg-[var(--color-forest)] text-[var(--color-parchment)] flex items-center justify-center cursor-pointer border-none hover:bg-[var(--color-deep)] transition-colors"
          >
            <Play size={11} fill="currentColor" />
          </button>
        )}
        {duration && (
          <span className="text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
            {duration}
          </span>
        )}
        <div className="ml-auto">
          <LikeButton songId={songId} initialLiked={isLiked} initialCount={likeCount} size="sm" />
        </div>
      </div>
    </div>
  );
}
