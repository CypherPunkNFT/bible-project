// The "How the canon took shape" study (/study/how-the-canon-took-shape) in three directions, chosen with ?d=a|b|c: the
// site frame with Study selected, then that direction's sections in order. Each section lives in its own file and
// registers as Sections.<key>; one failing section never stops the others.
(() => {
  const DIRECTIONS = {
    a: { letter: "A", name: "The gathering", sections: ["landing", "shelf", "registers", "evidence", "timeline", "investigations", "trail", "compare", "practice", "sources"] },
    b: { letter: "B", name: "The cabinet", sections: ["landing", "registers", "evidence", "cabinet", "investigations", "trail", "compare", "practice", "sources"] },
    c: { letter: "C", name: "Where the lists were made", sections: ["landing", "map", "registers", "evidence", "investigations", "trail", "compare", "practice", "sources"] },
  };
  const params = new URLSearchParams(location.search);
  const d = DIRECTIONS[params.get("d")] ? params.get("d") : "a";
  document.title = `How the canon took shape · ${DIRECTIONS[d].name} · Bible Project`;

  // Study is the active section; the page sits one folder below /mockups/, so the frame's shared paths move up one less.
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  const header = Frame.header, footer = Frame.footer;
  Frame.header = () => header().replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
      <span class="sep"`).replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("../../letters-shared/", "../letters-shared/");

  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = `wrap t-page ms-page cn-page cn-${d}`;
  main.append(wrap);
  let number = 0;
  for (const key of DIRECTIONS[d].sections) {
    const section = document.createElement("section");
    section.id = key;
    section.className = `t-sec t-sec-${key} cn-sec-${key}`;
    wrap.append(section);
    const num = key === "landing" ? "" : String(++number).padStart(2, "0");
    try {
      if (!Sections[key]) throw new Error(`section "${key}" did not register (expected a file setting Sections.${key})`);
      Sections[key].mount(section, { d, num });
    } catch (error) {
      console.error(`Canon page: the "${key}" section failed to draw`, error);
      section.innerHTML = `<p class="t-failed">This section could not be drawn.</p>`;
    }
  }

  // "On this page", as on the live page: the four chapters, pointed at wherever this direction puts them.
  const records = { a: ["timeline", "Enter the timeline"], b: ["cabinet", "Open the cabinet"], c: ["map", "Read the map"] }[d];
  const chapters = [["evidence", "Read the evidence"], records, ["investigations", "Examine the boundaries"], ["compare", "Compare traditions"]];
  wrap.querySelector("#landing")?.insertAdjacentHTML("beforeend", `<nav class="cn-chapters" aria-label="On this page">${chapters.map(([id, label], i) => `<a href="#${id}"><b>0${i + 1}</b>${label}</a>`).join("")}</nav>`);

  const sw = document.createElement("nav");
  sw.className = "dir-switch";
  sw.setAttribute("aria-label", "Directions");
  sw.innerHTML = Object.entries(DIRECTIONS).map(([key, x]) =>
    `<a href="?d=${key}" title="${x.letter} · ${x.name}"${key === d ? ' aria-current="page"' : ""}>${x.letter}<span>${x.name}</span></a>`).join("");
  document.body.append(sw);
})();
