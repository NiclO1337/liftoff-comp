import { cookies } from "next/headers";
import { db } from "@/server/db";
import { ACTIVE_CLUB_COOKIE } from "@/server/session";
import type { AdminAccess } from "@/server/session";

export type ClubSummary = {
  id: string;
  name: string;
  coachCount: number;
  lifterCount: number;
};

// The one query that looks across clubs: an admin's job is to see them all.
// Asking for an `AdminAccess` (which only requireAdmin() returns) keeps it from
// being called with anything less.
export async function getClubList(
  _admin: AdminAccess,
): Promise<{ clubs: ClubSummary[]; activeClubId: string | null }> {
  const rows = await db.club.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: {
        select: { lifters: true, users: { where: { role: "COACH" } } },
      },
    },
  });

  const clubs = rows.map(({ id, name, _count }) => ({
    id,
    name,
    coachCount: _count.users,
    lifterCount: _count.lifters,
  }));

  // A saved club that no longer exists is not active.
  const saved = (await cookies()).get(ACTIVE_CLUB_COOKIE)?.value;
  const activeClubId = clubs.find((club) => club.id === saved)?.id ?? null;

  return { clubs, activeClubId };
}
