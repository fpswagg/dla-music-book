"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

interface ShareButtonProps {
  songId: string;
}

export function ShareButton({ songId }: ShareButtonProps) {
  const t = useTranslations("song");
  const [toastVisible, setToastVisible] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/songs/${songId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setToastVisible(true);
  }, [songId]);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleShare}>
        <Share2 size={14} /> {t("share")}
      </Button>
      <Toast message={t("linkCopied")} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </>
  );
}
