"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-parchment)] text-[var(--color-text-body)] font-[var(--font-ui)] p-6">
        <div className="max-w-md w-full bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] p-8 text-center">
          <h1 className="text-[20px] text-[var(--color-deep)] font-[var(--font-display)] mb-2">Something went wrong</h1>
          <p className="text-[13px] text-[var(--color-green-muted)] font-[var(--font-ui)] mb-6">
            Please try again or return to the home page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="px-5 py-2.5 text-[13px] bg-[var(--color-forest)] text-[var(--color-parchment)] rounded-[var(--radius-md)] border-none cursor-pointer hover:bg-[var(--color-deep)]"
            >
              Refresh
            </button>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 text-[13px] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] no-underline text-[var(--color-deep)] bg-[var(--color-parchment)] hover:bg-[var(--color-sand)]"
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
