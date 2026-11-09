"use strict";
(() => {
  let theme;
  try { theme = localStorage.getItem("art-history-theme"); } catch (_) {}
  if (location.protocol === "file:") {
    const requested = new URLSearchParams(location.search).get("theme");
    if (requested === "light" || requested === "dark") {
      theme = requested;
      try { localStorage.setItem("art-history-theme", theme); } catch (_) {}
    }
  }
  if (theme !== "dark" && theme !== "light") theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
})();
