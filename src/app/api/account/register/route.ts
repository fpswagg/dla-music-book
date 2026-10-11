import { NextResponse } from "next/server";
import { getAdminEmails, isAuthConfigured, isEmailConfigured } from "@/lib/config";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { localeFromRequest } from "@/lib/mailer";
import { sendVerificationMail } from "@/lib/auth";

export async function POST(request: Request) {
  if (!prisma || !isAuthConfigured()) return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { name?: string; email?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim().slice(0, 80) || email.split("@")[0];
  const password = body.password ?? "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "USER_ALREADY_EXISTS" }, { status: 409 });
  }
  const user = await prisma.user.create({
    data: {
      email,
      displayName: name,
      role: getAdminEmails().includes(email) ? "ADMIN" : "USER",
      accounts: { create: { providerId: "credential", accountId: email, password: hashPassword(password) } },
    },
  });
  if (isEmailConfigured()) await sendVerificationMail(user.email, localeFromRequest(request));
  return NextResponse.json({ ok: true, verify: isEmailConfigured() });
}
