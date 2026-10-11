import { NextResponse, type NextRequest } from "next/server";

/** Cheap guard: no session cookie → sign-in page. Layouts do the real (database) check. */
export function proxy(request: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.next(); // demo mode: everyone is the demo admin

  const has = request.cookies.has("authjs.session-token") || request.cookies.has("__Secure-authjs.session-token");
  if (!has) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    url.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
