import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, isMockMode } from "@/lib/config";
import { createToken, siteLink } from "@/lib/auth-tokens";
import { buildAuthMail, localeFromRequest, sendMail } from "@/lib/mailer";
import { getSiteUrl } from "@/lib/config";

/**
 * Body { mode: "email" | "link" }.
 * - "email": sends the reset email (needs Resend).
 * - "link": returns a one-hour reset link for the admin to hand over (works without email).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { mode } = (await request.json().catch(() => ({}))) as { mode?: string };

  if (isMockMode()) return NextResponse.json({ ok: true, link: `${getSiteUrl()}/auth/reset-password?token=demo` });
  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.email.endsWith("@users.invalid")) {
    return NextResponse.json({ error: "NO_EMAIL" }, { status: 400 });
  }

  if (mode === "email") {
    if (!isEmailConfigured()) return NextResponse.json({ error: "EMAIL_NOT_CONFIGURED" }, { status: 503 });
    const token = await createToken("reset", user.email, 3600);
    await sendMail(buildAuthMail("reset", localeFromRequest(request), user.email, siteLink("/auth/reset-password", { token })));
    return NextResponse.json({ ok: true, sent: true });
  }

  const token = await createToken("reset", user.email, 3600);
  return NextResponse.json({ ok: true, link: siteLink("/auth/reset-password", { token }) });
}
