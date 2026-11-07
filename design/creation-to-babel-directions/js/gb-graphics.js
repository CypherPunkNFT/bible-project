// Genesis 1–11: the data graphics. Every number and phrase drawn here was checked in its verse by build-data.py.
// Each graphic states the question it answers and the one sentence that reads it, and reaches the verse.
window.GBGraphics = (() => {
  const { h, s } = GBCore;

  // ── The chapters and the questions: Genesis 1:1–12:1 as one line of verses, each question an arc over what it reads ──
  function band(data, ui, onPick, onPoint) {
    const { chapters, questions, lanes, verses } = data.band;
    const total = verses + 1, width = 1000, base = 34 + lanes * 26, x = (i) => 8 + (i / total) * (width - 16);
    const svg = s("svg", { viewBox: `0 0 ${width} ${base + 34}`, class: "gb-band-svg", "aria-hidden": "true" });
    let at = 0;
    chapters.forEach(([chapter, count]) => {
      const x0 = x(at), x1 = x(at + count);
      const last = chapter === 12;
      svg.append(s("rect", { x: x0 + 1, y: base, width: Math.max(1, x1 - x0 - 2), height: 10, class: last ? "gb-band-one" : "gb-band-ch" }),
        s("text", { x: (x0 + x1) / 2, y: base + 28, class: "gb-band-n" }, last ? "12:1" : String(chapter)));
      at += count;
    });
    questions.forEach((q) => {
      const y = base - 12 - q.lane * 26;
      const group = s("g", { class: "gb-band-q", "data-q": q.n });
      // An arc as high as its lane, or lower when it is narrow, so one verse reads as a small bump, not a spike.
      const top = (x0, x1) => Math.max(y, base - 2 - Math.max(5, (x1 - x0) * 0.6));
      let widest = q.runs[0];
      q.runs.forEach(([a, b]) => {
        const x0 = x(a), x1 = Math.max(x(b + 1), x0 + 4), yt = top(x0, x1);
        if (b - a > widest[1] - widest[0]) widest = [a, b];
        group.append(s("path", { d: `M${x0} ${base - 2}C${x0} ${yt},${x1} ${yt},${x1} ${base - 2}`, class: "gb-band-arc" }));
      });
      const [wa, wb] = widest, wx0 = x(wa), wx1 = Math.max(x(wb + 1), wx0 + 4);
      group.append(s("text", { x: (wx0 + wx1) / 2, y: (base - 2 + 3 * top(wx0, wx1)) / 4 - 6, class: "gb-band-label" }, q.n));
      group.append(s("path", { d: q.runs.map(([a, b]) => `M${x(a)} ${base - 2}H${Math.max(x(b + 1), x(a) + 4)}`).join(""), class: "gb-band-hit" }));
      group.addEventListener("mouseenter", () => onPoint(q.n));
      group.addEventListener("mouseleave", () => onPoint(null));
      group.addEventListener("click", () => onPick(q.n));
      svg.append(group);
    });
    return svg;
  }

  // ── 01 The days: two sets of three that answer each other, and the seventh with no refrain ──
  function days(data, ui) {
    const list = data.days.filter((d) => d.day);
    const refrain = data.days.find((d) => d.refrain);
    const tile = (d) => h("div", { class: `gb-day${d.day === 7 ? " is-seventh" : ""}` },
      h("span", { class: "gb-day-n" }, `Day ${d.day}`),
      h("p", { class: "gb-day-made" }, d.made),
      h("q", {}, d.words), " ", ui.refLink(d.r),
      d.day < 7 ? h("span", { class: "gb-day-refrain", title: refrain.refrain }, "evening and morning") : h("span", { class: "gb-day-refrain is-none" }, "no refrain"));
    return h("figure", { class: "gb-days" },
      h("figcaption", { class: "gb-fig-q" }, "How do the days answer each other?"),
      h("div", { class: "gb-days-grid" }, [0, 1, 2].map((i) => h("div", { class: "gb-day-pair" }, tile(list[i]), h("span", { class: "gb-day-join", "aria-hidden": "true" }), tile(list[i + 3])))),
      tile(list[6]),
      h("p", { class: "gb-fig-note" }, `The refrain “${refrain.refrain}” closes six days (Genesis ${refrain.verses.join(", ")}) and is missing on the seventh. The pairing is in the text; whether the week is a timetable or an arrangement is where the readings below differ. `, ui.refLink(refrain.r, "Read Genesis 1:1–2:3")));
  }

  // ── 04 The long lives: each bar one life from birth, in three groups. Not a timeline ──
  function ages(data, ui) {
    const { rows, psalm, noteRef } = data.ages;
    const groups = [["Before the flood · Genesis 5", rows.slice(0, 10)], ["After the flood · Genesis 11", rows.slice(10, 19)], ["Later lives", rows.slice(19)]];
    const pct = (n) => `${(n / 1000) * 100}%`;
    const row = (r) => h("li", { class: `gb-life${r.died ? " has-death" : ""}${r.open ? " is-open" : ""}` },
      h("span", { class: "gb-life-name" }, ui.refLink(r.parts[r.parts.length - 1].r, r.name)),
      h("span", { class: "gb-life-bar", "aria-hidden": "true" },
        r.parts.map((p, i) => h("i", { class: i ? "is-after" : "", style: `width:${pct(p.n)}` }))),
      h("span", { class: "gb-life-years" }, String(r.years),
        r.parts.length > 1 ? h("small", {}, ` (${r.parts.map((p) => p.n).join(" + ")})`) : null,
        r.open ? h("small", { class: "gb-life-open" }, " · ", ui.refLink(r.open.r, `“${r.open.t}”`)) : null));
    return h("figure", { class: "gb-ages" },
      h("figcaption", { class: "gb-fig-q" }, "How long does each life run, as the text gives it?"),
      groups.map(([name, list]) => h("div", { class: "gb-ages-group" }, h("p", { class: "gb-ages-head" }, name), h("ol", { class: "gb-lives" }, list.map(row)))),
      h("div", { class: "gb-ages-group" }, h("ol", { class: "gb-lives" }, h("li", { class: "gb-life is-psalm" },
        h("span", { class: "gb-life-name" }, ui.refLink(psalm.r, "Psalm 90")),
        h("span", { class: "gb-life-bar", "aria-hidden": "true" }, h("i", { class: "is-range", style: `margin-left:${pct(psalm.low)};width:${pct(psalm.high - psalm.low)}` })),
        h("span", { class: "gb-life-years" }, `${psalm.low} or ${psalm.high}`)))),
      h("p", { class: "gb-fig-note" }, "Each bar is one life, from birth, in the years the Berean gives (from the Hebrew). Genesis 11 gives two numbers for each man, his age when his son was born and the years after; the bar shows both. A short mark ends a bar only where the verse says he died. This is not a timeline: the bars do not run one after another, and the study below shows that family lists can skip generations. The Greek Old Testament adds 100 years to six of the Genesis 11 ages (",
        ui.refLink(noteRef, "the Berean's note at Genesis 11:13"), ")."));
  }

  // ── 06 The flood's calendar: the narrator's dates on a spiral that passes its own start ──
  function flood(data, ui) {
    const { marks, ark } = data.flood;
    const start = (marks[0].month - 1) * 30 + marks[0].day - 1;
    const t = (m) => (m.year - 600) * 360 + (m.month - 1) * 30 + m.day - 1 - start;
    const cx = 210, cy = 200, r = (d) => 92 + d * 0.22, point = (d) => [cx + r(d) * Math.sin((d / 360) * 2 * Math.PI), cy - r(d) * Math.cos((d / 360) * 2 * Math.PI)];
    const dated = marks.filter((m) => m.month), end = t(dated[dated.length - 1]);
    const line = (from, to) => Array.from({ length: Math.ceil((to - from) / 2) + 1 }, (_, i) => point(Math.min(from + i * 2, to)).map((n) => n.toFixed(1)).join(",")).join(" ");
    const span = marks.find((m) => m.span);
    const svg = s("svg", { viewBox: "0 0 420 400", class: "gb-flood-svg", role: "img", "aria-labelledby": "gb-flood-t" },
      s("title", { id: "gb-flood-t" }, "The flood's dates on a spiral of equal months, from the 17th day of the 2nd month to the 27th day of the 2nd month of the next year"),
      Array.from({ length: 12 }, (_, i) => { const [x1, y1] = point(i * 30 - start + 0.01).map((n) => n); return s("circle", { cx: x1.toFixed(1), cy: y1.toFixed(1), r: 1.4, class: "gb-flood-month" }); }),
      s("polyline", { points: line(0, end), class: "gb-flood-path" }),
      s("polyline", { points: line(0, span.span), class: "gb-flood-prevail" }),
      dated.map((m, i) => { const [px, py] = point(t(m)); return s("g", { class: "gb-flood-mark" }, s("circle", { cx: px.toFixed(1), cy: py.toFixed(1), r: 4 }), s("text", { x: (px + (px < cx ? -10 : 10)).toFixed(1), y: (py + 4).toFixed(1), "text-anchor": px < cx ? "end" : "start" }, String(i + 1))); }),
      s("g", { class: "gb-ark" }, s("rect", { x: cx - 75, y: cy - 7.5, width: 150, height: 15 }), s("text", { x: cx, y: cy + 30, "text-anchor": "middle" }, `${ark.long} × ${ark.wide} × ${ark.high} cubits, to scale`)));
    let number = 0;
    const list = h("ol", { class: "gb-flood-list" }, marks.map((m) => h("li", { class: m.span ? "is-span" : "" },
      h("b", {}, m.span ? "—" : String(++number)), " ", m.what, ": ", h("q", {}, m.words), " ", ui.refLink(m.r))));
    return h("figure", { class: "gb-flood" },
      h("figcaption", { class: "gb-fig-q" }, "How long does the narrator say the flood lasted?"),
      h("div", { class: "gb-flood-grid" }, svg, h("div", {}, list, h("p", { class: "gb-fig-note" },
        "The line runs from the narrator's first date to his last, and passes its own start by ten days: more than a year. The thicker stretch is the 150 days the waters prevailed. The ark is drawn to scale (", ui.refLink(ark.r), "). Months are drawn equal; the text gives the month and the day, not how long its months were."))));
  }

  // ── 08 Languages three times, then the name and the thread ──
  function languages(data, ui) {
    const mark = (text, word) => text.split(word).flatMap((piece, i) => (i ? [h("mark", {}, word), piece] : [piece]));
    return h("figure", { class: "gb-langs" },
      h("figcaption", { class: "gb-fig-q" }, "Where does Genesis 10 already speak of languages?"),
      h("div", { class: "gb-langs-row" }, data.nations.languages.map((l) => h("div", { class: "gb-lang" },
        h("span", { class: "gb-label" }, `The sons of ${l.who}`), h("p", {}, mark(ui.verseText(l.r), "languages")), ui.refLink(l.r)))),
      h("p", { class: "gb-fig-note" }, "Each of the three families closes with its languages, before Genesis 11 begins with one language. The order of the two chapters is the first question the readings below take up."));
  }
  function thread(data, ui) {
    const { names, thread: steps } = data.nations;
    return h("figure", { class: "gb-thread" },
      h("figcaption", { class: "gb-fig-q" }, "Who makes the name?"),
      h("div", { class: "gb-names" }, names.map((n) => h("div", { class: "gb-name" }, h("span", { class: "gb-label" }, n.who), h("q", {}, n.words), " ", ui.refLink(n.r)))),
      h("ol", { class: "gb-steps" }, steps.map((step) => h("li", { class: step.reading ? "is-reading" : "" },
        h("span", { class: "gb-step-dot", "aria-hidden": "true" }), h("b", {}, step.label), h("q", {}, step.words), ui.refLink(step.r),
        step.reading ? h("small", {}, step.reading) : null))),
      h("p", { class: "gb-fig-note" }, "The scattering, the promise to Abram, Pentecost and the multitude from every tongue. The dashed step is a reading, not something the text says."));
  }

  return { band, days, ages, flood, languages, thread };
})();
