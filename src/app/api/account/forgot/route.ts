import { NextResponse } from "next/server";
import { createToken, siteLink } from "@/lib/auth-tokens";
import { isEmailConfigured } from "@/lib/config";
import { buildAuthMail, localeFromRequest, sendMail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

/** Always answers ok, whether or not the account exists. */
export async function POST(request: Request) {
  const { email: raw } = (await request.json().catch(() => ({}))) as { email?: string };
  const email = (raw ?? "").trim().toLowerCase();
  if (prisma && email && isEmailConfigured()) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      const token = await createToken("reset", email, 3600);
      await sendMail(buildAuthMail("reset", localeFromRequest(request), email, siteLink("/auth/reset-password", { token })));
    }
  }
  return NextResponse.json({ ok: true });
}
