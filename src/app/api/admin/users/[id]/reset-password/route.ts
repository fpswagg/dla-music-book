import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured, isMockMode } from "@/lib/config";
import { createPasswordResetLink, getAuth } from "@/lib/auth";
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
    const auth = getAuth();
    if (!auth) return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 503 });
    await auth.api.requestPasswordReset({
      body: { email: user.email, redirectTo: `${getSiteUrl()}/auth/reset-password` },
    });
    return NextResponse.json({ ok: true, sent: true });
  }

  const link = await createPasswordResetLink(user);
  if (!link) return NextResponse.json({ error: "RESET_FAILED" }, { status: 500 });
  return NextResponse.json({ ok: true, link });
}
