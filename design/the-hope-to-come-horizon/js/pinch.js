// Section 04. Four orders of events run down the page as four strands, and all four are drawn in to a single point: the
// return. Whether the thick mark, the thousand years, falls above that point or below it is the whole of the disagreement.
// No strand is favoured: same weight, same colour, the study's own order.
(() => {
  if (!window.HZ) return;
  const { h, runs, page, sectionHead, blockView } = HZ;
  const { study, mapSteps } = HP;

  const [mapsFirst, mapsTurn] = study.mapsTitle.split(". ");
  const mapParts = study.maps.slice(0, mapSteps.length);
  const otherParts = study.maps.slice(mapSteps.length);
  const returnAt = (map) => map.steps.findIndex(([, kind]) => kind === "return");

  const stepItem = ([label, kind]) => h("li", { class: `hz-step hz-step-${kind || "plain"}` },
    h("i", { "aria-hidden": "true" }),
    h("span", {}, label, kind === "return" ? h("small", {}, "The return") : kind === "reign" ? h("small", {}, "The thousand years") : null));
  const strands = mapParts.map((part, index) => {
    const map = mapSteps[index];
    const at = returnAt(map);
    return h("article", { class: "hz-strand", "data-strand": index, style: `--n:${index}` },
      h("header", { class: "hz-strand-head" }, h("h3", {}, part.title), h("p", {}, map.reads)),
      h("ol", { class: "hz-before", "aria-label": `Order of events, not scale, up to the return: ${map.name}` }, map.steps.slice(0, at + 1).map(stepItem)),
      h("div", { class: "hz-strand-rule", "aria-hidden": "true" }),
      h("ol", { class: "hz-after", start: at + 2, "aria-label": `After the return: ${map.name}` }, map.steps.slice(at + 1).map(stepItem)),
      h("div", { class: "hz-strand-text" }, part.blocks.map((block) => blockView[block.k](block))));
  });
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "hz-pinch-lines");
  svg.setAttribute("aria-hidden", "true");
  const rule = h("div", { class: "hz-pinch-rule", "aria-hidden": "true" }, h("span", {}, "The return"));
  const grid = h("div", { class: "hz-pinch" }, svg, rule, strands);

  // On a narrow screen there is no room to draw the strands around their words, so this small drawing shows the same thing.
  function overview() {
    const X = [44, 128, 212, 296], MID = 92, STEP = 17, GAP = 24;
    const parts = [`<path class="hz-ov-rule" d="M0 ${MID}H340"/>`];
    mapSteps.forEach((map, m) => {
      const at = returnAt(map);
      const yOf = (i) => (i <= at ? MID - GAP - (at - i) * STEP : MID + GAP + (i - at - 1) * STEP);
      const first = yOf(0), lastBefore = yOf(at), firstAfter = yOf(at + 1), last = yOf(map.steps.length - 1);
      parts.push(`<path class="hz-ov-strand" d="M${X[m]} ${first}V${lastBefore}C${X[m]} ${MID - 8} 170 ${MID - 14} 170 ${MID}C170 ${MID + 14} ${X[m]} ${MID + 8} ${X[m]} ${firstAfter}V${last}"/>`);
      map.steps.forEach(([, kind], i) => parts.push(kind === "reign" ? `<path class="hz-ov-reign" d="M${X[m]} ${yOf(i) - 6}V${yOf(i) + 6}"/>` : `<circle class="hz-ov-dot" cx="${X[m]}" cy="${yOf(i)}" r="2.5"/>`));
    });
    parts.push(`<circle class="hz-ov-point" cx="170" cy="${MID}" r="5"/>`);
    return `<svg viewBox="0 0 340 184" aria-hidden="true">${parts.join("")}</svg>`;
  }
  const small = h("figure", { class: "hz-overview" }, HZ.art(overview()), h("figcaption", {}, "The same four maps as below, in the same order, left to right. Each small mark is a step; the thick mark is the thousand years; all four meet at the return."));

  page.append(h("section", { class: "hz-sec", id: "maps" },
    sectionHead("04", `${mapsFirst}.`, mapsTurn, runs(study.mapsLead)),
    h("p", { class: "hz-reads" }, `All ${mapSteps.length} line up below on the return, in gold. Look at whether the thousand years come before it or after it.`),
    small,
    grid,
    h("p", { class: "hz-note" }, "Each strip shows order, not length: no step is drawn to scale."),
    h("div", { class: "hz-after-maps" }, otherParts.map((part) => h("div", { class: "hz-part" }, h("h3", {}, part.title), part.blocks.map((block) => blockView[block.k](block)))))));

  // The strands are drawn from where the words actually landed, so they stay true at every width and text size.
  function draw() {
    if (getComputedStyle(svg).display === "none") return;
    const box = grid.getBoundingClientRect();
    const ruleBox = rule.getBoundingClientRect();
    const px = box.width / 2, py = ruleBox.top + ruleBox.height / 2 - box.top;
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    const node = (element) => {
      const r = element.getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
    };
    const paths = strands.map((strand, index) => {
      const before = [...strand.querySelectorAll(".hz-before i")].map(node);
      const after = [...strand.querySelectorAll(".hz-after i")].map(node);
      const [bx, by] = before.at(-1), [ax, ay] = after[0];
      const reach = (py - by) * .75, fall = (ay - py) * .75;
      const d = `M${before[0][0]} ${before[0][1]}V${by}C${bx} ${by + reach} ${px} ${py - reach} ${px} ${py}C${px} ${py + fall} ${ax} ${ay - fall} ${ax} ${ay}V${after.at(-1)[1]}`;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.dataset.strand = index;
      return path;
    });
    const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point.setAttribute("cx", px); point.setAttribute("cy", py); point.setAttribute("r", 6);
    point.setAttribute("class", "hz-point");
    svg.replaceChildren(...paths, point);
  }
  strands.forEach((strand, index) => {
    const mark = (on) => svg.querySelector(`path[data-strand="${index}"]`)?.classList.toggle("is-on", on);
    strand.addEventListener("pointerenter", () => mark(true));
    strand.addEventListener("pointerleave", () => mark(false));
    strand.addEventListener("focusin", () => mark(true));
    strand.addEventListener("focusout", () => mark(false));
  });
  new ResizeObserver(draw).observe(grid);
  document.fonts?.ready.then(draw);
  draw();
})();
