import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { banned } = await request.json();

  const currentUser = await getCurrentUser();
  if (currentUser?.id === id) {
    return NextResponse.json({ error: "Cannot ban yourself" }, { status: 400 });
  }

  if (isMockMode()) {
    console.log("[Mock] Ban user:", id, banned);
    return NextResponse.json({ ok: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const profile = await prisma.userProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 503 });
  }

  const { error } = await admin.auth.admin.updateUserById(profile.supabaseUserId, {
    ban_duration: banned ? "876000h" : "0s",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
