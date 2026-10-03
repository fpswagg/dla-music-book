import "server-only";
import { Resend } from "resend";
import { isEmailConfigured } from "./config";

export type MailLocale = "fr" | "en" | "duala";

type Mail = { to: string; subject: string; html: string; text: string };

let client: Resend | null = null;

/**
 * Sends an email with Resend when RESEND_API_KEY + RESEND_FROM are set.
 * Otherwise nothing is sent: in development the message (and its link) is printed to the
 * server console; in production only a warning is logged, never the link.
 */
export async function sendMail(mail: Mail): Promise<{ sent: boolean }> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n[mail:dev] To: ${mail.to}\n[mail:dev] Subject: ${mail.subject}\n${mail.text}\n`);
    } else {
      console.warn(`[mail] Email is not configured (RESEND_API_KEY / RESEND_FROM); "${mail.subject}" not sent.`);
    }
    return { sent: false };
  }
  client ??= new Resend(process.env.RESEND_API_KEY);
  const { error } = await client.emails.send({
    from: process.env.RESEND_FROM!,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  if (error) {
    console.error("[mail] Resend error:", error.name, error.message);
    return { sent: false };
  }
  return { sent: true };
}

/** Locale from the `locale` cookie of the request that triggered the email. */
export function localeFromRequest(request?: Request): MailLocale {
  const cookie = request?.headers.get("cookie") ?? "";
  const m = /(?:^|;\s*)locale=(fr|en|duala)/.exec(cookie);
  return (m?.[1] as MailLocale) ?? "fr";
}

const BRAND = "Myenge ma Bonakristo";

const COPY = {
  verify: {
    fr: { subject: "Confirmez votre adresse email", intro: "Bienvenue ! Confirmez votre adresse pour activer votre compte.", cta: "Confirmer mon email" },
    en: { subject: "Confirm your email address", intro: "Welcome! Confirm your address to activate your account.", cta: "Confirm my email" },
  },
  reset: {
    fr: { subject: "Réinitialiser votre mot de passe", intro: "Vous avez demandé un nouveau mot de passe. Ce lien est valable une heure.", cta: "Choisir un nouveau mot de passe" },
    en: { subject: "Reset your password", intro: "You asked for a new password. This link is valid for one hour.", cta: "Choose a new password" },
  },
  magic: {
    fr: { subject: "Votre lien de connexion", intro: "Cliquez pour vous connecter. Ce lien est valable 15 minutes.", cta: "Me connecter" },
    en: { subject: "Your sign-in link", intro: "Click to sign in. This link is valid for 15 minutes.", cta: "Sign me in" },
  },
} as const;

const FOOTER = {
  fr: "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
  en: "If you did not ask for this, you can ignore this message.",
};

export function buildAuthMail(kind: keyof typeof COPY, locale: MailLocale, to: string, url: string): Mail {
  const lang = locale === "en" ? "en" : "fr";
  const c = COPY[kind][lang];
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const html = `<!doctype html><html><body style="margin:0;background:#f5f0e8;font-family:system-ui,sans-serif;color:#3d4f3a">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
<p style="font-family:Georgia,serif;font-size:22px;color:#1e3a1e;margin:0 0 24px">${BRAND}</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 24px">${esc(c.intro)}</p>
<p style="margin:0 0 24px"><a href="${esc(url)}" style="display:inline-block;background:#2d5a2d;color:#f5f0e8;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px">${esc(c.cta)}</a></p>
<p style="font-size:12px;color:#7a6a50;line-height:1.5;margin:0 0 8px;word-break:break-all">${esc(url)}</p>
<p style="font-size:12px;color:#7a6a50;line-height:1.5;margin:24px 0 0">${esc(FOOTER[lang])}</p>
</div></body></html>`;
  const text = `${BRAND}\n\n${c.intro}\n\n${c.cta}: ${url}\n\n${FOOTER[lang]}`;
  return { to, subject: `${c.subject} — ${BRAND}`, html, text };
}
