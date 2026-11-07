// Sets the theme before the first paint, from the visitor's saved choice or their system.
try {
  const saved = localStorage.getItem("bp-theme");
  document.documentElement.dataset.theme = saved === "dark" || saved === "light" ? saved : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
} catch (error) {
  console.warn("theme: localStorage unavailable", error);
}
