"use client";

import { Heart } from "lucide-react";
import { useLike } from "@/hooks/use-like";
import { Spinner } from "@/components/ui/spinner";

interface LikeButtonProps {
  songId: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: "sm" | "md";
}

export function LikeButton({
  songId,
  initialLiked = false,
  initialCount = 0,
  size = "md",
}: LikeButtonProps) {
  const { liked, count, loading, toggle } = useLike(songId, initialLiked, initialCount);
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle();
      }}
      disabled={loading}
      className="inline-flex items-center gap-1 bg-transparent border-none cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-amber)] transition-colors disabled:opacity-60 min-w-[2.5rem] justify-center"
    >
      {loading ? (
        <Spinner className="w-3.5 h-3.5 border-t-[var(--color-amber)]" />
      ) : (
        <>
          <Heart
            size={iconSize}
            fill={liked ? "var(--color-amber)" : "none"}
            stroke={liked ? "var(--color-amber)" : "currentColor"}
          />
          {count > 0 && (
            <span className="text-[11px] font-[var(--font-ui)]">{count}</span>
          )}
        </>
      )}
    </button>
  );
}
