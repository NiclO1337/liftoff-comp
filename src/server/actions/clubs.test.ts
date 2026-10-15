// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClub } from "@/server/actions/clubs";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createClub: vi.fn(),
  deleteClub: vi.fn(),
  createAccount: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/server/session", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/server/db", () => ({
  db: { club: { create: mocks.createClub, delete: mocks.deleteClub } },
}));
vi.mock("@/server/accounts", () => ({ createAccount: mocks.createAccount }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
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

const coach = {
  coachName: "Eva Karlsson",
  coachEmail: "eva@hammar.se",
  coachPassword: "secret123",
};

describe("createClub", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAdmin.mockResolvedValue({ userId: "admin-1", role: "ADMIN" });
    mocks.createClub.mockResolvedValue({ id: "club-9" });
    mocks.createAccount.mockResolvedValue({ ok: true, userId: "user-9" });
  });

  it("stops before doing anything when the user is not an admin", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("redirect:/"));

    await expect(createClub(null, fill({ name: "Hammar AK" }))).rejects.toThrow(
      "redirect:/",
    );

    expect(mocks.createClub).not.toHaveBeenCalled();
    expect(mocks.createAccount).not.toHaveBeenCalled();
  });

  it("creates a club without a coach, then goes to the club list", async () => {
    await expect(
      createClub(null, fill({ name: "  Hammar AK " })),
    ).rejects.toThrow("redirect:/admin/clubs");

    expect(mocks.createClub).toHaveBeenCalledWith({
      data: { name: "Hammar AK" },
      select: { id: true },
    });
    expect(mocks.createAccount).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/clubs");
  });

  it("creates the first coach in the new club", async () => {
    await expect(
      createClub(null, fill({ name: "Hammar AK", ...coach })),
    ).rejects.toThrow("redirect:/admin/clubs");

    expect(mocks.createAccount).toHaveBeenCalledWith({
      name: "Eva Karlsson",
      email: "eva@hammar.se",
      password: "secret123",
      role: "COACH",
      clubId: "club-9",
    });
    expect(mocks.deleteClub).not.toHaveBeenCalled();
  });

  it("uses the club id it created, never one sent by the browser", async () => {
    await expect(
      createClub(
        null,
        fill({ name: "Hammar AK", ...coach, clubId: "someone-elses-club" }),
      ),
    ).rejects.toThrow("redirect");

    expect(mocks.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({ clubId: "club-9" }),
    );
  });

  it("returns field errors and the typed values, and creates nothing", async () => {
    const result = await createClub(
      null,
      fill({ name: "", coachName: "Eva", coachEmail: "eva@hammar.se" }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Fix 2 fields to create the club",
      fieldErrors: {
        name: "Enter the club name",
        coachPassword: "Enter a password",
      },
      values: { name: "", coachName: "Eva", coachEmail: "eva@hammar.se" },
    });
    expect(mocks.createClub).not.toHaveBeenCalled();
  });

  it("says 'field' for a single problem", async () => {
    const result = await createClub(null, fill({ name: "" }));

    expect(result.error).toBe("Fix 1 field to create the club");
  });

  it("never sends the password back", async () => {
    const result = await createClub(null, fill({ name: "", ...coach }));

    expect(JSON.stringify(result)).not.toContain("secret123");
  });

  it("removes the club again when the coach's email is taken", async () => {
    mocks.createAccount.mockResolvedValue({
      ok: false,
      error: "That email is already in use",
    });

    const result = await createClub(
      null,
      fill({ name: "Hammar AK", ...coach }),
    );

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { coachEmail: "That email is already in use" },
      values: { name: "Hammar AK", coachEmail: "eva@hammar.se" },
    });
    expect(mocks.deleteClub).toHaveBeenCalledWith({ where: { id: "club-9" } });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("removes the club again when creating the coach fails unexpectedly", async () => {
    mocks.createAccount.mockRejectedValue(new Error("database is down"));

    await expect(
      createClub(null, fill({ name: "Hammar AK", ...coach })),
    ).rejects.toThrow("database is down");

    expect(mocks.deleteClub).toHaveBeenCalledWith({ where: { id: "club-9" } });
  });
});
