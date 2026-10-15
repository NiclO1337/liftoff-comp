"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, isLightTheme, subscribeToTheme } from "@/lib/theme";
import styles from "./ThemeToggle.module.scss";

// The server cannot know the saved choice, so it renders "off". The browser
// then reads the real theme from <html>, which the script in <head> has set.
const serverSnapshot = () => false;

export function ThemeToggle() {
  const isLight = useSyncExternalStore(
    subscribeToTheme,
    isLightTheme,
    serverSnapshot,
  );

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={isLight}
      aria-label="Light mode"
      onClick={() => applyTheme(isLight ? "dark" : "light")}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
