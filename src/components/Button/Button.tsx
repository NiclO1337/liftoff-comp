import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Button.module.scss";

type Shared = {
  /** Orange for the main action on a screen, outlined for the rest. */
  variant?: "primary" | "secondary";
  children: ReactNode;
};

type ButtonElementProps = Shared &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    href?: undefined;
  };

type LinkElementProps = Shared &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children"> & {
    href: string;
  };

export type ButtonProps = ButtonElementProps | LinkElementProps;

// A link that looks like a button when it goes somewhere (`href`), a real
// <button> when it does something. A button never submits a form unless it
// says `type="submit"`.
export function Button({
  variant = "primary",
  children,
  ...props
}: ButtonProps) {
  const className = `${styles.button} ${styles[variant]}`;

  if (props.href !== undefined) {
    return (
      <Link {...props} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" {...props} className={className}>
      {children}
    </button>
  );
}
