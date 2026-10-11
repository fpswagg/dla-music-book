import { NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { createToken, siteLink } from "@/lib/auth-tokens";
import { getSiteUrl, isEmailConfigured } from "@/lib/config";
import { buildAuthMail, localeFromRequest, sendMail } from "@/lib/mailer";

const safe = (v: string | null | undefined) => (v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/");

/** POST { email, redirect }: emails a one-time sign-in link. */
export async function POST(request: Request) {
  if (!isEmailConfigured()) return NextResponse.json({ error: "EMAIL_NOT_CONFIGURED" }, { status: 503 });
  const { email: raw, redirect } = (await request.json().catch(() => ({}))) as { email?: string; redirect?: string };
  const email = (raw ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  const token = await createToken("magic", email, 15 * 60);
  await sendMail(buildAuthMail("magic", localeFromRequest(request), email, siteLink("/api/account/magic", { token, redirect: safe(redirect) })));
  return NextResponse.json({ ok: true });
}

/** GET from the emailed link: signs in, then redirects. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    await signIn("magic", { token: params.get("token") ?? "", redirectTo: safe(params.get("redirect")) });
  } catch (err) {
    // signIn redirects by throwing; rethrow that, turn real failures into the login error page.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw err;
    return NextResponse.redirect(`${getSiteUrl()}/auth/login?error=token`);
  }
  return NextResponse.redirect(`${getSiteUrl()}/`);
}
