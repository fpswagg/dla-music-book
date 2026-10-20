import { NextResponse } from "next/server";
import { guard, jsonError } from "@/lib/api-guard";
import { getSongTuneHelp } from "@/lib/tune-suggestions";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const admin = await guard("admin");
  if (admin instanceof NextResponse) return admin;
  const help = await getSongTuneHelp((await params).id);
  return help ? NextResponse.json(help) : jsonError("Not found", 404);
}
