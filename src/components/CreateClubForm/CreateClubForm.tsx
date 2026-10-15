"use client";

import { useActionState, useEffect, useRef } from "react";
import { Banner } from "@/components/Banner/Banner";
import { Button } from "@/components/Button/Button";
import { Field } from "@/components/Field/Field";
import { PasswordField } from "@/components/PasswordField/PasswordField";
import styles from "./CreateClubForm.module.scss";

type CreateClubFormState = {
  ok: false;
  /** The summary at the top, such as "Fix 2 fields to create the club". */
  error: string;
  fieldErrors: Partial<
    Record<"name" | "coachName" | "coachEmail" | "coachPassword", string>
  >;
  /** What was typed, so the form keeps it. The password is never sent back. */
  values: { name: string; coachName: string; coachEmail: string };
};

type CreateClubFormProps = {
  /** The createClub Server Action, passed in by the page. A success redirects. */
  action: (
    previous: CreateClubFormState | null,
    formData: FormData,
  ) => Promise<CreateClubFormState>;
};

export function CreateClubForm({ action }: CreateClubFormProps) {
  const [failure, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed submit, move focus to the first field with an error.
  useEffect(() => {
    if (!failure) return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [failure]);

  const errors = failure?.fieldErrors ?? {};
  const values = failure?.values;

  return (
    // noValidate: the server checks everything and the messages come from there.
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className={styles.form}
      aria-label="Create club"
    >
      {failure && <Banner variant="error">{failure.error}</Banner>}
      <Field
        label="Club name"
        name="name"
        autoComplete="off"
        defaultValue={values?.name}
        error={errors.name}
        required
      />
      <fieldset className={styles.coach}>
        <legend className={styles.legend}>First coach</legend>
        <p className={styles.note}>
          Optional. Saves a step: they can log in right away.
        </p>
        <Field
          label="Name"
          name="coachName"
          autoComplete="off"
          defaultValue={values?.coachName}
          error={errors.coachName}
        />
        <Field
          label="Email"
          name="coachEmail"
          type="email"
          autoComplete="off"
          defaultValue={values?.coachEmail}
          error={errors.coachEmail}
        />
        <PasswordField
          label="Password"
          name="coachPassword"
          autoComplete="new-password"
          hint="At least 8 characters. Tell the coach in person."
          error={errors.coachPassword}
        />
      </fieldset>
      <div className={styles.actions}>
        {/* Disabled while the request runs, so a double tap creates one club. */}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating club…" : "Create club"}
        </Button>
        <Button href="/admin/clubs" variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
}
