import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-helpers";
import { appendSetlistItem, ownsSetlist } from "@/lib/setlists";
import { parseBody } from "@/lib/validation";

const itemInput = z.object({ songId: z.string().min(1), label: z.string().trim().max(80).nullable().optional() });

/** Append a hymn at the end of a programme ("Add to programme" on a hymn page). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await ownsSetlist(id, user.id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = await parseBody(request, itemInput);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  await appendSetlistItem(id, parsed.data);
  return NextResponse.json({ ok: true }, { status: 201 });
}
