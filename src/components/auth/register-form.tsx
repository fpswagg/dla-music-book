"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthMessage, safeRedirect } from "@/components/auth/auth-shell";
import { GoogleButton, useAuthErrorMessage } from "@/components/auth/login-form";
import { useAppConfig } from "@/components/providers/app-config";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const config = useAppConfig();
  const errorMessage = useAuthErrorMessage();
  const redirect = safeRedirect(params.get("redirect"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkInbox, setCheckInbox] = useState(false);

  if (!config.auth) {
    return (
      <div>
        <h1 className="font-display text-[26px] text-deep text-center m-0 mb-4">{t("register")}</h1>
        <AuthMessage tone={config.mode === "mock" ? "info" : "error"}>{config.mode === "mock" ? t("demoRegister") : t("authNotAvailable")}</AuthMessage>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { authClient } = await import("@/lib/auth-client");
      const { error: err } = await authClient.signUp.email({
        name: name.trim(),
        email,
        password,
        callbackURL: `/auth/login?verified=1&redirect=${encodeURIComponent(redirect)}`,
      });
      if (err) {
        setError(errorMessage(err));
        return;
      }
      if (config.email) {
        setCheckInbox(true);
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  if (checkInbox) {
    return (
      <div>
        <h1 className="font-display text-[26px] text-deep text-center m-0 mb-4">{t("checkInboxTitle")}</h1>
        <AuthMessage tone="success">{t("checkInbox", { email })}</AuthMessage>
        <p className="text-center text-[13px]">
          <Link href="/auth/login" className="text-forest">{t("signInLink")}</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[26px] text-deep text-center m-0 mb-1">{t("register")}</h1>
      <p className="text-[13px] text-green-muted text-center m-0 mb-6">{t("registerSubtitle")}</p>
      {error && <AuthMessage tone="error">{error}</AuthMessage>}

      {config.google && (
        <>
          <GoogleButton redirect={redirect} />
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-[0.5px] bg-stone" />
            <span className="text-[11px] text-text-muted">{t("or")}</span>
            <div className="flex-1 h-[0.5px] bg-stone" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input id="name" label={t("displayName")} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} required maxLength={80} />
        <Input id="email" label={t("email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} required />
        <Input id="password" label={t("password")} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("choosePassword")} required minLength={8} />
        <Button type="submit" disabled={loading} className="min-h-[44px]">
          {loading ? t("creating") : t("register")}
        </Button>
      </form>

      <p className="text-center mt-6 text-[13px] text-text-muted">
        {t("hasAccount")}{" "}
        <Link href="/auth/login" className="text-forest">{t("signInLink")}</Link>
      </p>
    </div>
  );
}
