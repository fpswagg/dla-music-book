"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isMockMode } from "@/lib/env";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mock = isMockMode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mock) {
      console.log("[Mock] Register:", { name, email });
      router.push("/");
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!supabase) { setError(t("authNotAvailable")); return; }

      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (err) { setError(err.message); return; }
      router.push("/auth/login?registered=true");
    } catch {
      setError(t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-parchment)] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] text-center mb-1">
          {t("register")}
        </h1>
        <p className="text-[13px] text-[var(--color-green-muted)] font-[var(--font-ui)] text-center mb-8">
          {t("registerSubtitle")}
        </p>

        {mock && (
          <div className="bg-[var(--color-amber-light)] rounded-[var(--radius-md)] px-3 py-2 mb-4 text-[12px] text-[var(--color-amber)] text-center font-[var(--font-ui)]">
            {t("demoRegister")}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-[0.5px] border-red-200 rounded-[var(--radius-md)] px-3 py-2 mb-4 text-[12px] text-red-600 font-[var(--font-ui)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="name" label={t("displayName")} value={name} onChange={e => setName(e.target.value)} placeholder={t("namePlaceholder")} required />
          <Input id="email" label={t("email")} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} required />
          <Input id="password" label={t("password")} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t("choosePassword")} required minLength={6} />
          <Button type="submit" disabled={loading}>{loading ? t("creating") : t("register")}</Button>
        </form>

        <p className="text-center mt-6 text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
          {t("hasAccount")}{" "}
          <Link href="/auth/login" className="text-[var(--color-forest)] no-underline hover:underline">
            {t("signInLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
