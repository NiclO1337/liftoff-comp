import { useId } from "react";
import type { ComponentProps } from "react";
import styles from "./Field.module.scss";

export type FieldProps = Omit<
  ComponentProps<"input">,
  "id" | "className" | "aria-invalid" | "aria-describedby"
> & {
  label: string;
  /** Help text under the input, read out with the field. */
  hint?: string;
  /** Shown under the input and marks it invalid. */
  error?: string;
};

// A label, an input, and the hint and error text wired to the input. A form
// with its own error messages should set `noValidate`, or the browser's
// built-in validation (from `required`) pops up first.
export function Field({
  label,
  hint,
  error,
  required,
  ...inputProps
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        {...inputProps}
        id={id}
        className={styles.input}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          <svg
            className={styles.errorIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 7v6M12 17h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
