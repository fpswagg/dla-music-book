import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-parchment)] px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
