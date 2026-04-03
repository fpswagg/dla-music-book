import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isMockMode } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  const { events } = await request.json();
  if (!Array.isArray(events)) {
    return NextResponse.json({ error: "events array required" }, { status: 400 });
  }

  if (isMockMode()) {
    console.log("[Mock Analytics]", events.length, "events received");
    return NextResponse.json({ recorded: events.length });
  }

  if (!prisma) return NextResponse.json({ recorded: 0 });

  const user = await getCurrentUser().catch(() => null);

  await prisma.analyticsEvent.createMany({
    data: events.map((e: { eventType: string; metadata: Record<string, unknown> }) => ({
      eventType: e.eventType,
      metadata: (e.metadata || {}) as Prisma.InputJsonValue,
      userId: user?.id ?? null,
    })),
  });

  return NextResponse.json({ recorded: events.length });
}
