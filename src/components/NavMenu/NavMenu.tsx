"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import styles from "./NavMenu.module.scss";

export type NavItem = { href: string; label: string };

type NavMenuProps = {
  items: NavItem[];
  /** Shown after the links in the same panel, such as the signed-in user. */
  children?: ReactNode;
};

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// On a phone the links sit behind a Menu button. From the tablet breakpoint the
// panel is always open, as a row in the top bar (the CSS hides the button).
export function NavMenu({ items, children }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key !== "Escape" || !open) return;
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <nav aria-label="Main" className={styles.nav} onKeyDown={closeOnEscape}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
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
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Menu
      </button>
      <div
        id={panelId}
        className={`${styles.panel} ${open ? styles.open : ""}`}
      >
        <ul className={styles.list}>
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={styles.link}
                aria-current={isCurrent(pathname, href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        {children}
      </div>
    </nav>
  );
}
