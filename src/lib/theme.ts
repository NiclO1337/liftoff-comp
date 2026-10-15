export const THEME_STORAGE_KEY = "theme";

export type Theme = "dark" | "light";

export function isLightTheme(): boolean {
  return document.documentElement.dataset.theme === "light";
}

// Switches the theme and remembers the choice (a saved choice wins over the dark default).
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked. The choice then lasts until the page is reloaded.
  }
}

// For useSyncExternalStore: the theme lives in an attribute on <html>.
export function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

// Runs in <head> before the first paint, so the page never flashes the wrong
// theme. Dark is the default on every first visit, whatever the device setting
// is. Only a saved choice wins. localStorage can throw (private windows), so
// that falls back to dark too.
export const themeScript = `(function () {
  var theme = "dark";
  try {
    if (localStorage.getItem("${THEME_STORAGE_KEY}") === "light") theme = "light";
  } catch (error) {}
  document.documentElement.dataset.theme = theme;
})();`;
