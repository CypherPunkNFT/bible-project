// The figures for Reading Daniel and Revelation: the two-book chart under the heading, and one figure per part, each
// drawn from data.js (every phrase in it checked against its verse by build-data.py). Each answers the question
// written above it and carries the sentence that reads it. Text goes in as text nodes only.
window.RDRFigs = ({ h, refLink, label, data }) => {
  const NS = "http://www.w3.org/2000/svg";
  function s(tag, attrs = {}, ...children) {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== null) element.setAttribute(key, value);
    element.append(...children.flat().filter(Boolean));
    return element;
  }
  const text = (x, y, words, cls) => { const t = s("text", { x, y, class: cls }); t.textContent = words; return t; };
  const fig = (question, body, reading, cls = "") => h("figure", { class: `rdr-fig ${cls}` },
    h("p", { class: "rdr-fig-q" }, question), body, h("figcaption", {}, reading));
  const cite = (id) => refLink(id, data.passages[id].label);
  // A control that can be chosen with a pointer or by keyboard; its own border shows it is chosen.
  function chooser(element, onChoose) {
    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");
    element.addEventListener("click", onChoose);
    element.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onChoose(); } });
    return element;
  }
  const pick = (group, chosen) => group.forEach((g) => g.setAttribute("aria-pressed", String(g === chosen)));

  // ── The two books, chapter by chapter ──
  // One column per chapter at one scale for both books. On a phone Revelation is drawn in two rows (1–11, 12–22) rather
  // than shrunk to fit one.
  function chart() {
    const { books, marks } = data.chart;
    const COL = 45, STEP = 3, TOP = 46;
    const detail = h("div", { class: "rdr-chart-detail", "aria-live": "polite" });
    const narrow = matchMedia("(max-width: 560px)");
    let chosen = { code: "REV", c: 4 };
    function show(book, row) {
      const code = book.code;
      const list = (word) => row[word].length
        ? row[word].flatMap((v, i) => [i ? " " : "", refLink(`${code}.${row.c}.${v}`, `${row.c}:${v}`)])
        : [h("span", { class: "rdr-none" }, "none")];
      detail.replaceChildren(
        h("p", { class: "rdr-chart-title" }, `${book.name} ${row.c}`, h("small", {}, ` · ${row.v} verses`)),
        h("p", {}, h("span", { class: "rdr-key-throne", "aria-hidden": "true" }), label("Throne"), " ", list("throne")),
        h("p", {}, h("span", { class: "rdr-key-beast", "aria-hidden": "true" }), label("Beast"), " ", list("beast")));
    }
    function drawRows(book, rows, columns) {
      const first = rows[0].c;
      const tall = Math.max(...book.chapters.map((r) => r.v)) * STEP;
      const svg = s("svg", { viewBox: `0 0 ${rows.length * COL} ${TOP + tall + 40}`, class: `rdr-chart rdr-chart-${book.code.toLowerCase()}${rows.length < book.chapters.length ? " rdr-chart-half" : ""}`, role: "group", "aria-label": `${book.name} ${first}–${rows.at(-1).c}, chapter by chapter` });
      let lastChapter = 0, lift = 0;
      for (const mark of marks.filter((m) => m.ref.startsWith(book.name))) {
        const [c, v] = mark.ref.split(" ")[1].split(":").map(Number);
        if (c < first || c > rows.at(-1).c) continue;
        lift = c === lastChapter ? lift + 12 : 0;  // two marks in one chapter stand one above the other
        lastChapter = c;
        const x = (c - first) * COL + COL / 2;
        svg.append(s("g", { class: `rdr-mark${mark.seal ? ` rdr-mark-${mark.seal}` : ""}` },
          s("path", { d: `M${x} ${TOP + v * STEP}V${TOP - 6 - lift}` }), text(x, TOP - 10 - lift, mark.label, "rdr-mark-label")));
      }
      rows.forEach((row) => {
        const x = (row.c - first) * COL + 8;
        const g = s("g", { class: "rdr-col", "aria-label": `${book.name} ${row.c}: ${row.v} verses; a throne in ${row.throne.length}, a beast in ${row.beast.length}` },
          s("rect", { class: "rdr-col-bg", x, y: TOP, width: COL - 16, height: row.v * STEP, rx: 3 }));
        if (book.code === "DAN" && row.c >= 2 && row.c <= 7) {
          const from = row.c === 2 ? 4 : 1, to = row.c === 7 ? 28 : row.v;
          g.append(s("rect", { class: "rdr-aramaic", x, y: TOP + (from - 1) * STEP, width: COL - 16, height: (to - from + 1) * STEP }));
        }
        row.throne.forEach((v) => g.append(s("circle", { class: "rdr-dot-throne", cx: x + 8, cy: TOP + (v - 0.5) * STEP, r: 2.6 })));
        row.beast.forEach((v) => { const cy = TOP + (v - 0.5) * STEP, cx = x + COL - 24; g.append(s("path", { class: "rdr-dot-beast", d: `M${cx} ${cy - 3}l3 3-3 3-3-3Z` })); });
        g.append(text(x + (COL - 16) / 2, TOP + tall + 16, String(row.c), "rdr-col-n"));
        if (chosen.code === book.code && chosen.c === row.c) g.classList.add("is-chosen");
        chooser(g, () => { columns.forEach((c) => c.classList.remove("is-chosen")); g.classList.add("is-chosen"); chosen = { code: book.code, c: row.c }; show(book, row); });
        columns.push(g);
        svg.append(g);
      });
      if (book.code === "DAN") {
        const y = TOP + tall + 32;
        svg.append(s("path", { class: "rdr-bracket", d: `M8 ${y - 6}v6H${6 * COL - 8}v-6M${6 * COL + 8} ${y - 6}v6H${12 * COL - 8}v-6` }));
      }
      return svg;
    }
    const area = h("div", { class: "rdr-chart-area" });
    function layout() {
      const columns = [];
      area.replaceChildren(...books.map((book) => {
        const halves = narrow.matches && book.chapters.length > 12 ? [book.chapters.slice(0, 11), book.chapters.slice(11)] : [book.chapters];
        return h("div", { class: "rdr-chart-book" }, h("p", { class: `rdr-chart-name rdr-${book.code === "DAN" ? "dan" : "rev"}` }, book.name,
          h("small", {}, book.code === "DAN" ? " · chapters 1–6 stories, 7–12 visions; the shaded run is Aramaic" : ` · ${book.chapters.length} chapters, ${data.numbers.revVerses} verses`)),
          halves.map((rows) => drawRows(book, rows, columns)));
      }));
    }
    narrow.addEventListener("change", layout);
    layout();
    const filters = ["Both", "Throne", "Beast"].map((name) => h("button", { type: "button", class: "rdr-filter", "aria-pressed": String(name === "Both"),
      onclick: (event) => { pick(filters, event.currentTarget); holder.dataset.show = name.toLowerCase(); } }, name));
    const holder = h("div", { class: "rdr-chart-wrap", "data-show": "both" },
      h("div", { class: "rdr-chart-tools" }, h("span", { class: "rdr-legend" }, h("span", { class: "rdr-key-throne", "aria-hidden": "true" }), "a verse naming a throne", h("span", { class: "rdr-key-beast", "aria-hidden": "true" }), "a verse naming a beast"), h("span", { class: "rdr-filters", role: "group", "aria-label": "Show" }, filters)),
      area, detail);
    show(books[1], books[1].chapters[3]);
    return fig("Point at a chapter, or choose it, to list its verses.", holder,
      `A count of the words, not of the visions: Daniel 4's beasts are animals of the field, and so are the “wild beasts” of Revelation 6:8. The first beast of John's visions comes up from the Abyss at 11:7; the beast from the sea rises at 13:1. A throne is in Revelation from ${data.numbers.throneFirst}.`, "rdr-fig-chart");
  }

  // ── 01 What kind of writing this is ──
  function part01() {
    const names = h("ol", { class: "rdr-names" }, data.names.map((n) => h("li", {}, h("b", {}, n.name), h("q", {}, n.t), refLink(n.r, n.ref.replace("Revelation ", "")))));
    const dan = data.chart.books[0].chapters;
    const total = dan.reduce((sum, r) => sum + r.v, 0);
    const at = (c, v) => dan.filter((r) => r.c < c).reduce((sum, r) => sum + r.v, 0) + v - 1;
    const W = 600, x = (n) => (n / total) * W;
    const [c1, v1] = "2:4".split(":").map(Number), [c2, v2] = "7:28".split(":").map(Number);
    const bar = s("svg", { viewBox: `0 0 ${W} 74`, class: "rdr-halves", role: "img", "aria-label": `Daniel's ${total} verses: chapters 1 to 6 stories, 7 to 12 visions; ${data.numbers.aramaic} verses in Aramaic from 2:4 to 7:28` },
      s("rect", { class: "rdr-aramaic", x: x(at(c1, v1)), y: 18, width: x(at(c2, v2) + 1) - x(at(c1, v1)), height: 22 }),
      dan.map((r) => s("rect", { class: "rdr-ch", x: x(at(r.c, 1)) + 0.5, y: 18, width: x(r.v) - 1, height: 22 })),
      text(x(at(c1, v1)), 12, `Aramaic, 2:4–7:28 · ${data.numbers.aramaic} verses`, "rdr-svg-small"),
      text(0, 58, data.halves[0].name, "rdr-svg-small"), text(x(at(7, 1)), 58, data.halves[1].name, "rdr-svg-small"),
      s("path", { class: "rdr-bracket", d: `M1 46v4H${x(at(7, 1)) - 4}v-4M${x(at(7, 1)) + 4} 46v4H${W - 1}v-4` }));
    return fig("What does each book say it is?", h("div", {}, names, bar,
      h("p", { class: "rdr-fig-note" }, "Daniel's verses to scale. ", h("q", {}, data.halves[1].t), " begins at ", refLink(data.halves[1].r, "7:15"), "; the Aramaic run follows the Berean's note at ", refLink("DAN.2.4", "2:4"), ".")),
      "Revelation names itself three ways in four verses: an unveiling, a prophecy, and a letter to be read aloud in church.");
  }

  // ── 02 Pictures that explain themselves ──
  function part02() {
    const pairs = h("div", { class: "rdr-heard" }, data.heardSeen.map((p) => h("div", { class: "rdr-pair" },
      h("p", {}, h("span", { class: "rdr-sense" }, "Heard"), h("q", {}, p.heard), " ", refLink(p.h, p.hr.replace("Revelation ", ""))),
      h("span", { class: "rdr-turn", "aria-hidden": "true" }),
      h("p", {}, h("span", { class: "rdr-sense" }, "Seen"), h("q", {}, p.seen), " ", refLink(p.s, p.sr.replace("Revelation ", ""))))));
    const left = h("ul", { class: "rdr-unsaid" }, data.unexplained.map((u) => h("li", {}, h("q", {}, u.t), " ", refLink(u.r, u.ref), h("span", { class: "rdr-unsaid-end" }, "not explained"))));
    return fig("What does John hear, and what does he see?", h("div", {}, pairs, h("p", { class: "rdr-fig-sub" }, label("Left unexplained")), left),
      "Twice John hears one thing and turns to see another. The text gives the order, heard and then seen; where it does not explain, the page leaves the line open.");
  }

  // ── 03 Old pictures in a new vision ──
  function part03() {
    const howWords = { heading: "the Berean's heading names it", note: "the Berean's note names it", side: "read side by side" };
    const rows = h("ol", { class: "rdr-echoes" }, data.echoes.map((e) => h("li", { class: `rdr-echo rdr-how-${e.how}` },
      h("p", { class: "rdr-echo-new" }, h("q", {}, e.rev), refLink(e.r, e.rr)),
      h("span", { class: "rdr-echo-line", "aria-hidden": "true" }),
      h("p", { class: "rdr-echo-old" }, h("q", {}, e.old), refLink(e.o, e.or)),
      h("small", {}, e.name, " · ", howWords[e.how], e.at ? ` (at ${e.at})` : ""))));
    return fig("Where has Scripture used this picture before?", h("div", {},
      h("p", { class: "rdr-echo-legend" }, h("span", {}, "Revelation"), h("span", {}, "the older passage")), rows),
      "A solid line where the Berean's own heading or footnote names the older passage; a dashed line where the two were read side by side. An echo is not a quotation.");
  }

  // ── 04 Numbers that speak ──
  function part04() {
    const W = 600;
    const rows = data.half.map((f) => {
      let marks;
      if (f.units) {
        let x = 0;
        marks = f.units.map((u) => { const w = (u / 3.5) * W; const r = s("rect", { class: "rdr-unit", x: x + 2, y: 4, width: w - 4, height: 14, rx: 2 }); x += w; return r; });
      } else {
        let d = "";
        for (let i = 0; i < f.count; i += 1) { const x = (i / f.count) * W + W / f.count / 2; d += `M${x.toFixed(2)} 4V18`; }
        marks = [s("path", { class: f.count > 100 ? "rdr-hair" : "rdr-tick", d })];
      }
      return h("div", { class: "rdr-span" }, h("p", {}, h("q", {}, f.form), " ", f.rs.flatMap((r, i) => [i ? "; " : "", cite(r)])),
        s("svg", { viewBox: `0 0 ${W} 22`, role: "img", "aria-label": `${f.form}, drawn to the same length as the other two forms` }, marks));
    });
    const w = data.weeks, cell = W / 74;
    const weekRow = (shape) => {
      const out = [];
      for (let i = 0; i < 70; i += 1) {
        const x = (i + (shape === "gap" && i === 69 ? 4 : 0)) * cell;
        out.push(s("rect", { class: i < w.split[0] ? "rdr-wk rdr-wk-a" : i < 69 ? "rdr-wk rdr-wk-b" : "rdr-wk rdr-wk-last", x: x + 1, y: 4, width: cell - 2, height: 12 }));
      }
      if (shape === "gap") out.push(s("path", { class: "rdr-wk-gap", d: `M${69 * cell + 3} 10H${73 * cell - 3}` }));
      return out;
    };
    const weeks = h("div", { class: "rdr-weeks" },
      h("p", {}, h("q", {}, w.t), " ", refLink(w.r, "9:25"), "; the Messiah ", h("q", {}, "cut off"), " ", refLink(w.cr, "9:26"), "; then one more, ", h("q", {}, w.last), " ", refLink(w.lr, "9:27"), "."),
      w.readings.map((r) => h("div", { class: "rdr-week-reading" }, h("p", {}, h("b", {}, r.who), " · ", r.says),
        s("svg", { viewBox: `0 0 ${W} 20`, role: "img", "aria-label": `${r.who}: seventy weeks, ${r.shape === "gap" ? "sixty-nine, then a gap, then the last" : "all seventy joined"}` }, weekRow(r.shape)))));
    return fig("Three and a half, counted three ways: are they the same span?", h("div", {}, rows, h("p", { class: "rdr-fig-sub" }, label("Seventy weeks, read two ways")), weeks),
      "Drawn to one length, because 42 months of 30 days is 1,260 days. The weeks are shown as the two readings count them; the page does not choose, and no number here is a date.");
  }

  // ── 05 Beasts and thrones ──
  function part05() {
    const bands = [[52, 18, 30, 30], [40, 48, 54, 34], [44, 82, 46, 34], [46, 116, 42, 46], [44, 162, 46, 16]];
    const detail = h("div", { class: "rdr-statue-detail", "aria-live": "polite" });
    const parts = [];
    const showPart = (p, i) => {
      detail.replaceChildren(h("p", {}, h("b", {}, p.part), " · ", h("q", {}, p.metal), " ", cite(p.r)),
        h("p", {}, "Daniel: ", h("q", {}, p.means), " ", cite(p.m)),
        h("p", { class: "rdr-empires" }, data.empires.map((e) => h("span", {}, h("small", {}, e.who), e.names[i] ?? (i === 4 ? "—" : "not named here")))));
      parts.forEach((g, j) => g.classList.toggle("is-chosen", j === i));
    };
    const svg = s("svg", { viewBox: "0 0 140 200", class: "rdr-statue", role: "group", "aria-label": "The statue of Daniel 2, in five parts" },
      data.statue.map((p, i) => {
        const [x, y, w, hgt] = bands[i];
        const g = s("g", { class: `rdr-band rdr-band-${i}`, "aria-label": `${p.part}: ${p.metal}` },
          i === 0 ? s("ellipse", { cx: x + w / 2, cy: y + hgt / 2, rx: w / 2, ry: hgt / 2 }) : s("rect", { x, y, width: w, height: hgt, rx: 4 }));
        chooser(g, () => showPart(p, i));
        parts.push(g);
        return g;
      }),
      s("path", { class: "rdr-stone", d: "M108 176c4-8 14-10 20-4 4 6-2 14-10 14s-12-4-10-10Z" }), s("path", { class: "rdr-faint", d: "M106 172L92 170" }));
    showPart(data.statue[0], 0);
    const given = h("ol", { class: "rdr-given" }, data.given.map((g) => h("li", {}, h("q", {}, g.t), " ", refLink(g.r, g.ref.replace("Revelation ", "")))));
    return fig("What is the statue, and what is the beast given?", h("div", {},
      h("div", { class: "rdr-statue-wrap" }, svg, detail),
      h("p", { class: "rdr-stone-line" }, h("q", {}, data.stone.t), " ", cite(data.stone.r), ": ", h("q", {}, data.stone.means), " ", cite(data.stone.m), "."),
      h("p", { class: "rdr-fig-sub" }, label("What the beast was given · Revelation 13:2–7")), given),
      "Choose a part of the statue. Daniel names only the head; the lists show two readings of the four without choosing. Everything the beast has, it was given.");
  }

  // ── 06 Four ways to read Revelation ──
  function part06() {
    const wrap = h("div", { class: "rdr-ways" },
      h("p", { class: "rdr-ways-centre" }, "The beast from the sea", h("br"), refLink("REV.13.1-8", "Revelation 13:1–8")),
      data.ways.map((w, i) => h("div", { class: `rdr-way rdr-way-${i}` }, h("b", {}, w.way), h("span", {}, w.beast), h("small", {}, w.holder))));
    const shared = h("ul", { class: "rdr-shared" }, data.shared.map((t) => h("li", {}, t)));
    return fig("One picture, read four ways: what changes, and what does not?", h("div", {}, wrap, h("p", { class: "rdr-fig-sub" }, label("All four agree")), shared),
      "Each way of reading names the beast differently. All four hold that it is real, opposed to Christ, permitted and limited, and that it falls. The page shows the four and does not choose.");
  }

  // ── 07 Written to comfort ──
  function part07() {
    const W = 320, H = 250, lon0 = 26.3, lon1 = 30.0, lat0 = 37.1, lat1 = 39.4;
    const px = (p) => [((p.lon - lon0) / (lon1 - lon0)) * W, ((lat1 - p.lat) / (lat1 - lat0)) * H];
    const detail = h("div", { class: "rdr-map-detail", "aria-live": "polite" });
    const dots = [];
    const show = (c, i) => {
      detail.replaceChildren(h("p", {}, h("b", {}, c.name), " · the one who overcomes"), h("p", {}, h("q", {}, c.promise), " ", cite(c.r)));
      dots.forEach((d, j) => d.classList.toggle("is-chosen", j === i));
    };
    const route = data.churches.map(px).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
    const [patX, patY] = px(data.patmos), [ephX, ephY] = px(data.churches[0]);
    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "rdr-map", role: "group", "aria-label": "Patmos and the seven churches, in the order of the letters" },
      s("path", { class: "rdr-route", d: route }), s("path", { class: "rdr-sent", d: `M${patX} ${patY}L${ephX} ${ephY}` }),
      s("g", { class: "rdr-patmos" }, s("circle", { cx: patX, cy: patY, r: 3 }), text(patX + 6, patY + 4, "Patmos", "rdr-svg-small")),
      data.churches.map((c, i) => {
        const [x, y] = px(c);
        const g = s("g", { class: "rdr-city", "aria-label": `${c.name}: ${c.promise}` }, s("circle", { cx: x, cy: y, r: 5 }), text(x + 8, y + 4, c.name, "rdr-svg-small"));
        chooser(g, () => show(c, i));
        dots.push(g);
        return g;
      }));
    show(data.churches[1], 1);
    return fig("Where were the seven churches, and what was each promised?", h("div", { class: "rdr-map-wrap" }, svg, detail),
      "Points only, at the modern sites; no coastline is drawn. The line follows the order of the letters, from Ephesus to Laodicea. Every letter holds a promise for the one who overcomes.");
  }

  return { chart, "01": part01, "02": part02, "03": part03, "04": part04, "05": part05, "06": part06, "07": part07 };
};
