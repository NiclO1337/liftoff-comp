import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm/LoginForm";
import { RocketIcon } from "@/components/RocketIcon/RocketIcon";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { login } from "@/server/actions/auth";
import { getSession } from "@/server/session";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  // The real check: the proxy only looks for a cookie. Lifter accounts have no
  // pages yet, so they stay here instead of bouncing back and forth.
  const session = await getSession();
  if (session && session.role !== "LIFTER") redirect("/");

  return (
    <main className={styles.page}>
      <div className={styles.theme}>
        <ThemeToggle />
      </div>
      <header className={styles.brand}>
        <RocketIcon />
        <h1 className={styles.name}>LiftOff Comp</h1>
        <p className={styles.tagline}>Know when you&apos;re up.</p>
      </header>
      <LoginForm action={login} />
      <p className={styles.note}>
        Accounts are created by your coach or an admin.
      </p>
    </main>
  );
}
