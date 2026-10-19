// "A passage through the manuscripts": four directions, chosen with ?d=a|b|c|d (D merges the other three). The site frame with Study active, then
// the direction's own page; the small switch at the foot moves between them. One failing direction logs its error and
// says so on the page.
(() => {
  const DIRECTIONS = { a: ["A", "The desk"], b: ["B", "Cinema"], c: ["C", "Through the witnesses"], d: ["D", "Merger"] };
  const params = new URLSearchParams(location.search);
  const d = DIRECTIONS[params.get("d")] ? params.get("d") : "a";
  document.title = `A passage through the manuscripts · ${DIRECTIONS[d][1]} · Bible Project`;

  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  const header = Frame.header, footer = Frame.footer;
  Frame.header = () => header().replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, label, i]) => `<a href="${to}" class="${label === "Study" ? "active" : ""}">${icon(i, 16)}<span>${label}</span></a>`).join("")}
      <span class="sep"`).replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("../../letters-shared/", "../letters-shared/");

  const main = Frame.mount();
  const wrap = document.createElement("div");
  wrap.className = `wrap pm-page pm-${d}`;
  main.append(wrap);
  document.documentElement.classList.add(`pm-dir-${d}`);
  try {
    const dir = window.Directions?.[d];
    if (!dir) throw new Error(`direction "${d}" did not register (expected window.Directions.${d} from js/dir-${d}.js)`);
    dir.mount(wrap);
  } catch (error) {
    console.error(`Passage page: direction ${d} failed to draw`, error);
    wrap.insertAdjacentHTML("beforeend", `<p class="t-failed">This direction could not be drawn.</p>`);
  }

  const sw = document.createElement("nav");
  sw.className = "dir-switch";
  sw.setAttribute("aria-label", "Directions");
  sw.innerHTML = Object.entries(DIRECTIONS).map(([key, [letter, name]]) => `<a href="?d=${key}" title="${letter} · ${name}"${key === d ? ' aria-current="page"' : ""}>${letter}<span>${name}</span></a>`).join("");
  document.body.append(sw);
})();
