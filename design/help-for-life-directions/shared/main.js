// Draws the whole Help for life page in the direction named by the address (#a, #b, #c, #d) and the small A–D switch.
(() => {
  const main = Frame.mount();
  const LIST = [["a", "Index"], ["b", "Directory"], ["c", "Mosaic"], ["d", "Open in place"], ["e", "Directory, improved"]];
  const nav = document.createElement("nav");
  nav.className = "dir-switch";
  nav.setAttribute("aria-label", "Directions");
  document.body.append(nav);

  function draw() {
    const key = (location.hash.slice(1) || "a").toLowerCase();
    const dir = Directions[key] ?? Directions.a;
    const id = Directions[key] ? key : "a";
    document.title = `Help for life · ${id.toUpperCase()} · ${dir.title} · Bible Project`;
    main.innerHTML = `<div class="wrap page" data-dir="${id}">${Life.crisisStrip()}${dir.noCrumbs ? "" : Life.crumbs()}${dir.heroArt ? Life.heroWithArt() : Life.hero()}${dir.html()}${City.render(dir.city)}${Life.howMade()}</div>`;
    dir.wire(main);
    City.wire(main.querySelector(".city"));
    nav.innerHTML = LIST.map(([k, t]) => `<a href="#${k}"${k === id ? ' aria-current="page"' : ""} title="${k.toUpperCase()} · ${t}">${k.toUpperCase()}<span>${t}</span></a>`).join("");
  }
  addEventListener("hashchange", () => { draw(); scrollTo({ top: 0 }); });
  draw();
})();
