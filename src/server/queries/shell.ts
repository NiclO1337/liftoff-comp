import { cookies } from "next/headers";
import { db } from "@/server/db";
import { ACTIVE_CLUB_COOKIE, getSession } from "@/server/session";

export type AppShellData = {
  email: string;
  role: "ADMIN" | "COACH";
  /** The coach's club, or the admin's active club. `null` for an admin who has not picked one. */
  clubName: string | null;
};

// What the top bar shows. `null` means nobody who may use the app is signed in.
// Unlike requireClubAccess() this never redirects: an admin with no active club
// still needs the shell, to reach the club list.
export async function getAppShellData(): Promise<AppShellData | null> {
  const session = await getSession();
  if (!session || session.role === "LIFTER") return null;

  const clubId =
    session.role === "COACH"
      ? session.clubId
      : (await cookies()).get(ACTIVE_CLUB_COOKIE)?.value;

  const club = clubId
    ? await db.club.findUnique({
        where: { id: clubId },
        select: { name: true },
      })
    : null;

  return {
    email: session.email,
    role: session.role,
    clubName: club?.name ?? null,
  };
}
