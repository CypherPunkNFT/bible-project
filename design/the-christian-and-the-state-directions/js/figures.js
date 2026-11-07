// The figures of The Christian and the state, drawn from data.js. Every word comes from the data as text; the only
// markup strings are the fixed drawings in art.js. Each figure states its question, carries the one sentence that
// reads it, and reaches the verse. On a phone the drawn form of a figure is left out and a plain list stands instead.
window.CSFigures = (() => {
  let h, refLink, art;
  const NS = "http://www.w3.org/2000/svg";
  function s(tag, attrs = {}, ...children) {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== null) element.setAttribute(key, value);
    element.append(...children.flat().filter((c) => c !== null && c !== undefined));
    return element;
  }
  const said = (item) => [h("q", { class: "cs-words" }, item.words), " ", refLink(item.r, item.ref), item.added ? h("span", { class: "cs-added" }, " · added by this page") : null];
  const ask = (question) => h("p", { class: "cs-ask-q" }, question);
  const reads = (sentence) => h("p", { class: "cs-reads" }, sentence);

  // ── 00 Whose is it? Words joined by fine lines to their place: the ruler's coin inside God's circle ──
  function whose(figure) {
    const C = { x: 500, y: 280 }, R = 220, r = 98;
    const at = (radius, degrees) => ({ x: C.x + radius * Math.cos(degrees * Math.PI / 180), y: C.y + radius * Math.sin(degrees * Math.PI / 180) });
    const ruler = figure.rows.filter((i) => i.col === "ruler"), god = figure.rows.filter((i) => i.col === "god"), cross = figure.rows.filter((i) => i.col === "cross");
    const reading = h("div", { class: "cs-whose-reading", "aria-live": "polite" });
    const svg = s("svg", { viewBox: "0 0 1000 560", class: "cs-whose-svg", role: "group", "aria-label": "Whose is it: the ruler's coin inside God's circle" });
    svg.append(s("circle", { class: "cs-w-god", cx: C.x, cy: C.y, r: R }), s("circle", { class: "cs-w-coin", cx: C.x, cy: C.y, r }),
      s("circle", { class: "cs-w-rim", cx: C.x, cy: C.y, r: r - 7 }),
      s("text", { class: "cs-w-tag", x: C.x, y: C.y - R + 34, "text-anchor": "middle" }, "God's"),
      s("text", { class: "cs-w-tag", x: C.x + 26, y: C.y + 5, "text-anchor": "middle" }, "Caesar's"));
    const marks = [];
    function place(item, dot, label, anchor, dashed) {
      const g = s("g", { class: `cs-w-item is-${item.col}`, tabindex: "0", role: "button", "aria-label": `${item.label}: ${item.words}, ${item.ref}` });
      const bend = anchor === "end" ? label.x + 12 : label.x - 12;
      g.append(s("path", { class: `cs-w-line${dashed ? " is-dashed" : ""}`, d: dashed ? dashed : `M${dot.x.toFixed(1)} ${dot.y.toFixed(1)}L${bend} ${label.y - 5}` }),
        s("path", { class: "cs-w-hit", d: dashed ? dashed : `M${dot.x.toFixed(1)} ${dot.y.toFixed(1)}L${bend} ${label.y - 5}` }),
        s("circle", { class: "cs-w-dot", cx: dot.x.toFixed(1), cy: dot.y.toFixed(1), r: 4.5 }),
        s("text", { class: "cs-w-label", x: label.x, y: label.y, "text-anchor": anchor }, item.label));
      const choose = () => show(item, g, true);
      g.addEventListener("click", choose);
      g.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); } });
      g.addEventListener("pointerenter", () => show(item, g, false));
      marks.push(g);
      svg.append(g);
    }
    ruler.forEach((item, i) => place(item, { x: C.x - 44 + Math.abs(i - (ruler.length - 1) / 2) * 9, y: C.y - 60 + (i * 120) / Math.max(ruler.length - 1, 1) }, { x: 210, y: 150 + i * 62 }, "end"));
    god.forEach((item, i) => place(item, at(160, -50 + (i * 100) / Math.max(god.length - 1, 1)), { x: 790, y: 130 + i * 62 }, "start"));
    cross.forEach((item, i) => {
      const fromGod = item.from === "god";
      const outer = at(170, fromGod ? -100 : 100), inner = at(40, fromGod ? -100 : 100);
      const [a, b] = fromGod ? [outer, inner] : [inner, outer];
      const path = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      place(item, b, { x: Math.round(outer.x), y: fromGod ? 40 : 544 }, "middle", path);
      svg.append(s("path", { class: "cs-w-end", d: fromGod
        ? `M${(b.x - 6).toFixed(1)} ${(b.y - 9).toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}L${(b.x + 8).toFixed(1)} ${(b.y - 6).toFixed(1)}`
        : `M${(b.x - 9).toFixed(1)} ${(b.y - 3).toFixed(1)}L${(b.x + 9).toFixed(1)} ${(b.y + 3).toFixed(1)}` }));
    });
    svg.append(s("text", { class: "cs-w-head", x: 210, y: 104, "text-anchor": "end" }, figure.columns.ruler),
      s("text", { class: "cs-w-head", x: 790, y: 84, "text-anchor": "start" }, figure.columns.god));
    function show(item, mark, keep) {
      marks.forEach((m) => m.classList.toggle("is-on", m === mark));
      svg.classList.add("is-pointing");
      reading.replaceChildren(h("span", { class: `cs-w-col is-${item.col}` }, figure.columns[item.col]), " ", h("b", {}, item.label), ". ", ...said(item).filter(Boolean),
        " · ", h("a", { class: "cs-link", href: `#part-${item.part}` }, `read in part ${item.part}`));
      if (keep) mark.setAttribute("aria-pressed", "true");
    }
    svg.addEventListener("pointerleave", () => svg.classList.remove("is-pointing"));
    reading.append("Point at a word to see its verse; choose it with a click or Enter to keep it here.");
    const lists = h("div", { class: "cs-whose-lists" }, ["ruler", "god", "cross"].map((col) => h("div", {},
      h("h3", {}, figure.columns[col]),
      h("ul", {}, figure.rows.filter((i) => i.col === col).map((item) => h("li", {}, h("b", {}, item.label), " ", said(item), " · ", h("a", { class: "cs-link", href: `#part-${item.part}` }, `part ${item.part}`)))))));
    return h("figure", { class: "cs-whose" }, ask("Whose is it: the ruler's, or God's alone?"),
      h("div", { class: "cs-whose-wide" }, svg, reading), lists, h("figcaption", {}, figure.read));
  }

  // ── 01 Six times, "He will take" ──
  function takes(figure) {
    const n = figure.rows.length;
    const lines = s("svg", { class: "cs-take-lines", viewBox: `0 0 100 ${n * 10}`, preserveAspectRatio: "none", "aria-hidden": "true" },
      figure.rows.map((_, i) => s("path", { d: `M0 ${i * 10 + 5}L100 ${n * 5}`, "vector-effect": "non-scaling-stroke" })));
    return h("figure", { class: "cs-fig cs-takes" }, ask(`What does the king take? Samuel says “take” ${figure.count} times.`),
      h("div", { class: "cs-take-grid" },
        h("ol", { class: "cs-take-rows", style: `--n:${n}` }, figure.rows.map((row) => h("li", {}, h("b", {}, row.label), h("span", {}, said(row))))),
        lines,
        h("div", { class: "cs-take-end" }, art(window.CSArt.seat, "cs-seat"), h("p", {}, said(figure.end)))),
      h("div", { class: "cs-pair" },
        h("p", {}, h("span", { class: "cs-label" }, "Asked of a king"), " ", said(figure.battles.asked)),
        h("p", {}, h("span", { class: "cs-label" }, "Done before by the LORD"), " ", said(figure.battles.before))),
      reads("Every line runs one way, to the seat. The last thing asked of the king is the work the LORD had done."));
  }

  // ── 02 The three limits, and Solomon's record ──
  function limits(figure) {
    return h("figure", { class: "cs-fig cs-limits" }, ask("What must the king not gather, and what did Solomon gather?"),
      h("div", { class: "cs-scroll" }, figure.rows.map((row) => h("div", { class: "cs-limit" },
        h("span", { class: "cs-label" }, row.label, " · ", row.means), h("p", {}, said(row.limit))))),
      h("div", { class: "cs-record" }, figure.rows.map((row) => h("div", {},
        h("p", { class: "cs-big" }, row.shown.map(([value, words], i) => h("span", {}, i ? " · " : "", h("b", {}, value), " ", words.replace(/^[\w,]+ (hundred )?/, "")))),
        h("p", {}, said(row.record))))),
      h("div", { class: "cs-pair" },
        h("p", {}, h("span", { class: "cs-label" }, "Warned"), " ", said(figure.heart.warned)),
        h("p", {}, h("span", { class: "cs-label" }, "Recorded of Solomon"), " ", said(figure.heart.happened))),
      reads("Each limit stands on the scroll; Solomon's record shows each one passed."));
  }

  // ── 03 What the first column holds ──
  function owed(figure) {
    return h("figure", { class: "cs-fig cs-owed" }, ask("What is the ruler owed?"),
      h("ul", {}, figure.rows.map((row) => h("li", {}, h("b", { class: "cs-verb" }, row.verb), h("span", { class: "cs-to" }, "to ", refLink(row.toRef, row.to)), h("span", {}, said(row))))),
      reads(figure.read));
  }

  // ── 04 Three collisions, command against answer ──
  function collisions(rows) {
    return h("figure", { class: "cs-fig cs-clash" }, ask("When a ruler claims God's column, what is said back?"),
      h("ol", {}, rows.map((row) => h("li", {},
        h("div", { class: "cs-cmd" }, h("span", { class: "cs-label" }, row.ruler, " · ", row.where), h("p", {}, said(row.command))),
        h("span", { class: "cs-meet", "aria-hidden": "true" }),
        h("div", { class: "cs-ans" }, h("span", { class: "cs-label" }, "The answer"), h("p", {}, said(row.answer)),
          h("p", { class: "cs-manner" }, said(row.manner)), row.after ? h("p", { class: "cs-manner" }, said(row.after)) : null)))),
      reads("Each answer refuses one command and nothing more."));
  }

  // ── 05 Who wrote what about the ruler and religion ──
  function dates(figure) {
    const first = Number(figure.rows[0].year), last = Number(figure.rows[figure.rows.length - 1].year);
    return h("figure", { class: "cs-fig cs-dates" }, ask("Who has written down what a ruler may do about religion?"),
      h("ol", { class: "cs-line" }, figure.rows.map((row, i) => {
        const at = ((Number(row.year) - first) / (last - first)) * 100;
        return h("li", { class: `is-${row.kind}${i % 2 ? " is-low" : ""}${at > 70 ? " is-right" : ""}`, style: `--at:${at.toFixed(2)}%` },
          h("span", { class: "cs-shape", "aria-hidden": "true" }),
          h("b", {}, row.year), h("span", { class: "cs-who" }, row.who), h("span", { class: "cs-kind" }, figure.kinds[row.kind]),
          h("span", { class: "cs-what" }, row.what),
          h("span", { class: "cs-check" }, h("span", { class: "cs-check-tag" }, "to check"), ` ${row.check}`));
      })),
      reads("Placed by year. The page's own short summaries of the study's paragraphs; the wording of each source is still to be checked."));
  }

  // ── 06 Isaiah's order, then the two answers on war ──
  function isaiah(figure) {
    const pictures = ["mountain", "scroll", "scales", "plow"];
    const v = figure.views;
    const view = (side, label) => h("div", { class: "cs-view" }, h("h3", {}, side.name), h("ul", {}, side.lines.map((line) => h("li", {}, line))),
      h("p", { class: "cs-tests" }, h("span", { class: "cs-label" }, label), " ", side.tests.join(" · ")));
    return h("figure", { class: "cs-fig cs-isaiah" }, ask("What has to happen before the swords are remade?"),
      h("ol", { class: "cs-steps" }, figure.steps.map((step, i) => h("li", {}, art(window.CSArt.steps[pictures[i]], "cs-step-art"), h("b", {}, step.label), h("span", {}, said(step))))),
      reads("The weapons are remade last, after the nations have learned and God has judged."),
      h("div", { class: "cs-views" }, view(v.just, "Its usual tests"), h("div", { class: "cs-both" }, h("h3", {}, "Both agree"), h("ul", {}, v.both.map((line) => h("li", {}, line)))), view(v.peace, "Held by")),
      reads("Every line here is the study's own words. This page does not choose between them."));
  }

  return {
    use(tools) { ({ h, refLink, art } = tools); },
    whose, takes, limits, owed, collisions, dates, isaiah,
  };
})();
