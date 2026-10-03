import Link from "next/link";
import { Tag } from "./tag";
import { StatusBadge } from "./status-badge";
import { LikeButton } from "@/components/songs/like-button";

interface SongCardProps {
  index: number;
  title: string;
  /** First line of the hymn (shown when different from the title). */
  firstLine?: string;
  meta?: string;
  references?: string;
  status?: "finished" | "draft";
  tags?: Array<{ name: string; isMood?: boolean }>;
  songId: string;
  isLiked?: boolean;
  likeCount?: number;
  href?: string;
}

export function SongCard({ index, title, firstLine, meta, references, status, tags = [], songId, isLiked, likeCount, href }: SongCardProps) {
  return (
    <div className="group relative h-full flex flex-col bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] overflow-hidden hover:border-forest transition-colors">
      <div className="flex gap-3 px-4 pt-3.5 pb-2.5 flex-1">
        <div className="font-display text-[24px] leading-none text-stone group-hover:text-forest transition-colors min-w-[36px] tabular-nums">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={href ?? `/songs/${index}`} className="no-underline after:absolute after:inset-0">
            <span className="block text-[16px] text-deep font-display truncate">{title}</span>
          </Link>
          {firstLine && firstLine !== title && (
            <span className="block text-[13px] text-text-body font-display truncate">{firstLine}</span>
          )}
          {(meta || references) && (
            <span className="block text-[12px] text-green-muted mt-0.5 truncate">{[references, meta].filter(Boolean).join(" · ")}</span>
          )}
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

      {likeCount !== undefined && (
        <>
          <div className="h-[0.5px] bg-stone mx-4 opacity-60" />
          <div className="relative z-10 flex items-center px-4 py-1.5 justify-end">
            <LikeButton songId={songId} initialLiked={isLiked} initialCount={likeCount} size="sm" />
          </div>
        </>
      )}
    </div>
  );
}
