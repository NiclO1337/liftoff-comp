import type { Metadata } from "next";
import { Button } from "@/components/Button/Button";
import { ClubsTable } from "@/components/ClubsTable/ClubsTable";
import { getClubList } from "@/server/queries/clubs";
import { requireAdmin } from "@/server/session";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Clubs" };

export default async function ClubsPage() {
  const admin = await requireAdmin();
  const { clubs, activeClubId } = await getClubList(admin);

  return (
    <>
      <div className={styles.header}>
        <h1>Clubs</h1>
        <Button href="/admin/clubs/new">Create club</Button>
      </div>
      <ClubsTable clubs={clubs} activeClubId={activeClubId} />
    </>
  );
}
