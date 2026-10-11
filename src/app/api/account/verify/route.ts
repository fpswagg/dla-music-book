import { NextResponse } from "next/server";
import { consumeToken } from "@/lib/auth-tokens";
import { getSiteUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const email = await consumeToken("verify", token);
  if (!prisma || !email) return NextResponse.redirect(`${getSiteUrl()}/auth/login?error=token`);
  await prisma.user.update({ where: { email }, data: { emailVerified: true } }).catch(() => {});
  return NextResponse.redirect(`${getSiteUrl()}/auth/login?verified=1`);
}
