"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { Share2, Printer } from "lucide-react";

interface Props {
  songId: string;
}

export function SongDetailClient({ songId }: Props) {
  const t = useTranslations("song");
  const [toastVisible, setToastVisible] = useState(false);

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

  return (
    <>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 size={14} /> {t("share")}
        </Button>
        <Button variant="ghost" size="sm" onClick={handlePrint}>
          <Printer size={14} /> {t("print")}
        </Button>
      </div>
      <Toast message={t("linkCopied")} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </>
  );
}
