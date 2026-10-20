import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { getTuneProposals } from "@/lib/tune-suggestions";
import { createTune, linkSongs } from "@/lib/scores";
import { parseBody, tuneProposalInput } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await guard("admin");
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ proposals: await getTuneProposals() });
}

/** Accept a proposal: create the tune (or use the existing one) and link the chosen hymns. */
export async function POST(request: Request) {
  const admin = await guard("admin");
  if (admin instanceof NextResponse) return admin;
  const parsed = await parseBody(request, tuneProposalInput);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const { name, songIds, existingTuneId } = parsed.data;
  if (existingTuneId) {
    if (!(await prisma!.tune.findUnique({ where: { id: existingTuneId }, select: { id: true } }))) return jsonError("Unknown tune", 404);
    await linkSongs(existingTuneId, songIds);
    return NextResponse.json({ tuneId: existingTuneId });
  }
  const tune = await createTune({ name }, admin, songIds);
  return NextResponse.json({ tuneId: tune.id }, { status: 201 });
}
