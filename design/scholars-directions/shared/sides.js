// The two sides of the Teachers page: "Preachers & writers" (the combined Teachers mock-up) and "Scholars" (this
// mock-up). Sides.html("scholars") returns the switch; each Scholars direction places it at the top of its page.
window.Sides = {
  // links: where each side lives, relative to the calling page (defaults suit a Scholars direction).
  html(current, links = { preachers: "../../authors-directions/teachers/", scholars: "#" }) {
    const sides = [["preachers", "Preachers & writers", links.preachers], ["scholars", "Scholars", links.scholars]];
    return `<nav class="sides" aria-label="Teachers">${sides.map(([key, label, href]) =>
      `<a href="${href}"${key === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
  },
};
(() => {
  const style = document.createElement("style");
  style.textContent = `
    .sides { display: inline-flex; gap: 2px; margin-top: 1.4rem; padding: 3px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); }
    .sides a { padding: .4rem 1rem; border-radius: 999px; font-size: .82rem; color: var(--muted); transition: background .15s, color .15s; }
    .sides a:hover { color: var(--ink); background: var(--surface-2); }
    .sides a[aria-current="page"] { background: var(--ink); color: var(--page); }
    .sides a:focus, .sides a:focus-visible { outline: none; }`;
  document.head.append(style);
})();
