import "server-only";
import { NextResponse } from "next/server";
import { requireAdmin, requireContributor, type AppUser } from "./auth-helpers";
import { prisma } from "./prisma";

/** Route helpers: `const g = await guard("admin"); if (g instanceof NextResponse) return g;` */
export async function guard(level: "admin" | "contributor"): Promise<AppUser | NextResponse> {
  try {
    const user = level === "admin" ? await requireAdmin() : await requireContributor();
    if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    return user;
  } catch (e) {
    const forbidden = e instanceof Error && e.message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "Forbidden" : "Unauthorized" }, { status: forbidden ? 403 : 401 });
  }
}

export const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });
