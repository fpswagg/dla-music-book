"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthMessage } from "@/components/auth/auth-shell";
import { useAppConfig } from "@/components/providers/app-config";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const config = useAppConfig();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h1 className="font-display text-[26px] text-deep text-center m-0 mb-1">{t("forgotPassword")}</h1>
      {!config.auth || !config.email ? (
        <AuthMessage>{t("forgotNoEmail")}</AuthMessage>
      ) : sent ? (
        <AuthMessage tone="success">{t("resetSent", { email })}</AuthMessage>
      ) : (
        <form
          className="flex flex-col gap-4 mt-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const { authClient } = await import("@/lib/auth-client");
              await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/auth/reset-password` });
              setSent(true); // Same answer whether the account exists or not.
            } finally {
              setLoading(false);
            }
          }}
        >
          <p className="text-[13px] text-green-muted m-0">{t("forgotIntro")}</p>
          <Input id="email" label={t("email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" disabled={loading} className="min-h-[44px]">
            {t("sendResetLink")}
          </Button>
        </form>
      )}
      <p className="text-center mt-6 text-[13px]">
        <Link href="/auth/login" className="text-forest">{t("backToSignIn")}</Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(params.get("error") ? t("errorTokenInvalid") : "");
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h1 className="font-display text-[26px] text-deep text-center m-0 mb-6">{t("newPasswordTitle")}</h1>
      {error && <AuthMessage tone="error">{error}</AuthMessage>}
      {token ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (password !== confirm) {
              setError(t("errorPasswordMismatch"));
              return;
            }
            setLoading(true);
            setError("");
            try {
              const { authClient } = await import("@/lib/auth-client");
              const { error: err } = await authClient.resetPassword({ newPassword: password, token });
              if (err) setError(t("errorTokenInvalid"));
              else router.push("/auth/login?reset=1");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Input id="password" label={t("newPassword")} type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input id="confirm" label={t("confirmPassword")} type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button type="submit" disabled={loading} className="min-h-[44px]">
            {t("saveNewPassword")}
          </Button>
        </form>
      ) : (
        !error && <AuthMessage tone="error">{t("errorTokenInvalid")}</AuthMessage>
      )}
      <p className="text-center mt-6 text-[13px]">
        <Link href="/auth/login" className="text-forest">{t("backToSignIn")}</Link>
      </p>
    </div>
  );
}
