import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// The admin's active club, set by the club switcher (context doc §7).
export const ACTIVE_CLUB_COOKIE = "active-club";

export type Session = {
  userId: string;
  role: Role;
  clubId: string | null;
};

export type ClubAccess = {
  userId: string;
  clubId: string;
  role: "ADMIN" | "COACH";
};

export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  // The column is never null; a missing role is treated as no access.
  if (!session?.user.role) return null;

  const { id, role, clubId } = session.user;
  return { userId: id, role, clubId: clubId ?? null };
}

// Every query and Server Action starts here. The club comes from the session
// (coach) or from the active-club cookie checked against the database (admin).
// It is never taken from the request.
export async function requireClubAccess(): Promise<ClubAccess> {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "COACH") {
    if (!session.clubId) redirect("/login");
    return { userId: session.userId, clubId: session.clubId, role: "COACH" };
  }

  // Lifter accounts come later.
  if (session.role !== "ADMIN") redirect("/login");

  const activeClubId = (await cookies()).get(ACTIVE_CLUB_COOKIE)?.value;
  if (!activeClubId) redirect("/admin/clubs");

  const club = await db.club.findUnique({
    where: { id: activeClubId },
    select: { id: true },
  });
  if (!club) redirect("/admin/clubs");

  return { userId: session.userId, clubId: club.id, role: "ADMIN" };
}
