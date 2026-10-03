import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { deleteSetlist, getSetlist, ownsSetlist, updateSetlist } from "@/lib/setlists";
import { parseBody, setlistInput } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function guard(ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { id } = await ctx.params;
  if (!(await ownsSetlist(id, user.id))) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { id };
}

export async function GET(_req: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if (g.error) return g.error;
  return NextResponse.json(await getSetlist({ id: g.id }));
}

export async function PUT(request: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if (g.error) return g.error;
  const parsed = await parseBody(request, setlistInput.partial());
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  await updateSetlist(g.id, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const g = await guard(ctx);
  if (g.error) return g.error;
  await deleteSetlist(g.id);
  return NextResponse.json({ ok: true });
}
