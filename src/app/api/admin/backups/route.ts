import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createBackup, listBackups } from "@/lib/backup/manager";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const backups = await listBackups();
  return NextResponse.json(backups);
}

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await createBackup();
  if (!result) return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  return NextResponse.json(result);
}
