import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { getSiteUrl } from "./config";

export type TokenKind = "verify" | "reset" | "magic";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** One-time token stored hashed in the Verification table. Returns the raw token for the link. */
export async function createToken(kind: TokenKind, email: string, ttlSeconds: number): Promise<string> {
  if (!prisma) throw new Error("DB_UNAVAILABLE");
  const token = randomBytes(32).toString("base64url");
  const identifier = `${kind}:${email.toLowerCase()}`;
  await prisma.verification.deleteMany({ where: { identifier } });
  await prisma.verification.create({
    data: { identifier, value: sha(token), expiresAt: new Date(Date.now() + ttlSeconds * 1000) },
  });
  return token;
}

/** Consumes a token (single use). Returns the email, or null if unknown/expired. */
export async function consumeToken(kind: TokenKind, token: string): Promise<string | null> {
  if (!prisma || !token) return null;
  const row = await prisma.verification.findFirst({
    where: { value: sha(token), identifier: { startsWith: `${kind}:` } },
  });
  if (!row) return null;
  await prisma.verification.delete({ where: { id: row.id } }).catch(() => {});
  if (row.expiresAt < new Date()) return null;
  return row.identifier.slice(kind.length + 1);
}

export const siteLink = (path: string, params: Record<string, string>) =>
  `${getSiteUrl()}${path}?${new URLSearchParams(params).toString()}`;
