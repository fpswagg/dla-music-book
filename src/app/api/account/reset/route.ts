import { NextResponse } from "next/server";
import { consumeToken } from "@/lib/auth-tokens";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!prisma) return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 503 });
  const { token, password } = (await request.json().catch(() => ({}))) as { token?: string; password?: string };
  if (!password || password.length < 8) return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
  const email = await consumeToken("reset", token ?? "");
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user) return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
  const hash = hashPassword(password);
  const account = await prisma.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
  if (account) await prisma.account.update({ where: { id: account.id }, data: { password: hash } });
  else await prisma.account.create({ data: { userId: user.id, providerId: "credential", accountId: user.email, password: hash } });
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  return NextResponse.json({ ok: true });
}
