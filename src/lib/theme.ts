export const THEME_STORAGE_KEY = "theme";

export type Theme = "dark" | "light";

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
