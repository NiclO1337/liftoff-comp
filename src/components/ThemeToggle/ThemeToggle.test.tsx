import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY, themeScript } from "@/lib/theme";
import { ThemeToggle } from "./ThemeToggle";

const getToggle = () => screen.getByRole("button", { name: "Light mode" });

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => vi.restoreAllMocks());

  it("is off in the dark theme", () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);

    expect(getToggle()).toHaveAttribute("aria-pressed", "false");
  });

  it("is on when the page starts in the light theme", () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeToggle />);

    expect(getToggle()).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to light, and back to dark", async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);

    await user.click(getToggle());
    expect(getToggle()).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.dataset.theme).toBe("light");

    await user.click(getToggle());
    expect(getToggle()).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("keeps the choice for the next visit", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(getToggle());
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    // A new page load: the script in <head> reads what the toggle saved.
    delete document.documentElement.dataset.theme;
    new Function(themeScript)();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("still switches when storage is blocked", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<ThemeToggle />);

    await user.click(getToggle());

    expect(getToggle()).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("keeps two toggles on the page in step", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ThemeToggle />
        <ThemeToggle />
      </>,
    );
    const [first, second] = screen.getAllByRole("button", {
      name: "Light mode",
    });

    await user.click(first);

    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(second).toHaveAttribute("aria-pressed", "true");
  });
});
