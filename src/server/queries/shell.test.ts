// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAppShellData } from "@/server/queries/shell";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findClub: vi.fn(),
  cookieValue: undefined as string | undefined,
}));

vi.mock("@/server/session", () => ({
  ACTIVE_CLUB_COOKIE: "active-club",
  getSession: mocks.getSession,
}));
vi.mock("@/server/db", () => ({
  db: { club: { findUnique: mocks.findClub } },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "active-club" && mocks.cookieValue !== undefined
        ? { name, value: mocks.cookieValue }
        : undefined,
  }),
}));

function signIn(session: { role: string; clubId: string | null } | null) {
  mocks.getSession.mockResolvedValue(
    session && { userId: "user-1", email: "anna@sk-atlas.se", ...session },
  );
}

describe("getAppShellData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.cookieValue = undefined;
    mocks.findClub.mockImplementation(async ({ where }) =>
      where.id === "club-1"
        ? { name: "SK Atlas" }
        : where.id === "club-2"
          ? { name: "IK Vasa" }
          : null,
    );
  });

  it("returns null without a session", async () => {
    signIn(null);

    expect(await getAppShellData()).toBeNull();
  });

  it("returns null for a lifter, who has no pages yet", async () => {
    signIn({ role: "LIFTER", clubId: "club-1" });

    expect(await getAppShellData()).toBeNull();
  });

  it("gives a coach their own club", async () => {
    signIn({ role: "COACH", clubId: "club-1" });

    expect(await getAppShellData()).toEqual({
      email: "anna@sk-atlas.se",
      role: "COACH",
      clubName: "SK Atlas",
    });
    expect(mocks.findClub).toHaveBeenCalledWith({
      where: { id: "club-1" },
      select: { name: true },
    });
  });

  it("ignores the active-club cookie for a coach", async () => {
    signIn({ role: "COACH", clubId: "club-1" });
    mocks.cookieValue = "club-2";

    expect((await getAppShellData())?.clubName).toBe("SK Atlas");
  });

  it("gives an admin the active club from the cookie", async () => {
    signIn({ role: "ADMIN", clubId: null });
    mocks.cookieValue = "club-2";

    expect(await getAppShellData()).toEqual({
      email: "anna@sk-atlas.se",
      role: "ADMIN",
      clubName: "IK Vasa",
    });
  });

  it("shows no club for an admin without an active club", async () => {
    signIn({ role: "ADMIN", clubId: null });

    expect((await getAppShellData())?.clubName).toBeNull();
    expect(mocks.findClub).not.toHaveBeenCalled();
  });

  it("shows no club when the admin's saved club no longer exists", async () => {
    signIn({ role: "ADMIN", clubId: null });
    mocks.cookieValue = "deleted-club";

    expect((await getAppShellData())?.clubName).toBeNull();
  });
});
