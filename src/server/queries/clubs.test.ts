// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClubList } from "@/server/queries/clubs";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  cookieValue: undefined as string | undefined,
}));

vi.mock("@/server/session", () => ({ ACTIVE_CLUB_COOKIE: "active-club" }));
vi.mock("@/server/db", () => ({ db: { club: { findMany: mocks.findMany } } }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "active-club" && mocks.cookieValue !== undefined
        ? { name, value: mocks.cookieValue }
        : undefined,
  }),
}));

const admin = { userId: "admin-1", role: "ADMIN" } as const;

describe("getClubList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.cookieValue = undefined;
    mocks.findMany.mockResolvedValue([
      { id: "club-1", name: "SK Atlas", _count: { users: 3, lifters: 19 } },
      { id: "club-2", name: "IK Vasa", _count: { users: 1, lifters: 8 } },
    ]);
  });

  it("lists the clubs by name with their coach and lifter counts", async () => {
    const { clubs } = await getClubList(admin);

    expect(clubs).toEqual([
      { id: "club-1", name: "SK Atlas", coachCount: 3, lifterCount: 19 },
      { id: "club-2", name: "IK Vasa", coachCount: 1, lifterCount: 8 },
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: { lifters: true, users: { where: { role: "COACH" } } },
        },
      },
    });
  });

  it("returns an empty list when there are no clubs", async () => {
    mocks.findMany.mockResolvedValue([]);

    expect(await getClubList(admin)).toEqual({ clubs: [], activeClubId: null });
  });

  it("marks the saved club as active", async () => {
    mocks.cookieValue = "club-2";

    expect((await getClubList(admin)).activeClubId).toBe("club-2");
  });

  it("has no active club without a saved one", async () => {
    expect((await getClubList(admin)).activeClubId).toBeNull();
  });

  it("has no active club when the saved one no longer exists", async () => {
    mocks.cookieValue = "deleted-club";

    expect((await getClubList(admin)).activeClubId).toBeNull();
  });
});
