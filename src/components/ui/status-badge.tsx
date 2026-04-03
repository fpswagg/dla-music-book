"use client";

import { useTranslations } from "next-intl";

type Status = "finished" | "draft" | "wip" | "shelved";

const statusStyles: Record<Status, string> = {
  finished: "bg-[var(--color-green-light)] text-[var(--color-forest)]",
  draft: "bg-[var(--color-sand)] text-[var(--color-text-muted)]",
  wip: "bg-[var(--color-amber-light)] text-[var(--color-amber)]",
  shelved: "bg-[var(--color-sand)] text-[var(--color-stone)]",
};

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const t = useTranslations("status");

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-medium font-[var(--font-ui)] whitespace-nowrap ${statusStyles[status]}`}
    >
      {label ?? t(status)}
    </span>
  );
}
