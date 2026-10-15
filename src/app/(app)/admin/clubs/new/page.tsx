import type { Metadata } from "next";
import Link from "next/link";
import { CreateClubForm } from "@/components/CreateClubForm/CreateClubForm";
import { createClub } from "@/server/actions/clubs";
import { requireAdmin } from "@/server/session";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Create club" };

export default async function NewClubPage() {
  await requireAdmin();

  return (
    <>
      <Link href="/admin/clubs" className={styles.back}>
        Back to clubs
      </Link>
      <h1 className={styles.title}>Create club</h1>
      <CreateClubForm action={createClub} />
    </>
  );
}
