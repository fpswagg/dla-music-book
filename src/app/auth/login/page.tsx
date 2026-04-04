import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Music } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--color-parchment)] px-4 py-12">
      <div className="absolute top-4 right-4 z-10">
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
