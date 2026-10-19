// The Old maps mock-ups page: the site frame with Study selected, a small switch between the views (?d=a|b|c|d|atlas|pages),
// then each section of the chosen view in order. Each section registers as Sections.<key> in its view's file; one
// failing section never stops the others.
(() => {
  const VIEWS = {
    a: { label: "Through time", order: ["a_landing", "a_lanes", "a_makers", "a_libraries"] },
    b: { label: "The map chest", order: ["b_landing", "b_chest"] },
    c: { label: "How the land was drawn", order: ["c_landing", "c_sequence", "c_grid"] },
    // The owner's merge (2026-10-19): A's landing with a larger, centred drawing; B's chest as the heart; then A's lanes and
    // libraries and C's eight maps and subject grid. The sections are the same ones the three directions use.
    d: { label: "Merged", order: ["a_landing", "b_chest", "a_lanes", "a_libraries", "c_sequence", "c_grid"] },
    atlas: { label: "In the Atlas", order: ["x_home", "x_strips", "x_panel", "x_study"] },
    pages: { label: "In the pages: 2 and 3", order: ["p_strips", "p_panel"] },
  };
  const requested = new URLSearchParams(location.search).get("d");
  const key = VIEWS[requested] ? requested : "a";
  const view = VIEWS[key];

  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  const header = Frame.header;
  Frame.header = function studyHeader() {
    return header().replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
      <span class="sep"`);
  };
  document.title = `Old maps · ${view.label} · Bible Project`;
  const main = Frame.mount();
  // The shared frame points at the logo from two folders down; this page sits one down.
  document.querySelectorAll('img[src="../../letters-shared/favicon.svg"]').forEach((logo) => { logo.src = "../letters-shared/favicon.svg"; });
  const inPage = key === "atlas" || key === "pages";
  const page = inPage ? Object.assign(document.createElement("div"), { className: "wrap om-page om-atlas-view" }) : OM.atlasFrame(main);
  if (inPage) main.append(page);
  page.classList.add(`om-view-${key}`);

  for (const name of view.order) {
    const section = document.createElement("section");
    section.id = name;
    section.className = `om-sec om-sec-${name}`;
    page.append(section);
    try {
      if (!Sections[name]) throw new Error(`section "${name}" did not register (expected Sections.${name} in one of the view files)`);
      Sections[name].mount(section);
    } catch (error) {
      console.error(`Old maps (${view.label}): the "${name}" section failed to draw`, error);
      section.innerHTML = `<p class="om-failed">This section could not be drawn.</p>`;
    }
  }

  // Sections borrowed from several directions keep their own numbers; number them again in the order they stand here.
  page.querySelectorAll(".om-head .om-num").forEach((num, i) => { num.textContent = String(i + 1).padStart(2, "0"); });

  const switcher = document.createElement("nav");
  switcher.className = "om-switch";
  switcher.setAttribute("aria-label", "Mock-up views");
  switcher.innerHTML = Object.entries(VIEWS).map(([k, v]) => `<a href="?d=${k}" title="${v.label}"${k === key ? ' aria-current="page"' : ""}>${k === "atlas" ? "Atlas" : k === "pages" ? "2 · 3" : k.toUpperCase()}<span>${v.label}</span></a>`).join("");
  document.body.append(switcher);
})();
