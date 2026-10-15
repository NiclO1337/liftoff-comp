// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAccount } from "@/server/accounts";

const context = vi.hoisted(() => ({
  internalAdapter: {
    findUserByEmail: vi.fn(),
    createUser: vi.fn(),
    linkAccount: vi.fn(),
  },
  password: {
    hash: vi.fn(),
    config: { minPasswordLength: 8, maxPasswordLength: 128 },
  },
}));

vi.mock("@/server/auth", () => ({
  auth: { $context: Promise.resolve(context) },
}));

describe("createAccount", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    context.internalAdapter.findUserByEmail.mockResolvedValue(null);
    context.internalAdapter.createUser.mockResolvedValue({ id: "user-1" });
    context.password.hash.mockResolvedValue("hashed");
  });

  it("creates a coach in a club with a hashed credential account", async () => {
    const result = await createAccount({
      name: "Coach",
      email: "  Coach@Example.com ",
      password: "password123",
      role: "COACH",
      clubId: "club-1",
    });

    expect(result).toEqual({ ok: true, userId: "user-1" });
    expect(context.internalAdapter.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "coach@example.com",
        role: "COACH",
        clubId: "club-1",
      }),
      { method: "email-password" },
    );
    expect(context.internalAdapter.linkAccount).toHaveBeenCalledWith({
      userId: "user-1",
      providerId: "credential",
      accountId: "user-1",
      password: "hashed",
    });
  });

  it("creates an admin without a club", async () => {
    await createAccount({
      name: "Admin",
      email: "admin@example.com",
      password: "password123",
      role: "ADMIN",
    });

    expect(context.internalAdapter.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: "ADMIN", clubId: null }),
      expect.anything(),
    );
  });

  it.each([
    ["too short", "short"],
    ["too long", "x".repeat(129)],
  ])("refuses a password that is %s", async (_case, password) => {
    const result = await createAccount({
      name: "Admin",
      email: "admin@example.com",
      password,
      role: "ADMIN",
    });

    expect(result).toEqual({
      ok: false,
      error: "Password must be 8-128 characters",
    });
    expect(context.internalAdapter.createUser).not.toHaveBeenCalled();
  });

  it("refuses an email that is already in use", async () => {
    context.internalAdapter.findUserByEmail.mockResolvedValue({
      user: { id: "user-0" },
    });

    const result = await createAccount({
      name: "Admin",
      email: "admin@example.com",
      password: "password123",
      role: "ADMIN",
    });

    expect(result).toEqual({
      ok: false,
      error: "That email is already in use",
    });
    expect(context.internalAdapter.createUser).not.toHaveBeenCalled();
  });
});
