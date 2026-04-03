"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { Share2, Printer, Heart } from "lucide-react";

interface Props {
  songId: string;
}

export function SongDetailClient({ songId }: Props) {
  const t = useTranslations("song");
  const [toastVisible, setToastVisible] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/songs/${songId}`;
    try {
      await navigator.clipboard.writeText(url);
      setToastVisible(true);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setToastVisible(true);
    }
  }, [songId]);

  const handlePrint = () => window.print();

  const handleLike = async () => {
    setLiked(!liked);
    try {
      await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 size={14} /> {t("share")}
        </Button>
        <Button variant="ghost" size="sm" onClick={handlePrint}>
          <Printer size={14} /> {t("print")}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLike}>
          <Heart
            size={14}
            fill={liked ? "var(--color-amber)" : "none"}
            stroke={liked ? "var(--color-amber)" : "currentColor"}
          />
          {liked ? t("liked") : t("like")}
        </Button>
      </div>
      <Toast message={t("linkCopied")} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </>
  );
}
