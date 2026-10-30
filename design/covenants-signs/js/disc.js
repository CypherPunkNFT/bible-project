// The whole Bible as a disc: Genesis at the centre, Revelation at the rim, one ring for each part. Each covenant holds a
// wedge. It is dropped at its own place, and the later verses that come back to it ripple outward.
Cov.drawDisc = () => {
  const { h, s, art, refLink, runs, lines, axis, covenants, passages, numbers, notDrawn, worldName } = Cov;
  const KIND = { quoted: "Quotes it", names: "Names it", recalls: "Remembers it" };
  const C = 450, INNER = 46, OUTER = 372;
  const ringWidth = (OUTER - INNER) / axis.length;
  const slugs = Object.keys(covenants);
  const wedge = 360 / slugs.length;
  // Each part gets an equal ring, so a position is its part plus how far through that part it falls.
  function radius(position) {
    const index = axis.findIndex((part) => position >= part.a && position <= part.b);
    if (index < 0) throw new Error(`Covenants: position ${position} is outside the Bible's parts`);
    return INNER + (index + (position - axis[index].a) / (axis[index].b - axis[index].a)) * ringWidth;
  }
  const point = (r, degrees) => { const a = (degrees - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  const fixed = (n) => n.toFixed(1);

  const svg = s("svg", { viewBox: "0 0 900 900", class: "cv-disc", role: "group", "aria-label": `The whole Bible as a disc, Genesis at the centre and Revelation at the rim, with ${lines.length} later verses that come back to the five covenants. Arrow keys move between them; Enter opens both passages.` });
  axis.forEach((part, index) => {
    svg.append(s("circle", { cx: C, cy: C, r: OUTER - (axis.length - 1 - index) * ringWidth, class: `cv-ring cv-sec-${part.slug}` }));
  });
  // Paint largest first so smaller rings sit on top.
  [...svg.querySelectorAll(".cv-ring")].reverse().forEach((ring) => svg.append(ring));
  svg.append(s("circle", { cx: C, cy: C, r: INNER, class: "cv-centre" }));
  slugs.forEach((slug, index) => {
    const [x, y] = point(OUTER, index * wedge);
    svg.append(s("line", { x1: C, y1: C, x2: x, y2: y, class: "cv-spoke" }));
  });
  axis.forEach((part, index) => {
    const [x, y] = point(INNER + (index + 0.5) * ringWidth, 0); // on the top spoke, where no mark ever sits
    svg.append(s("text", { x, y, class: "cv-ring-name", "text-anchor": "middle", "dominant-baseline": "central" }, part.name));
  });

  const dots = new Map();
  const wedges = new Map();
  slugs.forEach((slug, index) => {
    const group = s("g", { class: `cv-wedge cv-w-${slug}`, "data-stone": slug });
    const start = index * wedge, middle = start + wedge / 2;
    const mine = lines.filter((line) => line.covenant === slug).sort((a, b) => a.b - b.b);
    const [lx, ly] = point(OUTER + 40, middle);
    const name = s("g", { class: "cv-wedge-name", transform: `translate(${fixed(lx)} ${fixed(ly)})` });
    name.append(art(`<svg viewBox="-24 -24 48 48" x="-17" y="-34" width="34" height="34">${CovSigns.mini[slug]}</svg>`).firstChild);
    name.append(s("text", { y: 18, "text-anchor": "middle" }, worldName(slug)));
    group.append(name);
    const placed = new Map();
    mine.forEach((line, i) => {
      const r = radius(line.b);
      const degrees = start + 9 + ((i + 0.5) / mine.length) * (wedge - 18);
      const [x, y] = point(r, degrees);
      const [ox, oy] = point(radius(line.a), middle);
      const [cx, cy] = point((radius(line.a) + r) / 2, (middle + degrees) / 2);
      if (!placed.has(line.origin)) placed.set(line.origin, [ox, oy]);
      group.append(s("path", { d: `M${fixed(ox)} ${fixed(oy)}Q${fixed(cx)} ${fixed(cy)} ${fixed(x)} ${fixed(y)}`, class: "cv-ripple", "data-line": line.id }));
      const dot = s("g", { class: `cv-dot cv-dot-${line.kind} cv-sec-${line.section}`, tabindex: "-1", role: "button", "aria-label": `${line.laterLabel}, ${line.sectionName}. ${KIND[line.kind]}: ${line.originLabel}. Open both.`, "data-line": line.id, transform: `translate(${fixed(x)} ${fixed(y)})` });
      dot.append(s("circle", { r: 15, class: "cv-dot-hit" }));
      dot.append(line.kind === "quoted" ? s("circle", { r: 6.5, class: "cv-dot-mark" }) : line.kind === "names" ? s("circle", { r: 5.5, class: "cv-dot-mark is-open" }) : s("path", { d: "M0-6.500 6.500 0 0 6.500-6.500 0Z", class: "cv-dot-mark" }));
      group.append(dot);
      dots.set(line.id, dot);
    });
    for (const [x, y] of placed.values()) {
      group.append(s("circle", { cx: x, cy: y, r: 7, class: "cv-stone" }));
      group.append(s("circle", { cx: x, cy: y, r: 7, class: "cv-wave" }));
      group.append(s("circle", { cx: x, cy: y, r: 7, class: "cv-wave cv-wave-2" }));
    }
    wedges.set(slug, group);
    svg.append(group);
  });

  // ── Both verses, side by side with the disc ──
  const out = h("div", { class: "cv-out", "aria-live": "polite" });
  const text = (id) => passages[id].verses.map((v) => v.t).join(" ");
  let current = null;
  function show(line, announce) {
    current = line;
    out.setAttribute("aria-live", announce ? "polite" : "off");
    out.replaceChildren(
      h("p", { class: "cv-out-head" }, `${worldName(line.covenant)} · ${line.originLabel}`),
      h("p", { class: "cv-out-text" }, text(line.origin)),
      h("p", { class: "cv-out-head cv-out-later" }, `${line.laterLabel} · ${line.sectionName} · ${KIND[line.kind]}${line.loose ? ", loosely" : ""}`),
      h("p", { class: "cv-out-text" }, text(line.later)),
      refLink(line.id, "Open both passages →"));
    svg.querySelectorAll("[data-line]").forEach((part) => part.classList.toggle("is-on", part.dataset.line === line.id));
    for (const [id, dot] of dots) dot.setAttribute("tabindex", id === line.id ? "0" : "-1");
    for (const row of listRows.values()) row.classList.toggle("is-on", row.dataset.line === line.id);
  }
  svg.addEventListener("pointerover", (event) => {
    const dot = event.target.closest(".cv-dot");
    if (dot && event.pointerType === "mouse") show(Cov.lineIds.get(dot.dataset.line), false);
  });
  svg.addEventListener("focusin", (event) => {
    const dot = event.target.closest(".cv-dot");
    if (dot) show(Cov.lineIds.get(dot.dataset.line), true);
  });
  let lastPointer = "mouse";
  addEventListener("pointerdown", (event) => { lastPointer = event.pointerType; }, { capture: true });
  svg.addEventListener("click", (event) => {
    const dot = event.target.closest(".cv-dot");
    if (!dot) return;
    event.stopPropagation(); // the page's click-outside rule must not close the sheet this opens
    const line = Cov.lineIds.get(dot.dataset.line);
    show(line, true);
    if (lastPointer !== "touch") Cov.openSheet(line.id, dot); // on touch, a tap shows both verses, with a link to open them
  });
  svg.addEventListener("keydown", (event) => {
    const live = [...dots.values()].filter((dot) => !dot.closest(".is-dim"));
    const at = live.indexOf(document.activeElement);
    if (at < 0) return;
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); Cov.openSheet(document.activeElement.dataset.line, document.activeElement); return; }
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    live[(at + step + live.length) % live.length].focus();
  });

  // ── The same verses as a plain list ──
  const listRows = new Map();
  const list = h("div", { class: "cv-list" }, slugs.map((slug) => h("div", { class: "cv-list-group", "data-stone": slug },
    h("h3", {}, `${worldName(slug)} · ${numbers.perCovenant[slug]} lines`),
    lines.filter((line) => line.covenant === slug).map((line) => {
      const row = h("button", { type: "button", class: "cv-list-row", "data-line": line.id, onclick: (event) => { event.stopPropagation(); show(line, true); Cov.openSheet(line.id, row); } },
        h("b", {}, line.laterLabel), h("small", {}, `from ${line.originLabel} · ${KIND[line.kind]}${line.loose ? ", loosely" : ""} · ${line.sectionName}`));
      row.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") show(line, false); });
      row.addEventListener("focus", () => show(line, true));
      listRows.set(line.id, row);
      return row;
    }))));

  // ── Choosing a stone, and how to see it ──
  const stoneButtons = new Map();
  const stones = h("div", { class: "cv-stones", role: "group", "aria-label": "Show one covenant's later verses" },
    slugs.map((slug) => {
      const button = h("button", { type: "button", class: `cv-stone-pick cv-w-${slug}`, onclick: () => Cov.set({ stone: Cov.state.stone === slug ? null : slug }) }, Cov.miniSign(slug, 26), h("span", {}, covenants[slug]), h("b", {}, String(numbers.perCovenant[slug])));
      stoneButtons.set(slug, button);
      return button;
    }));
  const viewButtons = new Map();
  const view = h("div", { class: "cv-view cv-view-plain", role: "group", "aria-label": "How to see the later verses" },
    [["disc", "The disc"], ["list", "The list"]].map(([id, label]) => {
      const button = h("button", { type: "button", onclick: () => Cov.set({ later: id }) }, label);
      viewButtons.set(id, button);
      return button;
    }));
  const legend = h("p", { class: "cv-legend" },
    h("span", {}, h("i", { class: "cv-key cv-key-quoted" }), "Quotes it, with quotation marks in the Berean"),
    h("span", {}, h("i", { class: "cv-key cv-key-names" }), "Names it, with the word covenant, promise or oath"),
    h("span", {}, h("i", { class: "cv-key cv-key-recalls" }), "Remembers the person or the words"));
  const noahLine = lines.find((l) => l.covenant === "noah" && l.kind === "names");
  const figure = h("div", { class: "cv-disc-box" }, svg, legend);
  function sync(state) {
    figure.hidden = state.later !== "disc";
    list.hidden = state.later !== "list";
    for (const [id, button] of viewButtons) button.setAttribute("aria-pressed", String(id === state.later));
    for (const [slug, button] of stoneButtons) button.setAttribute("aria-pressed", String(slug === state.stone));
    for (const [slug, group] of wedges) group.classList.toggle("is-dim", Boolean(state.stone) && slug !== state.stone);
    list.querySelectorAll(".cv-list-group").forEach((group) => { group.hidden = Boolean(state.stone) && group.dataset.stone !== state.stone; });
    if (state.stone && current?.covenant !== state.stone) show(lines.find((l) => l.covenant === state.stone), false);
  }
  Cov.onChange(sync);
  show(lines.find((l) => l.covenant === (Cov.state.stone ?? "abraham")), false);
  sync(Cov.state);

  return h("section", { class: "cv-later", id: "later" },
    h("div", { class: "wrap" },
      h("header", { class: "cv-head" },
        h("h2", {}, "Spoken in its day. ", h("em", {}, "Still being quoted.")),
        h("p", {}, "Is a promise over once it has been spoken? Here is the whole Bible as a disc, Genesis at the centre and Revelation at the rim. Each covenant is dropped where it was spoken, and the verses that come back to it ripple out from there. Point at a mark or a row of the list to read both verses; choose it to open them."),
        h("p", { class: "cv-reads" }, `${numbers.reachNT} of these ${numbers.lines} lines end in the New Testament. Noah's is the quiet one: among these lines only `, refLink(noahLine.later, noahLine.laterLabel), " takes up his oath. The New Testament remembers Noah himself, and no verse after Genesis 9 sets his name beside the word covenant.")),
      h("div", { class: "cv-later-bar" }, stones, view),
      h("div", { class: "cv-later-body" }, figure, list, out),
      h("p", { class: "cv-small" }, `This is a selection, not a census: the word covenant alone comes in ${numbers.wordVerses} verses, in ${numbers.wordBooks} of the ${numbers.totalBooks} books. Each ring is one part of the Bible, drawn equal in width, not to scale; a verse sits in its part by count. A mark's shape is how it comes back. Which promise a later verse goes back to is this study's matching, and some verses could join more than one. A script tests each line: the later verse follows its origin, and a quotation has quotation marks and shares three words with it. Hebrews 10:17 is the one loose exception: it quotes Jeremiah in different order. The letters often follow a Greek translation, so wording can differ.`),
      h("p", { class: "cv-small" }, "Other quotations in the walked letters are not drawn, because they do not start from these five passages: ",
        notDrawn.flatMap((item, i) => [i ? "; " : null, refLink(item.r, item.label), ` ${item.why}`]), ".")));
};
