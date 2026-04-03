"use client";

import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const t = useTranslations("song");

  return (
    <Button variant="ghost" size="sm" onClick={() => window.print()}>
      <Printer size={14} /> {t("print")}
    </Button>
  );
}
