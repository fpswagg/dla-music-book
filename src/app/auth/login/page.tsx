import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Music } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-[var(--color-parchment)] px-4 py-10 sm:py-12 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-10">
        <LanguageSwitcher compact />
      </div>
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-[var(--color-green-light)] flex items-center justify-center mb-6">
          <Music size={24} className="text-[var(--color-forest)]" />
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
