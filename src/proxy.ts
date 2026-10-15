import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic only: it checks that a session cookie exists, not that it is
// valid, so a visitor without one never sees a protected page flash. The real
// check is requireClubAccess() in every page, query and Server Action.
//
// It must never redirect *away* from /login: a stale cookie would then loop
// between /login and the protected page. The login page checks the real session.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except the login page, the auth API and Next's own files.
  matcher: ["/((?!login(?:/|$)|api(?:/|$)|_next/|favicon\\.ico$).*)"],
};
