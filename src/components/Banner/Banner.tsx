import type { ReactNode } from "react";
import styles from "./Banner.module.scss";

export type BannerProps = {
  /** `error` interrupts screen readers, `offline` is announced politely. */
  variant: "error" | "offline";
  children: ReactNode;
  /** For example a Retry button. */
  action?: ReactNode;
};

const iconProps = {
  className: styles.icon,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

function ErrorIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v6M12 17h.01" />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01M3 3l18 18" />
    </svg>
  );
}

export function Banner({ variant, children, action }: BannerProps) {
  return (
    <div
      className={`${styles.banner} ${styles[variant]}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {variant === "error" ? <ErrorIcon /> : <OfflineIcon />}
      <div className={styles.message}>{children}</div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
