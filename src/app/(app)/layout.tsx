import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell/AppShell";
import { logout } from "@/server/actions/auth";
import { getAppShellData } from "@/server/queries/shell";

// Every page in this group needs a signed-in coach or admin. It checks the
// session, not the club: /admin/clubs must open for an admin who has not
// picked a club yet. Pages that need a club call requireClubAccess().
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const shell = await getAppShellData();
  if (!shell) redirect("/login");

  return (
    <AppShell {...shell} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
