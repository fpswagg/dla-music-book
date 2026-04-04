"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-8 text-center">
        <h1 className="text-[22px] text-[var(--color-deep)] font-[var(--font-display)] m-0 mb-2">
          {t("title")}
        </h1>
        <p className="text-[14px] text-[var(--color-green-muted)] font-[var(--font-ui)] m-0 mb-6 leading-relaxed">
          {t("description")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 bg-[var(--color-forest)] text-[var(--color-parchment)] rounded-[var(--radius-md)] px-5 py-2.5 text-[13px] font-[var(--font-ui)] border-none cursor-pointer hover:bg-[var(--color-deep)] transition-colors"
          >
            <RefreshCw size={16} aria-hidden />
            {t("tryAgain")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border-[0.5px] border-[var(--color-stone)] bg-[var(--color-parchment)] text-[var(--color-deep)] rounded-[var(--radius-md)] px-5 py-2.5 text-[13px] font-[var(--font-ui)] no-underline hover:bg-[var(--color-sand)] transition-colors"
          >
            <Home size={16} aria-hidden />
            {t("backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
