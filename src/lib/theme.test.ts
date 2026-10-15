import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY, themeScript } from "@/lib/theme";

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
