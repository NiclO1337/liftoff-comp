import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  isLightTheme,
  subscribeToTheme,
  themeScript,
} from "@/lib/theme";

function runThemeScript() {
  new Function(themeScript)();
  return document.documentElement.dataset.theme;
}

describe("themeScript", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => vi.restoreAllMocks());

  it("defaults to dark on a first visit", () => {
    expect(runThemeScript()).toBe("dark");
  });

  it("ignores the device setting", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );

    expect(runThemeScript()).toBe("dark");
  });

  it("uses a saved light choice", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");

    expect(runThemeScript()).toBe("light");
  });

  it("falls back to dark for an unknown saved value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "purple");

    expect(runThemeScript()).toBe("dark");
  });

  it("falls back to dark when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(runThemeScript()).toBe("dark");
  });
});

describe("theme helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("reads the theme from <html>", () => {
    expect(isLightTheme()).toBe(false);

    document.documentElement.dataset.theme = "light";
    expect(isLightTheme()).toBe(true);
  });

  it("applyTheme sets the theme and saves it", () => {
    applyTheme("light");

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("subscribeToTheme reports changes until it is unsubscribed", async () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeToTheme(onChange);

    applyTheme("light");
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

    unsubscribe();
    applyTheme("dark");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
