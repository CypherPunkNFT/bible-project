// The Manuscripts page (/study/manuscripts): the owner's merge (A) and three consolidations of it (B, C, D), chosen with
// ?d=a|b|c|d: the site frame with Study
// selected, then that direction's sections in order. Each section lives in its own file and registers as
// Sections.<key>; one failing section never stops the others.
(() => {
  // A is the owner's merge (the former D); B, C and D are three ways to consolidate it (owner 2026-10-18).
  const DIRECTIONS = {
    a: { letter: "A", name: "Merged", sections: ["landing", "cabinet", "lanes", "books", "closeness", "places", "kinds", "onward", "basis"] },
    b: { letter: "B", name: "Consolidated", sections: ["landing", "lanes", "bookpill", "places", "collection", "onward", "basis"] },
    c: { letter: "C", name: "Witnesses up front", sections: ["landing", "shelf", "places", "lanes", "bookpill", "kinds", "onward", "basis"] },
    d: { letter: "D", name: "One explorer", sections: ["landing", "explore", "onward", "basis"] },
  };
  const params = new URLSearchParams(location.search);
  const d = DIRECTIONS[params.get("d")] ? params.get("d") : "a";
  document.title = `Manuscripts · ${DIRECTIONS[d].name} · Bible Project`;

  // Study is the active section; the page sits one folder below /mockups/, so the frame's shared paths move up one less.
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  const header = Frame.header, footer = Frame.footer;
  Frame.header = () => header().replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
      <span class="sep"`).replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("../../letters-shared/", "../letters-shared/");

  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = `wrap t-page ms-page ms-${d}`;
  main.append(wrap);
  let number = 0;
  for (const key of DIRECTIONS[d].sections) {
    const section = document.createElement("section");
    section.id = key;
    section.className = `t-sec t-sec-${key} ms-sec-${key}`;
    wrap.append(section);
    const num = key === "landing" ? "" : String(++number).padStart(2, "0");
    try {
      if (!Sections[key]) throw new Error(`section "${key}" did not register (expected a file setting Sections.${key})`);
      Sections[key].mount(section, { d, num });
    } catch (error) {
      console.error(`Manuscripts page: the "${key}" section failed to draw`, error);
      section.innerHTML = `<p class="t-failed">This section could not be drawn.</p>`;
    }
  }

  // The small switch between the three directions.
  const sw = document.createElement("nav");
  sw.className = "dir-switch";
  sw.setAttribute("aria-label", "Directions");
  sw.innerHTML = Object.entries(DIRECTIONS).map(([key, x]) =>
    `<a href="?d=${key}" title="${x.letter} · ${x.name}"${key === d ? ' aria-current="page"' : ""}>${x.letter}<span>${x.name}</span></a>`).join("");
  document.body.append(sw);
})();
