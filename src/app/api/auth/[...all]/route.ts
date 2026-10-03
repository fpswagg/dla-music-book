import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

async function handle(request: Request) {
  const auth = getAuth();
  if (!auth) return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 503 });
  return auth.handler(request);
}

export { handle as GET, handle as POST };
