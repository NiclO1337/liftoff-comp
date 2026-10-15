// @vitest-environment node
import { APIError } from "better-auth/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { login, logout } from "@/server/actions/auth";

const mocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/server/auth", () => ({
  auth: { api: { signInEmail: mocks.signInEmail, signOut: mocks.signOut } },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-test": "1" }),
}));
// Like Next's redirect(), this never returns.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

function fill(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const WRONG = {
  ok: false,
  error: "Wrong email or password",
};

describe("login", () => {
  beforeEach(() => vi.resetAllMocks());

  it("signs in and sends the user to the start page", async () => {
    mocks.signInEmail.mockResolvedValue({});

    await expect(
      login(null, fill({ email: "anna@sk-atlas.se", password: "secret123" })),
    ).rejects.toThrow("redirect:/");

    expect(mocks.signInEmail).toHaveBeenCalledWith({
      body: { email: "anna@sk-atlas.se", password: "secret123" },
      headers: expect.any(Headers),
    });
  });

  it("gives one message for a wrong email or password, and keeps the email", async () => {
    mocks.signInEmail.mockRejectedValue(
      new APIError("UNAUTHORIZED", { message: "Invalid email or password" }),
    );

    const result = await login(
      null,
      fill({ email: "anna@sk-atlas.se", password: "wrong" }),
    );

    expect(result).toEqual({ ...WRONG, email: "anna@sk-atlas.se" });
  });

  it.each([
    ["an empty password", { email: "anna@sk-atlas.se", password: "" }],
    ["a missing password", { email: "anna@sk-atlas.se" }],
    ["a malformed email", { email: "not-an-email", password: "secret123" }],
    ["a missing email", { password: "secret123" }],
  ])("refuses %s without asking Better Auth", async (_case, values) => {
    const result = await login(null, fill(values));

    expect(result).toMatchObject(WRONG);
    expect(mocks.signInEmail).not.toHaveBeenCalled();
  });

  it("keeps whatever email was typed, even a malformed one", async () => {
    const result = await login(
      null,
      fill({ email: "not-an-email", password: "secret123" }),
    );

    expect(result.email).toBe("not-an-email");
  });

  it("tells the user to wait after too many attempts", async () => {
    mocks.signInEmail.mockRejectedValue(
      new APIError("TOO_MANY_REQUESTS", { message: "Too many requests" }),
    );

    const result = await login(
      null,
      fill({ email: "anna@sk-atlas.se", password: "secret123" }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Too many attempts. Try again in a minute.",
      email: "anna@sk-atlas.se",
    });
  });

  it("does not hide a real failure behind the wrong-password message", async () => {
    mocks.signInEmail.mockRejectedValue(new Error("database is down"));

    await expect(
      login(null, fill({ email: "anna@sk-atlas.se", password: "secret123" })),
    ).rejects.toThrow("database is down");
  });
});

describe("logout", () => {
  beforeEach(() => vi.resetAllMocks());

  it("ends the session and goes to the login page", async () => {
    mocks.signOut.mockResolvedValue({});

    await expect(logout()).rejects.toThrow("redirect:/login");

    expect(mocks.signOut).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });
});
