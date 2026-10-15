import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/Button/Button";
import { NavMenu } from "@/components/NavMenu/NavMenu";
import type { NavItem } from "@/components/NavMenu/NavMenu";
import { RocketIcon } from "@/components/RocketIcon/RocketIcon";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import styles from "./AppShell.module.scss";

type AppShellProps = {
  email: string;
  role: "ADMIN" | "COACH";
  /** The coach's club, or the admin's active club (none yet: `null`). */
  clubName: string | null;
  /** The logout Server Action, passed in by the layout. */
  logoutAction: () => Promise<void>;
  children: ReactNode;
};

const ROLE_LABEL = { ADMIN: "Admin", COACH: "Coach" } as const;

// The Lifters link is added when the lifter pages exist (S2).
function navItemsFor(role: AppShellProps["role"]): NavItem[] {
  return [
    { href: "/competitions", label: "Competitions" },
    { href: "/members", label: "Members" },
    ...(role === "ADMIN" ? [{ href: "/admin/clubs", label: "Clubs" }] : []),
  ];
}

export function AppShell({
  email,
  role,
  clubName,
  logoutAction,
  children,
}: AppShellProps) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        Skip to main content
      </a>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link href="/" className={styles.brand}>
            <RocketIcon />
            LiftOff Comp
          </Link>
          {clubName && <p className={styles.club}>{clubName}</p>}
          <NavMenu items={navItemsFor(role)}>
            <div className={styles.account}>
              <p className={styles.who}>
                <span className={styles.email}>{email}</span>
                <span className={styles.role}>
                  {ROLE_LABEL[role]}
                  {clubName && ` · ${clubName}`}
                </span>
              </p>
              <ThemeToggle />
              <form action={logoutAction}>
                <Button type="submit" variant="secondary">
                  Log out
                </Button>
              </form>
            </div>
          </NavMenu>
        </div>
      </header>
      {/* tabIndex lets the skip link move keyboard focus here. */}
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        LiftOff Comp · Know when you&apos;re up.
      </footer>
    </div>
  );
}
