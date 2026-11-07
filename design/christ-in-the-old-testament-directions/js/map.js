// The two data drawings for Christ in the Old Testament: the anatomy of one line (the study's three questions placed
// on the line they ask about) and the map of every line the New Testament draws on this page. Every element is made
// with createElement / createElementNS and text nodes; numbers are coerced before they become attributes.
window.COTMap = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const SHORT = { GEN: "Gen", EXO: "Exod", LEV: "Lev", NUM: "Num", DEU: "Deut", JOS: "Josh", "2SA": "2 Sam", "1KI": "1 Kgs",
    "2KI": "2 Kgs", ISA: "Isa", JON: "Jonah", PSA: "Ps", MAT: "Matt", LUK: "Luke", JHN: "John", ACT: "Acts", ROM: "Rom",
    "1CO": "1 Cor", HEB: "Heb", "1PE": "1 Pet", REV: "Rev" };
  const CANON = ["GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH",
    "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM",
    "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH",
    "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"];
  const KIND = { quote: "quotes it", names: "names it", either: "one possible source; the text does not say which" };

  function svg(tag, attrs = {}, ...children) {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null) element.setAttribute(key, typeof value === "number" ? String(Number(value)) : value);
    }
    element.append(...children.filter(Boolean));
    return element;
  }
  const nodeName = (node) => { const [code, chapter] = node.split("."); return `${SHORT[code] || code} ${Number(chapter)}`; };
  const order = (node) => CANON.indexOf(node.split(".")[0]) * 1000 + Number(node.split(".")[1]);
  const curve = (x1, y1, x2, y2) => `M${Number(x1)} ${Number(y1)}C${Number(x1)} ${(Number(y1) + Number(y2)) / 2} ${Number(x2)} ${(Number(y1) + Number(y2)) / 2} ${Number(x2)} ${Number(y2)}`;

  // The anatomy: a New Testament verse (1), the line back to the Old Testament passage (2), the bar where it stops (3).
  function anatomy() {
    return svg("svg", { viewBox: "0 0 900 150", class: "cot-anatomy-art", "aria-hidden": "true" },
      svg("path", { class: "cot-band-rule", d: "M20 30h860M20 128h860" }),
      svg("text", { x: 20, y: 20, class: "cot-axis" }, "OLD TESTAMENT"),
      svg("text", { x: 20, y: 146, class: "cot-axis" }, "NEW TESTAMENT"),
      svg("path", { class: "cot-arc is-on", d: "M150 128C150 79 450 79 450 30" }),
      svg("path", { class: "cot-arc is-on", d: "M450 30C520 30 600 40 700 64" }),
      svg("path", { class: "cot-stop", d: "M700 50v28" }),
      svg("circle", { class: "cot-node is-nt", cx: 150, cy: 128, r: 6 }),
      svg("circle", { class: "cot-node", cx: 450, cy: 30, r: 6 }),
      ...[[150, 104, "1"], [300, 70, ""], [450, 54, "2"], [720, 92, "3"]].filter((c) => c[2]).map(([x, y, n]) =>
        svg("g", { class: "cot-callout" }, svg("circle", { cx: x, cy: y, r: 11 }), svg("text", { x, y: y + 4, "text-anchor": "middle" }, n))));
  }

  // The map: the Old Testament along the top in the three parts Luke 24:44 names, the New Testament along the bottom,
  // and one curve per line. Returns { element, setFigure }.
  function map(data, h, refLink) {
    const { lines, passages, heading } = data;
    const W = 1100, TOP = 74, BOTTOM = 300, PAD = 30;
    const otNodes = [...new Set(lines.map((l) => l.node))].sort((a, b) => order(a) - order(b));
    const ntNodes = [...new Set(lines.map((l) => l.ntnode))].sort((a, b) => order(a) - order(b));
    const bands = heading.bands.map((b) => ({ ...b, nodes: otNodes.filter((n) => lines.find((l) => l.node === n).band === b.id) }));
    const x = {};
    const unit = (W - PAD * 2) / otNodes.length;
    let left = PAD;
    const bandMarks = bands.map((band) => {
      const width = unit * band.nodes.length;
      band.nodes.forEach((n, i) => { x[`ot:${n}`] = left + unit * (i + 0.5); });
      const mark = svg("g", { class: "cot-band" },
        svg("path", { d: `M${left + 4} 34h${width - 8}` }),
        svg("text", { x: left + 6, y: 26 }, band.name.toUpperCase()));
      left += width;
      return mark;
    });
    const ntUnit = (W - PAD * 2) / ntNodes.length;
    ntNodes.forEach((n, i) => { x[`nt:${n}`] = PAD + ntUnit * (i + 0.5); });

    const readout = h("p", { class: "cot-readout", "aria-live": "polite" }, "Point at a line to read both verses here; choose it to open the New Testament verse.");
    const arcs = lines.map((line, index) => {
      const d = curve(x[`nt:${line.ntnode}`], BOTTOM, x[`ot:${line.node}`], TOP);
      const label = `${passages[line.ntr].label} draws a line to ${passages[line.otr].label} (${KIND[line.kind]})`;
      const link = svg("a", { href: `?ref=${line.ntr}`, class: `cot-ref cot-line is-${line.kind}`, "data-ref": line.ntr, "data-fig": line.fig, "data-i": index, "aria-label": label },
        svg("path", { class: "cot-hit", d }), svg("path", { class: "cot-arc", d }));
      const show = () => {
        readout.replaceChildren(
          h("span", { class: "cot-readout-fig" }, heading.figures.find((f) => f[0] === line.fig)[1]), " ",
          refLink(line.ntr, passages[line.ntr].label), " “", line.nt_words, "” ",
          h("span", { class: "cot-readout-arrow", "aria-hidden": "true" }, "→"), " ",
          refLink(line.otr, passages[line.otr].label), " “", line.ot_words, "”",
          h("small", {}, ` · ${KIND[line.kind]}`));
      };
      link.addEventListener("mouseenter", show);
      link.addEventListener("focus", show);
      return link;
    });
    const nodes = [
      ...otNodes.map((n) => svg("g", { class: "cot-node-g", "data-node": n },
        svg("circle", { class: "cot-node", cx: x[`ot:${n}`], cy: TOP, r: 4.5 }),
        svg("text", { x: x[`ot:${n}`], y: TOP - 12, "text-anchor": "middle" }, nodeName(n)))),
      ...ntNodes.map((n) => svg("g", { class: "cot-node-g", "data-node": n },
        svg("circle", { class: "cot-node is-nt", cx: x[`nt:${n}`], cy: BOTTOM, r: 4.5 }),
        svg("text", { x: x[`nt:${n}`], y: BOTTOM + 22, "text-anchor": "middle" }, nodeName(n)))),
    ];
    const art = svg("svg", { viewBox: `0 0 ${W} 340`, class: "cot-map-art", role: "group", "aria-label": "Lines the New Testament draws to the Old Testament" },
      ...bandMarks, svg("path", { class: "cot-band-rule", d: `M${PAD} ${BOTTOM + 30}h${W - PAD * 2}` }),
      ...arcs, ...nodes);

    // The same lines as a list, shown instead of the map where the map does not fit.
    const list = h("div", { class: "cot-map-list" }, heading.figures.map(([fig, name]) => h("section", { "data-fig": fig },
      h("h3", {}, name),
      h("ul", {}, lines.filter((l) => l.fig === fig).map((l) => h("li", { class: `is-${l.kind}` },
        refLink(l.ntr, passages[l.ntr].label), " “", l.nt_words, "” ",
        h("span", { "aria-hidden": "true" }, "→"), " ", refLink(l.otr, passages[l.otr].label), " “", l.ot_words, "”",
        l.kind === "either" ? h("small", {}, ` · ${KIND.either}`) : null))))));

    const count = h("p", { class: "cot-count", "aria-live": "polite" });
    function setFigure(fig) {
      const used = new Set();
      let shown = 0;
      arcs.forEach((arc) => {
        const f = arc.getAttribute("data-fig");
        const on = fig === "all" ? f !== "06" : fig === "every" ? true : f === fig;
        arc.style.display = on ? "" : "none";
        if (on) { shown += 1; const l = lines[Number(arc.getAttribute("data-i"))]; used.add(l.node); used.add(l.ntnode); }
      });
      nodes.forEach((g) => g.classList.toggle("is-dim", !used.has(g.getAttribute("data-node"))));
      list.querySelectorAll("section").forEach((s) => { const f = s.dataset.fig; s.hidden = !(fig === "every" || (fig === "all" ? f !== "06" : f === fig)); });
      count.textContent = `${shown} line${shown === 1 ? "" : "s"} shown`;
    }
    return { art, readout, list, count, setFigure };
  }

  return { anatomy, map, KIND, svg };
})();
