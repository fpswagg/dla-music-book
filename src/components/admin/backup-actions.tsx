"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

export function BackupActions() {
  const t = useTranslations("adminBackup");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Button size="sm" onClick={handleCreate} disabled={creating}>
      <Database size={14} /> {creating ? t("creating") : t("createBackup")}
    </Button>
  );
}
