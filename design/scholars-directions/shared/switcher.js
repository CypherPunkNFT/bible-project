// A small floating A · B · C · D switch on each Scholars direction, so the owner can move between them directly.
(() => {
  const DIRECTIONS = [["A", "foundations", "Foundations"], ["B", "two-thousand-years", "Two thousand years"], ["C", "digs-and-desks", "Digs and desks"], ["D", "the-index", "The index"], ["E", "scholars", "Scholars (combined)"]];
  const here = location.pathname.split("/").filter(Boolean).at(-1);
  const style = document.createElement("style");
  style.textContent = `
    .dir-switch { position: fixed; left: 50%; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); z-index: 30; transform: translateX(-50%);
      display: flex; gap: 2px; padding: 4px; border: 1px solid var(--line); border-radius: 999px;
      background: color-mix(in srgb, var(--surface) 88%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 28px -10px rgb(0 0 0 / 35%); font: 600 .78rem var(--sans); }
    .dir-switch a { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 30px; padding: 0 10px; border-radius: 999px; color: var(--muted); transition: background .15s, color .15s; }
    .dir-switch a:hover { background: var(--surface-2); color: var(--ink); }
    .dir-switch a[aria-current="page"] { background: var(--ink); color: var(--page); }
    .dir-switch a span { display: none; margin-left: 6px; font-weight: 500; }
    .dir-switch a[aria-current="page"] span { display: inline; }
    .dir-switch a { white-space: nowrap; }
    @media (max-width: 520px) { .dir-switch a[aria-current="page"] span { display: none; } }
    .dir-switch a:focus, .dir-switch a:focus-visible { outline: none; }`;
  document.head.append(style);
  const nav = document.createElement("nav");
  nav.className = "dir-switch";
  nav.setAttribute("aria-label", "Directions");
  nav.innerHTML = DIRECTIONS.map(([letter, folder, title]) =>
    `<a href="../${folder}/" title="${letter} · ${title}"${folder === here ? ' aria-current="page"' : ""}>${letter}<span>${title}</span></a>`).join("");
  document.body.append(nav);
})();
