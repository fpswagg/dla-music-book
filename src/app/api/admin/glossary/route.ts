import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { addGlossaryTerm, listGlossary } from "@/lib/recordings";
import { glossaryInput, parseBody } from "@/lib/validation";

/** Duala words given to the transcription and its correction. */
export async function GET() {
  const admin = await guard("admin");
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ terms: await listGlossary() });
}

export async function POST(request: Request) {
  const admin = await guard("admin");
  if (admin instanceof NextResponse) return admin;
  const parsed = await parseBody(request, glossaryInput);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  return NextResponse.json({ term: await addGlossaryTerm(parsed.data.term, parsed.data.note) }, { status: 201 });
}
