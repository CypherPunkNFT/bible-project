// Section 01. One word in four sizes: every use on four rings, the smallest size at the centre. The four ring buttons and the written list are the full path on any screen.
// The drawing adds the shape of it: pointing or arrowing along the points shows each verse, in Bible order, and choosing one opens it. A hollow point is a close call.
(() => {
  if (!window.CCK) return;
  const { h, refLink, page, sectionHead, runs, roving, ringIds } = CCK;
  const { study, word, rings, numbers } = window.CC;
  const SIZE = 640, CENTRE = SIZE / 2, DOT = 5.5, HIT = 11;
  const RADII = { house: 62, place: 150, many: 226, all: 296 };
  const SECTIONS = [["gospels", "Matthew"], ["acts", "Acts"], ["epistles", "The letters"], ["revelation", "Revelation"]];
  const svg = (tag, attributes = {}) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    return element;
  };
  const drawing = svg("svg", { class: "cc-rings", viewBox: `0 0 ${SIZE} ${SIZE}`, role: "group", "aria-label": `Rings of points, ${numbers.uses} uses of the word in all. The same verses are in the written list beside it.` });
  const ringMarks = new Map(rings.map((ring) => {
    const mark = svg("circle", { class: "cc-ring", cx: CENTRE, cy: CENTRE, r: RADII[ring.id] });
    const label = svg("text", { class: "cc-ring-label", x: CENTRE, y: ring.id === "house" ? CENTRE + 5 : CENTRE - RADII[ring.id] + 24, "text-anchor": "middle", "aria-hidden": "true" });
    label.textContent = ring.name;
    drawing.append(mark, label);
    return [ring.id, mark];
  }));
  // Points run clockwise from the top, each ring in Bible order. Keys walk all of them in Bible order, across the rings.
  const groups = new Map(rings.map((ring) => [ring.id, word.filter((use) => use.ring === ring.id)]));
  const position = (use) => {
    const group = groups.get(use.ring);
    const angle = (group.indexOf(use) / group.length) * 2 * Math.PI - Math.PI / 2;
    return [CENTRE + RADII[use.ring] * Math.cos(angle), CENTRE + RADII[use.ring] * Math.sin(angle)];
  };
  const reader = h("p", { class: "cc-readline" });
  const prompt = () => reader.replaceChildren("Point at a light to read its verse, or use the list.");
  const showUse = (use) => reader.replaceChildren(h("b", {}, `${use.label} · ${ringIds.get(use.ring).name}`), " ", use.t, use.close ? h("span", { class: "cc-close-call" }, ` Close call: ${use.close}`) : "");
  const points = word.map((use) => {
    const [x, y] = position(use);
    const point = svg("g", { class: `cc-point cc-sec-${use.sec}${use.close ? " is-close" : ""}`, role: "button", tabindex: "-1", "data-ring": use.ring, "aria-label": `${use.label}, ${ringIds.get(use.ring).name}${use.close ? ", a close call" : ""}` });
    point.append(svg("circle", { class: "cc-hit", cx: x, cy: y, r: HIT }), svg("circle", { class: "cc-dot", cx: x, cy: y, r: DOT }));
    const open = () => CCK.openPassage(use.r, point);
    point.addEventListener("click", open);
    point.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
    point.addEventListener("pointerenter", () => showUse(use));
    point.addEventListener("focus", () => showUse(use));
    drawing.append(point);
    return point;
  });
  drawing.addEventListener("pointerleave", prompt);
  roving(points);

  const ringButtons = new Map(rings.map((ring) => [ring.id, h("button", { type: "button", class: "cc-ring-button", "aria-controls": "cc-ring-list", onclick: () => choose(ring.id) },
    h("b", {}, String(numbers.rings[ring.id])), h("span", {}, ring.name))]));
  const listArea = h("div", { class: "cc-ring-list", id: "cc-ring-list" });
  const useList = (ringId) => {
    const seen = new Map();
    for (const use of groups.get(ringId)) seen.set(use.label, { use, count: (seen.get(use.label)?.count ?? 0) + 1 });
    return [...seen.values()];
  };
  function draw() {
    const ring = ringIds.get(CCK.state.ring);
    for (const [id, button] of ringButtons) button.setAttribute("aria-pressed", String(id === ring.id));
    for (const [id, mark] of ringMarks) mark.classList.toggle("is-on", id === ring.id);
    drawing.dataset.on = ring.id;
    markStop(ringButtons.get(ring.id));
    const entries = useList(ring.id);
    const closes = entries.filter(({ use }) => use.close);
    listArea.replaceChildren(...[
      h("h3", {}, ring.name, " · ", String(numbers.rings[ring.id]), numbers.rings[ring.id] === 1 ? " use" : " uses"),
      h("p", {}, ring.line),
      h("ul", { class: "cc-refs" }, entries.map(({ use, count }) => h("li", { class: use.close ? "is-close" : null }, refLink(use.r, use.label), count > 1 ? ` (${count} times)` : ""))),
      closes.length ? h("details", { class: "cc-closes" }, h("summary", {}, `Close calls here · ${closes.length}`), h("ul", {}, closes.map(({ use }) => h("li", {}, refLink(use.r, use.label), " ", use.close)))) : null,
    ].filter(Boolean));
  }
  function choose(id) {
    CCK.setView({ ring: id });
    draw();
  }
  const markStop = roving([...ringButtons.values()], () => ringButtons.get(CCK.state.ring));
  CCK.syncers.push(draw);
  prompt();
  page.append(h("section", { class: "t-sec cc-word", id: "word" },
    sectionHead("01", "One word,", "four sizes", runs(study.wordLead)),
    h("div", { class: "cc-word-grid" },
      h("div", { class: "cc-word-art" }, drawing,
        h("ul", { class: "cc-legend", "aria-label": "Colours and marks on the rings" },
          SECTIONS.map(([id, label]) => h("li", {}, h("span", { class: `cc-key cc-sec-${id}`, "aria-hidden": "true" }), label)),
          h("li", {}, h("span", { class: "cc-key cc-key-close", "aria-hidden": "true" }), "A close call"))),
      h("div", { class: "cc-word-side" },
        h("div", { class: "cc-ring-buttons", role: "group", "aria-label": "Choose a ring" }, [...ringButtons.values()]),
        listArea)),
    reader,
    h("p", { class: "cc-reads" }, runs(study.wordReads)),
    h("div", { class: "cc-flag cc-flag-care" }, h("p", { class: "cc-flag-label" }, "What the rings can and cannot show"), h("p", {}, runs(study.wordCare)))));
  draw();
})();
