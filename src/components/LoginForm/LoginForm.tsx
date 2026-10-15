"use client";

import { useActionState, useState } from "react";
import { Banner } from "@/components/Banner/Banner";
import { Button } from "@/components/Button/Button";
import { Field } from "@/components/Field/Field";
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
  const [showPassword, setShowPassword] = useState(false);

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
      <Field
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        required
        action={
          <Button
            variant="secondary"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </Button>
        }
      />
      {/* Disabled while the request runs, so a double tap on a slow network sends it once. */}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
