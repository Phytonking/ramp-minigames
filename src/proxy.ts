import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

const studioMiddleware = auth.middleware({
  loginUrl: "/login",
});

export default function proxy(request: NextRequest) {
  // Studio routes require operator session
  if (request.nextUrl.pathname.startsWith("/studio")) {
    return studioMiddleware(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/studio/:path*"],
};
