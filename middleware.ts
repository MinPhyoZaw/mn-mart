import { NextRequest, NextResponse } from "next/server";

// The shops collection explicitly returns public cache headers. Every other
// API response is private because it may depend on the current user or role.
const PUBLIC_API_GET_PATHS = new Set(["/api/shops"]);

export function middleware(request: NextRequest) {
  if (
    request.method === "GET" &&
    PUBLIC_API_GET_PATHS.has(request.nextUrl.pathname)
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
