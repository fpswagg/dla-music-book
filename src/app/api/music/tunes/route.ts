import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { createTune, listTunes } from "@/lib/scores";
import { parseBody, tuneInput } from "@/lib/validation";

/** Tunes, for contributors picking where a score goes. */
export async function GET(request: Request) {
  const user = await guard("contributor");
  if (user instanceof NextResponse) return user;
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  return NextResponse.json({ tunes: await listTunes(q) });
}

export async function POST(request: Request) {
  const user = await guard("contributor");
  if (user instanceof NextResponse) return user;
  const parsed = await parseBody(request, tuneInput);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const { songIds, ...data } = parsed.data;
  // Linking hymns to a tune changes the hymn pages: admins only.
  const tune = await createTune(data, user, user.role === "ADMIN" ? songIds : []);
  return NextResponse.json({ tune }, { status: 201 });
}
