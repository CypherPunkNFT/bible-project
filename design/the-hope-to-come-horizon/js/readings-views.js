// Four new ways to move through the six readings, for the owner to compare under ?readings-view=a. Without that in the address the page
// keeps its own bar. A: breadcrumbs, with the numeral on the left. B: vertical. C: a pager. D: the numerals alone.
(() => {
  if (!window.HZ || !HZ.pill) return;
  const { h, onView, romanOf, moveTo, stepBy, currentStop, setReadingsBar } = HZ;
  const { readings } = HP.study;
  const nameOf = (reading) => reading.title.split(":")[0];
  const go = (reading, ...content) => h("button", { type: "button", "data-go": reading.slug, "aria-label": `Reading ${romanOf(reading)}: ${nameOf(reading)}` }, content);
  const arrow = (step, mark, label) => h("button", { type: "button", class: "hz-alt-arrow", "data-step": String(step), "aria-label": label }, h("span", { "aria-hidden": "true" }, mark));
  const list = () => h("ol", {}, readings.map((reading) => h("li", {}, go(reading, h("b", {}, romanOf(reading)), h("span", {}, nameOf(reading))))));

  const NAVS = {
    a: () => [list(), h("div", { class: "hz-alt-arrows" }, arrow(-1, "←", "Previous reading"), arrow(1, "→", "Next reading"))],
    b: () => [list()],
    c: () => [arrow(-1, "←", "Previous reading"), h("div", { class: "hz-alt-dashes" }, readings.map((reading) => go(reading))), arrow(1, "→", "Next reading"), h("p", { class: "hz-alt-count", "aria-live": "polite" }, h("b", { "data-numeral": "" }), h("span", { "data-name": "" }))],
    d: () => [list()],
  };

  const section = document.querySelector(".hz-readings"), slider = document.querySelector(".hz-slider");
  let nav = null;
  function sync() {
    if (!nav) return;
    const slug = currentStop(), place = readings.findIndex((reading) => reading.slug === slug);
    nav.querySelectorAll("[data-go]").forEach((button) => button.toggleAttribute("aria-current", button.dataset.go === slug));
    nav.querySelectorAll("[data-step]").forEach((button) => { button.disabled = !readings[place + Number(button.dataset.step)]; });
    const numeral = nav.querySelector("[data-numeral]");
    if (numeral) numeral.textContent = romanOf(readings[place]);
    const name = nav.querySelector("[data-name]");
    if (name) name.textContent = nameOf(readings[place]);
  }
  function show(key) {
    nav?.remove();
    section.dataset.layout = key;
    nav = h("nav", { class: `hz-alt-nav hz-alt-${key}`, "aria-label": "The six readings" }, NAVS[key]());
    nav.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button?.dataset.go) moveTo(button.dataset.go);
      else if (button?.dataset.step) stepBy(Number(button.dataset.step));
    });
    slider.prepend(nav);
    setReadingsBar(key === "b" ? null : nav);
    sync();
  }
  onView(sync);
  if (HZ.pill("readings-view", Object.keys(NAVS), show)) scrollTo(0, nav.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(nav).top) || 59));
})();
