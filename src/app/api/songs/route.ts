import { NextRequest, NextResponse } from "next/server";
import { getSongs } from "@/lib/data-provider";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const isAdmin = (await getCurrentUser())?.role === "ADMIN";
  const result = await getSongs({
    q: searchParams.get("q") || undefined,
    language: searchParams.get("lang") || undefined,
    tag: searchParams.get("tag") || searchParams.get("mood") || undefined,
    author: searchParams.get("author") || undefined,
    hymnal: searchParams.get("hymnal") || undefined,
    status: isAdmin ? searchParams.get("status") || undefined : "FINISHED",
    page: Math.max(1, Number(searchParams.get("page") || "1") || 1),
    limit: Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20") || 20)),
  });
  return NextResponse.json(result);
}
