"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isClientMockMode } from "@/lib/env.client";
import { mockAuth } from "@/lib/mock/auth";
import { Mail, Phone } from "lucide-react";
import { FacebookLogoIcon, GoogleLogoIcon } from "@/components/auth/oauth-icons";

export function LoginForm() {
  const t = useTranslations("auth");
  const tb = useTranslations("brand");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mock = isClientMockMode();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mock) {
      await mockAuth.signInWithEmail(email, password);
      router.push(redirect);
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!supabase) { setError(t("authNotAvailable")); return; }
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); return; }
      router.push(redirect);
      router.refresh();
    } catch {
      setError(t("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mock) {
      if (!otpSent) { await mockAuth.signInWithPhone(phone); setOtpSent(true); }
      else { await mockAuth.verifyOtp(phone, otp); router.push(redirect); }
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!supabase) { setError(t("authNotAvailable")); return; }
      if (!otpSent) {
        const { error: err } = await supabase.auth.signInWithOtp({ phone });
        if (err) { setError(err.message); return; }
        setOtpSent(true);
      } else {
        const { error: err } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
        if (err) { setError(err.message); return; }
        router.push(redirect);
        router.refresh();
      }
    } catch {
      setError(t("phoneFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    if (mock) { await mockAuth.signInWithOAuth(provider); router.push(redirect); return; }
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!supabase) return;
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
      });
    } catch { setError(t("oauthFailed")); }
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-[28px] text-[var(--color-deep)] font-[var(--font-display)] text-center mb-1">
        {tb("name")}
      </h1>
      <p className="text-[13px] text-[var(--color-green-muted)] font-[var(--font-ui)] text-center mb-8">
        {t("signIn")}
      </p>

      {mock && (
        <div className="bg-[var(--color-amber-light)] rounded-[var(--radius-md)] px-3 py-2 mb-4 text-[12px] text-[var(--color-amber)] text-center font-[var(--font-ui)]">
          {t("demoMode")}
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-[var(--color-linen)] rounded-[var(--radius-md)] p-1">
        <button onClick={() => setTab("email")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-sm)] text-[12px] font-[var(--font-ui)] cursor-pointer border-none transition-colors ${tab === "email" ? "bg-[var(--color-parchment)] text-[var(--color-deep)] font-medium" : "bg-transparent text-[var(--color-text-muted)]"}`}>
          <Mail size={14} /> {t("email")}
        </button>
        <button onClick={() => setTab("phone")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-sm)] text-[12px] font-[var(--font-ui)] cursor-pointer border-none transition-colors ${tab === "phone" ? "bg-[var(--color-parchment)] text-[var(--color-deep)] font-medium" : "bg-transparent text-[var(--color-text-muted)]"}`}>
          <Phone size={14} /> {t("phone")}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-[0.5px] border-red-200 rounded-[var(--radius-md)] px-3 py-2 mb-4 text-[12px] text-red-600 font-[var(--font-ui)]">
          {error}
        </div>
      )}

      {tab === "email" ? (
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          <Input id="email" label={t("email")} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} required />
          <Input id="password" label={t("password")} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t("passwordPlaceholder")} required />
          <Button type="submit" disabled={loading}>{loading ? t("signingIn") : t("signInButton")}</Button>
        </form>
      ) : (
        <form onSubmit={handlePhoneLogin} className="flex flex-col gap-4">
          <Input id="phone" label={t("phone")} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t("phonePlaceholder")} required disabled={otpSent} />
          {otpSent && <Input id="otp" label={t("verificationCode")} type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder={t("otpPlaceholder")} required />}
          <Button type="submit" disabled={loading}>{loading ? t("verifying") : otpSent ? t("verifyCode") : t("sendCode")}</Button>
        </form>
      )}

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-[0.5px] bg-[var(--color-stone)]" />
        <span className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)]">{t("orContinueWith")}</span>
        <div className="flex-1 h-[0.5px] bg-[var(--color-stone)]" />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1 gap-2" onClick={() => handleOAuth("google")}>
          <GoogleLogoIcon className="text-[var(--color-deep)] shrink-0" />
          {t("google")}
        </Button>
        <Button variant="secondary" className="flex-1 gap-2" onClick={() => handleOAuth("facebook")}>
          <FacebookLogoIcon className="text-[var(--color-deep)] shrink-0" />
          {t("facebook")}
        </Button>
      </div>

      <p className="text-center mt-6 text-[13px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
        {t("noAccount")}{" "}
        <Link href="/auth/register" className="text-[var(--color-forest)] no-underline hover:underline">
          {t("registerLink")}
        </Link>
      </p>
    </div>
  );
}
