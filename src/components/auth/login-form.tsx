"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleLogoIcon } from "@/components/auth/oauth-icons";
import { AuthMessage, safeRedirect } from "@/components/auth/auth-shell";
import { useAppConfig } from "@/components/providers/app-config";

type ErrorLike = { code?: string; message?: string; status?: number } | null | undefined;

export function useAuthErrorMessage() {
  const t = useTranslations("auth");
  return (error: ErrorLike) => {
    const code = `${error?.code ?? ""} ${error?.message ?? ""}`;
    if (code.includes("EMAIL_NOT_VERIFIED") || code.toLowerCase().includes("email not verified")) return t("errorNotVerified");
    if (code.includes("ACCOUNT_BANNED")) return t("errorBanned");
    if (code.includes("INVALID_EMAIL_OR_PASSWORD") || code.includes("INVALID_PASSWORD")) return t("errorInvalid");
    if (code.includes("USER_ALREADY_EXISTS")) return t("errorExists");
    if (code.includes("PASSWORD_TOO_SHORT")) return t("errorPasswordShort");
    if (error?.status === 429) return t("errorRateLimit");
    return t("errorGeneric");
  };
}

export function GoogleButton({ redirect }: { redirect: string }) {
  const t = useTranslations("auth");
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full gap-2 min-h-[44px]"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const { authClient } = await import("@/lib/auth-client");
          await authClient.signIn.social({ provider: "google", callbackURL: redirect, errorCallbackURL: "/auth/login?error=oauth" });
        } finally {
          setBusy(false);
        }
      }}
    >
      <GoogleLogoIcon className="text-deep shrink-0" />
      {t("continueWithGoogle")}
    </Button>
  );
}

function Divider() {
  const t = useTranslations("auth");
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-[0.5px] bg-stone" />
      <span className="text-[11px] text-text-muted">{t("or")}</span>
      <div className="flex-1 h-[0.5px] bg-stone" />
    </div>
  );
}

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const config = useAppConfig();
  const errorMessage = useAuthErrorMessage();
  const redirect = safeRedirect(params.get("redirect"));
  const [mode, setMode] = useState<"password" | "link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkSent, setLinkSent] = useState(false);

  if (config.mode === "mock") {
    return (
      <div>
        <h1 className="font-display text-[26px] text-deep text-center m-0 mb-4">{t("signIn")}</h1>
        <AuthMessage>{t("demoMode")}</AuthMessage>
        <Button className="w-full min-h-[44px]" onClick={() => router.push(redirect === "/" ? "/dashboard" : redirect)}>
          {t("continueDemo")}
        </Button>
      </div>
    );
  }

  if (!config.auth) {
    return (
      <div>
        <h1 className="font-display text-[26px] text-deep text-center m-0 mb-4">{t("signIn")}</h1>
        <AuthMessage tone="error">{t("authNotAvailable")}</AuthMessage>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { authClient } = await import("@/lib/auth-client");
      if (mode === "link") {
        const { error: err } = await authClient.signIn.magicLink({ email, callbackURL: redirect });
        if (err) setError(errorMessage(err));
        else setLinkSent(true);
        return;
      }
      const { error: err } = await authClient.signIn.email({ email, password, callbackURL: redirect });
      if (err) {
        setError(errorMessage(err));
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

  const hasError = !!params.get("error");
  const notice = params.get("verified") ? t("noticeVerified") : params.get("reset") ? t("noticeReset") : hasError ? t("errorGeneric") : null;

  return (
    <div>
      <h1 className="font-display text-[26px] text-deep text-center m-0 mb-1">{t("signIn")}</h1>
      <p className="text-[13px] text-green-muted text-center m-0 mb-6">{t("signInSubtitle")}</p>

      {notice && <AuthMessage tone={hasError ? "error" : "success"}>{notice}</AuthMessage>}
      {error && <AuthMessage tone="error">{error}</AuthMessage>}

      {config.google && (
        <>
          <GoogleButton redirect={redirect} />
          <Divider />
        </>
      )}

      {linkSent ? (
        <AuthMessage tone="success">{t("magicLinkSent", { email })}</AuthMessage>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input id="email" label={t("email")} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} required />
          {mode === "password" && (
            <div className="flex flex-col gap-1">
              <Input id="password" label={t("password")} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("passwordPlaceholder")} required />
              {config.email && (
                <Link href={`/auth/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="self-end text-[12px] text-forest mt-1">
                  {t("forgotPassword")}
                </Link>
              )}
            </div>
          )}
          <Button type="submit" disabled={loading} className="min-h-[44px]">
            {loading ? t("signingIn") : mode === "link" ? t("sendMagicLink") : t("signInButton")}
          </Button>
          {config.email && (
            <button
              type="button"
              onClick={() => {
                setMode(mode === "link" ? "password" : "link");
                setError("");
              }}
              className="bg-transparent border-none text-[12px] text-forest cursor-pointer"
            >
              {mode === "link" ? t("usePassword") : t("useMagicLink")}
            </button>
          )}
        </form>
      )}

      {!config.email && <p className="text-[12px] text-text-muted text-center mt-4 mb-0">{t("forgotNoEmail")}</p>}

      <p className="text-center mt-6 text-[13px] text-text-muted">
        {t("noAccount")}{" "}
        <Link href={`/auth/register${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-forest">
          {t("registerLink")}
        </Link>
      </p>
    </div>
  );
}
