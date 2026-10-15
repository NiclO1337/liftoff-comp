"use client";

import { useActionState } from "react";
import { Banner } from "@/components/Banner/Banner";
import { Button } from "@/components/Button/Button";
import { Field } from "@/components/Field/Field";
import { PasswordField } from "@/components/PasswordField/PasswordField";
import styles from "./LoginForm.module.scss";

type LoginFormState = { ok: false; error: string; email: string };

type LoginFormProps = {
  /** The login Server Action, passed in by the page. A success redirects. */
  action: (
    previous: LoginFormState | null,
    formData: FormData,
  ) => Promise<LoginFormState>;
};

export function LoginForm({ action }: LoginFormProps) {
  const [failure, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className={styles.form} aria-label="Log in">
      {failure && <Banner variant="error">{failure.error}</Banner>}
      {/* After a failure the email stays and the password is cleared. */}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={failure?.email}
        required
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
      />
      {/* Disabled while the request runs, so a double tap on a slow network sends it once. */}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
