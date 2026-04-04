"use client";

import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui/spinner";

type Namespace = "songs" | "collections" | "common";

export function ListPendingOverlay({
  pending,
  namespace = "songs",
  children,
  className = "",
}: {
  pending: boolean;
  namespace?: Namespace;
  children: React.ReactNode;
  /** Extra classes on the outer relative wrapper */
  className?: string;
}) {
  const ts = useTranslations("songs");
  const tc = useTranslations("collections");
  const tx = useTranslations("common");
  const label =
    namespace === "collections"
      ? tc("updating")
      : namespace === "common"
        ? tx("updating")
        : ts("updating");

  return (
    <div className={`relative ${className}`} aria-busy={pending}>
      {pending && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-[var(--color-parchment)]/60 pt-6"
          aria-hidden
        >
          <span className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border-[0.5px] border-[var(--color-stone)] bg-[var(--color-linen)] px-3 py-2 text-[13px] font-[var(--font-ui)] text-[var(--color-forest)]">
            <Spinner />
            {label}
          </span>
        </div>
      )}
      <div className={pending ? "opacity-60 pointer-events-none" : undefined}>{children}</div>
    </div>
  );
}
