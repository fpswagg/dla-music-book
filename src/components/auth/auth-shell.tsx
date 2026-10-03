import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

/** Centered card layout shared by the sign-in pages. */
export function AuthShell({ brand, children }: { brand: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-parchment px-4 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-10">
        <LanguageSwitcher compact />
      </div>
      <div className="w-full max-w-sm">
        <Link href="/" className="flex flex-col items-center gap-3 no-underline mb-8">
          <span className="w-12 h-12 rounded-full bg-green-light flex items-center justify-center">
            <BookOpen size={22} className="text-forest" />
          </span>
          <span className="font-display text-[15px] text-forest">{brand}</span>
        </Link>
        {children}
      </div>
    </div>
  );
}

export function AuthMessage({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: React.ReactNode }) {
  const cls =
    tone === "error"
      ? "bg-danger-light text-danger border-danger"
      : tone === "success"
        ? "bg-green-light text-forest border-forest"
        : "bg-amber-light text-amber border-amber";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-[var(--radius-md)] border-[0.5px] px-3 py-2.5 mb-4 text-[13px] leading-snug ${cls}`}>
      {children}
    </div>
  );
}

/** Only same-site paths are accepted as post-login redirects. */
export function safeRedirect(value: string | null | undefined, fallback = "/"): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}
