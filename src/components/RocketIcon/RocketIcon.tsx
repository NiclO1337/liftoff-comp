import styles from "./RocketIcon.module.scss";

// Decorative: the app name is always written next to it.
export function RocketIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2c3 2.5 4.5 6 4.5 9.5 0 1.6-.4 3-1 4.5h-7c-.6-1.5-1-2.9-1-4.5C7.5 8 9 4.5 12 2z" />
      <circle cx="12" cy="9" r="1.6" />
      <path d="M8.2 13l-3.2 3.5V20l4-2M15.8 13l3.2 3.5V20l-4-2M10.5 19c0 1.5.7 2.4 1.5 3 .8-.6 1.5-1.5 1.5-3" />
    </svg>
  );
}
