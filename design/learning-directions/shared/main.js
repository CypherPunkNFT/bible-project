// Learning division mock-ups: the router and the A · B · C · D · E switcher.
// Addresses: #a (front page), #a/age/children (one audience), #a/item/moses-three-forties (one item). Same for b, c, d.
(() => {
  const DIRS = window.DIRS; // filled by each direction's script: { a: { name, defaultAge, front, age, item }, ... }
  const main = Frame.mount();
  Ticker.mount();

  const parse = () => {
    const [d = "a", view = "front", arg] = location.hash.replace(/^#/, "").split("/");
    return DIRS[d] ? { d, view: ["front", "age", "item"].includes(view) ? view : "front", arg } : { d: "a", view: "front" };
  };
  const nav = document.createElement("nav");
  nav.className = "dir-switch";
  nav.setAttribute("aria-label", "Directions and pages");
  document.body.append(nav);
  function drawSwitch({ d, view }) {
    const dir = DIRS[d];
    nav.innerHTML = Object.entries(DIRS).map(([key, x]) => `<a href="#${key}" title="${key.toUpperCase()} · ${x.name}"${key === d ? ' aria-current="page"' : ""}>${key.toUpperCase()}<span>${x.name}</span></a>`).join("")
      + `<i aria-hidden="true"></i>`
      + [["front", "Front", `#${d}`], ...(dir.age ? [["age", "Age", `#${d}/age/${dir.defaultAge}`]] : []), ["item", "Item", `#${d}/item/moses-three-forties`]]
        .map(([v, label, href]) => `<a class="pg" href="${href}"${v === view ? ' aria-current="page"' : ""}>${label}</a>`).join("")
      + (dir.age ? "" : `<span class="pg-note" title="${dir.ageNote}">${dir.ageNote}</span>`); // E keeps the ages inside its front page
  }
  function route() {
    const r = parse(), dir = DIRS[r.d];
    document.documentElement.dataset.dir = r.d;
    main.className = `dir-${r.d} view-${r.view}`;
    main.replaceChildren();
    const wrap = document.createElement("div");
    wrap.className = "wrap";
    main.append(wrap);
    try {
      if (r.view === "age" && dir.age) dir.age(wrap, LEARN.A[r.arg] ? r.arg : dir.defaultAge);
      else if (r.view === "item") dir.item(wrap, LEARN.I[r.arg] ? r.arg : "moses-three-forties");
      else dir.front(wrap);
    } catch (error) {
      console.error(`Learning mock-up: direction ${r.d}, ${r.view} page failed to draw`, error);
      wrap.insertAdjacentHTML("beforeend", `<p class="lede" style="padding:3rem 0">This page failed to draw: ${Frame.esc(error.message)}</p>`);
    }
    document.title = `Learning materials · ${dir.name} · Bible Project`;
    drawSwitch(r);
    Ticker.watch(main, `${dir.name}: ${r.view === "front" ? "front page" : r.view === "age" ? "audience page" : "item page"}`);
    if (!route.keepScroll) scrollTo(0, 0);
    route.keepScroll = false;
  }
  addEventListener("hashchange", route);
  route();
})();
