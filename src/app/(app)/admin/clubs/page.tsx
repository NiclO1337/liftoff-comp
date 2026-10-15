import type { Metadata } from "next";
import { ClubsTable } from "@/components/ClubsTable/ClubsTable";
import { getClubList } from "@/server/queries/clubs";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Clubs" };

export default async function ClubsPage() {
  const admin = await requireAdmin();
  const { clubs, activeClubId } = await getClubList(admin);

  return (
    <>
      <h1>Clubs</h1>
      <ClubsTable clubs={clubs} activeClubId={activeClubId} />
    </>
  );
}
