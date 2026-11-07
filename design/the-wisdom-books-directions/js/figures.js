// The wisdom books: the figures beside the text, each drawn from data.js (checked by build-data.py). Text goes in as
// text nodes; the only markup strings are the fixed shapes in art.js.
window.WBFigures = (() => {
  let h, refLink, art;
  const use = (tools) => ({ h, refLink, art } = tools);
  const SVG = "http://www.w3.org/2000/svg";
  const q = (text) => `“${text}”`;
  const cite = (item) => refLink(item.r, item.label);
  const says = (item, className = "wb-says") => h("span", { class: className }, q(item.words), " ", cite(item));

  // 00 Who is speaking? Four columns of floating words; three run down to the shared line, the Song stops short.
  function voices(books, floorName, songNote) {
    return h("figure", { class: "wb-voices", "aria-labelledby": "wb-voices-cap" },
      h("figcaption", { id: "wb-voices-cap", class: "wb-cap" }, "Four books, four kinds of saying, and who speaks in each"),
      h("div", { class: "wb-cols" }, books.map((book) => h("section", { class: `wb-col ${book.floor.length ? "meets" : "stops"}`, "aria-label": book.book },
        h("p", { class: "wb-kind" }, art(WBArt.kinds[book.shape], "wb-kind-mark"), book.kind),
        h("h3", { class: "wb-book" }, book.book),
        h("ul", { class: "wb-voice-list" }, book.voices.map((voice) => h("li", { class: voice.verdict ? "is-judged" : "" },
          h("span", { class: "wb-voice" }, voice.name),
          voice.verdict ? h("span", { class: "wb-verdict-tag" }, "God's verdict on what they said about Him") : null,
          says(voice)))),
        book.floor.length
          ? h("div", { class: "wb-floor" }, h("span", { class: "wb-floor-name" }, floorName), book.floor.map((point) => says(point, "wb-floor-says")))
          : h("div", { class: "wb-end" }, says(book.end, "wb-end-says"), h("p", {}, songNote))))));
  }

  // 01 The shaft: one row per layer, the poem's order going down; the rising line on the right.
  function shaft(data) {
    return h("figure", { class: "wb-shaft-fig", "aria-labelledby": "wb-shaft-cap" },
      h("figcaption", { id: "wb-shaft-cap", class: "wb-cap" }, "Down the shaft, in the poem's own order, then up to the One who knows the way · ", refLink(data.range, "Job 28")),
      h("ol", { class: "wb-up" }, data.up.slice().reverse().map((item) => h("li", {}, h("span", { class: "wb-rise", "aria-hidden": "true" }), h("div", {}, h("b", {}, item.label_page), says(item))))),
      h("ol", { class: "wb-layers" },
        data.down.map((item, i) => h("li", { style: `--depth:${i}` }, h("span", { class: "wb-layer-cut", "aria-hidden": "true" }), h("div", {}, h("b", {}, item.label_page), says(item)))),
        h("li", { class: "wb-bottom" }, h("span", { class: "wb-layer-cut", "aria-hidden": "true" }), h("div", {}, h("b", {}, data.bottom)))));
  }

  // 02 What the reader knows and Job does not; God's questions along one arc; the two verdicts.
  function questions(data) {
    const width = 900, height = 300, cx = 450, cy = 312, rx = 320, ry = 272;
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", "wb-arc");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "God's questions, in their order in Job 38 to 41");
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`);
    path.setAttribute("class", "wb-arc-line");
    path.setAttribute("aria-hidden", "true");
    svg.append(path);
    const count = data.items.length;
    data.items.forEach((item, i) => {
      const angle = Math.PI - (Math.PI * (i + 0.5)) / count;
      const x = cx + rx * Math.cos(angle), y = cy - ry * Math.sin(angle);
      const link = document.createElementNS(SVG, "a");
      link.setAttribute("href", `?ref=${encodeURIComponent(item.r)}`);
      link.setAttribute("class", "wb-ref wb-arc-word");
      link.setAttribute("data-ref", item.r);
      const dot = document.createElementNS(SVG, "circle");
      Object.entries({ cx: x, cy: y, r: 3.5, class: "wb-arc-dot" }).forEach(([k, v]) => dot.setAttribute(k, v));
      const label = document.createElementNS(SVG, "text");
      const outward = 18;
      // At the very top the two words would touch, so the one right of centre sits under the line.
      const top = Math.abs(Math.cos(angle)) < 0.15;
      const place = top ? { x, y: Math.cos(angle) > 0 ? y + 28 : y - 14, "text-anchor": "middle" }
        : { x: x + outward * Math.cos(angle), y: y - outward * Math.sin(angle) + 5, "text-anchor": i < count / 2 ? "end" : "start" };
      Object.entries(place)
        .forEach(([k, v]) => label.setAttribute(k, v));
      label.textContent = item.words;
      const title = document.createElementNS(SVG, "title");
      title.textContent = item.label;
      link.append(title, dot, label);
      svg.append(link);
    });
    return h("figure", { class: "wb-asks", "aria-labelledby": "wb-asks-cap" },
      h("dl", { class: "wb-knows" },
        h("div", {}, h("dt", {}, "The reader"), h("dd", {}, data.reader_line, " ", says(data.reader))),
        h("div", {}, h("dt", {}, "Job"), h("dd", {}, data.job_line))),
      h("figcaption", { id: "wb-asks-cap", class: "wb-cap" }, "What God shows Job, in order"),
      svg,
      h("ol", { class: "wb-ask-list" }, data.items.map((item) => h("li", {}, refLink(item.r, item.words)))),
      h("div", { class: "wb-verdicts" }, data.verdicts.map((v) => h("section", {},
        h("h4", {}, `God to ${v.who}`),
        v.lines.map((line) => h("p", {}, says(line)))))));
  }

  // 03 Two doors with the same line over them; two tables with the same call.
  function proverbs(data) {
    const lintel = (door) => {
      const rest = door.words.slice(data.shared.length);
      return h("div", { class: "wb-door" }, h("span", { class: "wb-door-label" }, door.label_page),
        h("p", {}, h("span", { class: "wb-same" }, data.shared), rest, " ", cite(door)));
    };
    return h("figure", { class: "wb-house", "aria-label": "The two doors of Proverbs 1 to 9, and its two tables" },
      h("div", { class: "wb-doors" }, data.doors.map(lintel)),
      h("div", { class: "wb-tables" }, data.tables.map((table, i) => h("section", { class: `wb-table ${i ? "is-folly" : "is-wisdom"}` },
        h("h4", {}, table.host),
        h("p", { class: "wb-call" }, table.callText, " ", refLink(table.call, table.callLabel)),
        i ? h("p", { class: "wb-same-note" }, "Word for word the same call as Wisdom's.") : null,
        h("p", { class: "wb-small" }, "Offers"),
        table.offers.map((offer) => h("p", {}, says(offer))),
        table.unsaid ? [h("p", { class: "wb-small" }, "What Folly does not say"), h("p", { class: "wb-unsaid" }, says(table.unsaid))] : null))));
  }

  // 04 The pair, mirrored; then three sayings with what stands beside them.
  function pair(data) {
    return h("figure", { class: "wb-pair-fig", "aria-label": "Proverbs 26:4 and 26:5 side by side, and three sayings read beside other words" },
      h("div", { class: "wb-mirror" }, data.sides.map((side) => h("p", {}, h("b", {}, side.head), ` ${side.rest} `, refLink(side.r, side.label)))),
      h("table", { class: "wb-beside" },
        h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "The saying"), h("th", { scope: "col" }, "What stands beside it"))),
        h("tbody", {}, data.beside.map((row) => h("tr", {},
          h("td", {}, says(row.saying)),
          h("td", {}, row.beside.study ? h("span", { class: "wb-says" }, row.beside.study, ". ", h("span", { class: "wb-small" }, "This study")) : says(row.beside)))))));
  }

  // 05 Fourteen pairs, read out of the verses by the build.
  function times(data) {
    return h("figure", { class: "wb-times", "aria-labelledby": "wb-times-cap" },
      h("figcaption", { id: "wb-times-cap", class: "wb-cap" }, `${data.pairs.length} pairs of times · `, refLink(data.r, data.label)),
      h("ol", {}, data.pairs.map(([first, second]) => h("li", {}, h("span", {}, first), h("span", { class: "wb-times-mid", "aria-hidden": "true" }), h("span", {}, second)))));
  }

  // 06 The refrain three times; belonging three times, the second half changing.
  function refrains(data) {
    return h("figure", { class: "wb-refrains", "aria-label": "The Song's two refrains" },
      h("div", { class: "wb-refrain" }, h("p", { class: "wb-refrain-words" }, q(data.words)),
        h("p", { class: "wb-small" }, "The same words three times · ", data.verses.map((v, i) => [i ? " · " : "", cite(v)]))),
      h("ol", { class: "wb-belong" }, data.belonging.map((line, i) => h("li", { style: `--step:${i}` },
        h("span", {}, line.first, " and "), h("em", {}, line.second), " ", refLink(line.r, line.label)))));
  }

  return { use, voices, shaft, questions, proverbs, pair, times, refrains };
})();
