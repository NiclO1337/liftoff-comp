// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTIVE_CLUB_COOKIE,
  getSession,
  requireClubAccess,
} from "@/server/session";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findClub: vi.fn(),
  cookieValue: undefined as string | undefined,
}));

vi.mock("@/server/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/server/db", () => ({
  db: { club: { findUnique: mocks.findClub } },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: (name: string) =>
      name === ACTIVE_CLUB_COOKIE && mocks.cookieValue !== undefined
        ? { name, value: mocks.cookieValue }
        : undefined,
  }),
}));
// Like Next's redirect(), this never returns.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

function signIn(user: { role?: string; clubId?: string | null } | null) {
  mocks.getSession.mockResolvedValue(
    user && { user: { id: "user-1", email: "anna@sk-atlas.se", ...user } },
  );
}

describe("getSession", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns null without a session", async () => {
    signIn(null);

    expect(await getSession()).toBeNull();
  });

  it("returns null for a user without a role", async () => {
    signIn({ clubId: "club-1" });

    expect(await getSession()).toBeNull();
  });

  it("returns the user id, email, role and club", async () => {
    signIn({ role: "COACH", clubId: "club-1" });

    expect(await getSession()).toEqual({
      userId: "user-1",
      email: "anna@sk-atlas.se",
      role: "COACH",
      clubId: "club-1",
    });
  });
});

describe("requireClubAccess", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.cookieValue = undefined;
    mocks.findClub.mockImplementation(async ({ where }) =>
      ["club-1", "club-2"].includes(where.id) ? { id: where.id } : null,
    );
  });

  it("sends a visitor without a session to the login page", async () => {
    signIn(null);

    await expect(requireClubAccess()).rejects.toThrow("redirect:/login");
  });

  it("gives a coach their own club without touching the database", async () => {
    signIn({ role: "COACH", clubId: "club-1" });

    expect(await requireClubAccess()).toEqual({
      userId: "user-1",
      clubId: "club-1",
      role: "COACH",
    });
    expect(mocks.findClub).not.toHaveBeenCalled();
  });

  it("ignores the active-club cookie for a coach", async () => {
    signIn({ role: "COACH", clubId: "club-1" });
    mocks.cookieValue = "club-2";

    const access = await requireClubAccess();

    expect(access.clubId).toBe("club-1");
    expect(mocks.findClub).not.toHaveBeenCalled();
  });

  it("sends a coach without a club to the login page", async () => {
    signIn({ role: "COACH", clubId: null });

    await expect(requireClubAccess()).rejects.toThrow("redirect:/login");
  });

  it("sends a lifter to the login page", async () => {
    signIn({ role: "LIFTER", clubId: "club-1" });

    await expect(requireClubAccess()).rejects.toThrow("redirect:/login");
  });

  it.each(["club-1", "club-2"])(
    "gives an admin the active club %s after checking it exists",
    async (clubId) => {
      signIn({ role: "ADMIN", clubId: null });
      mocks.cookieValue = clubId;

      expect(await requireClubAccess()).toEqual({
        userId: "user-1",
        clubId,
        role: "ADMIN",
      });
      expect(mocks.findClub).toHaveBeenCalledWith({
        where: { id: clubId },
        select: { id: true },
      });
    },
  );

  it("sends an admin without an active club to the club list", async () => {
    signIn({ role: "ADMIN", clubId: null });

    await expect(requireClubAccess()).rejects.toThrow("redirect:/admin/clubs");
    expect(mocks.findClub).not.toHaveBeenCalled();
  });

  it("sends an admin with an unknown active club to the club list", async () => {
    signIn({ role: "ADMIN", clubId: null });
    mocks.cookieValue = "deleted-club";

    await expect(requireClubAccess()).rejects.toThrow("redirect:/admin/clubs");
  });
});
