// Sets the theme before the first paint: ?theme= first, then the visitor's saved choice (bp-theme), then the system.
(() => {
  let theme = new URLSearchParams(location.search).get("theme");
  try { if (theme !== "dark" && theme !== "light") theme = localStorage.getItem("bp-theme"); } catch (error) { console.warn("theme: localStorage unavailable", error); }
  if (theme !== "dark" && theme !== "light") theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
})();
