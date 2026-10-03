import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { createSetlist, listSetlists } from "@/lib/setlists";
import { parseBody, setlistInput } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ setlists: await listSetlists(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = await parseBody(request, setlistInput);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const created = await createSetlist(user.id, parsed.data);
  return NextResponse.json(created, { status: 201 });
}
