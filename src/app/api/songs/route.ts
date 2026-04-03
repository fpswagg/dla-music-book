import { NextRequest, NextResponse } from "next/server";
import { getSongs } from "@/lib/data-provider";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || undefined;
  const lang = searchParams.get("lang") || undefined;
  const mood = searchParams.get("mood") || undefined;
  const author = searchParams.get("author") || undefined;
  const status = searchParams.get("status") || undefined;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");

  const result = await getSongs({ q, language: lang, mood, author, status, page, limit });
  return NextResponse.json(result);
}
