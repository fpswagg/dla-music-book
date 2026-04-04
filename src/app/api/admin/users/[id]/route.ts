import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { role } = await request.json();

  if (role !== "USER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const currentUser = await getCurrentUser();
  if (currentUser?.id === id) {
    return NextResponse.json({ error: "Cannot change own role" }, { status: 400 });
  }

  if (isMockMode()) {
    console.log("[Mock] Update user role:", id, role);
    return NextResponse.json({ id, role });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const user = await prisma.userProfile.update({
    where: { id },
    data: { role },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const currentUser = await getCurrentUser();
  if (currentUser?.id === id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  if (isMockMode()) {
    console.log("[Mock] Delete user:", id);
    return NextResponse.json({ ok: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const profile = await prisma.userProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabaseUid = profile.supabaseUserId;

  await prisma.userProfile.delete({ where: { id } });

  const admin = createSupabaseAdminClient();
  if (admin) {
    const { error } = await admin.auth.admin.deleteUser(supabaseUid);
    if (error) {
      console.error("[admin] delete auth user:", error.message);
    }
  }

  return NextResponse.json({ ok: true });
}
