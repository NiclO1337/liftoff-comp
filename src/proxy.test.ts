// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "@/proxy";

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

// Next turns the matcher into a regular expression anchored to the whole path.
const matcher = new RegExp(`^${config.matcher[0]}$`);

describe("proxy", () => {
  it("sends a visitor without a session cookie to the login page", () => {
    const response = proxy(request("/competitions"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login",
    );
  });

  it("lets a visitor with a session cookie through", () => {
    const response = proxy(
      request("/competitions", "better-auth.session_token=abc.def"),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("lets a visitor with the secure cookie name through", () => {
    const response = proxy(
      request("/", "__Secure-better-auth.session_token=abc.def"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("does not trust an unrelated cookie", () => {
    const response = proxy(request("/", "theme=light"));

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login",
    );
  });
});

describe("proxy matcher", () => {
  it.each([
    "/",
    "/competitions",
    "/competitions/c1/groups/g1",
    "/admin/clubs",
    "/members",
    "/login-help",
  ])("runs on %s", (path) => {
    expect(matcher.test(path)).toBe(true);
  });

  it.each([
    "/login",
    "/api/auth/sign-in/email",
    "/_next/static/chunks/app.js",
    "/_next/image",
    "/favicon.ico",
  ])("skips %s", (path) => {
    expect(matcher.test(path)).toBe(false);
  });
});
