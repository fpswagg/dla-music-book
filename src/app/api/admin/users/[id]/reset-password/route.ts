import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (isMockMode()) {
    console.log("[Mock] Reset password for:", id);
    return NextResponse.json({ ok: true, mock: true });
  }

  if (!prisma) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const profile = await prisma.userProfile.findUnique({ where: { id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 503 });
  }

  const { data: authUser, error: getErr } = await admin.auth.admin.getUserById(
    profile.supabaseUserId,
  );
  if (getErr || !authUser.user?.email) {
    return NextResponse.json({ error: "Could not load auth user email" }, { status: 400 });
  }

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: authUser.user.email,
  });

  if (linkErr) {
    return NextResponse.json({ error: linkErr.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    /** Present when Supabase returns a recovery action URL (do not expose to client in production without care). */
    actionLink: linkData.properties?.action_link ?? null,
  });
}
