// The figures of Grief and dying, each drawn from data.js (built and checked by build-data.py). Every number shown
// comes from there. All text goes in as text nodes. Jesus is named in words where the text names Him; He is never drawn.
window.GRFigures = (() => {
  const NS = "http://www.w3.org/2000/svg";
  let tools = null; // { h, refLink, passages, verseText, openSheet }
  function s(tag, attrs = {}, ...children) {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    element.append(...children);
    return element;
  }
  const label = (text) => tools.h("span", { class: "gr-label" }, text);
  const quoteOf = (row) => tools.h("q", {}, row.words);

  // A line of text under a figure that says what the pointer is on, and returns to its instruction when it leaves.
  function readingLine(instruction) {
    const line = tools.h("p", { class: "gr-reading", "aria-live": "polite" }, instruction);
    return { line, show: (...parts) => line.replaceChildren(...parts), reset: () => line.replaceChildren(instruction) };
  }

  // ── 00 Who is weeping, and to whom ──
  function voices(figure) {
    const { h, refLink } = tools;
    const rows = figure.rows;
    const mourners = [...new Set(rows.map((r) => r.who))];
    const targets = Object.keys(figure.to);
    const width = 1000, top = 34, gap = 62, height = top * 2 + gap * (mourners.length - 1);
    const my = (who) => top + gap * mourners.indexOf(who);
    const ty = (to) => top + (height - top * 2) * (targets.indexOf(to) + .5) / targets.length;
    const reading = readingLine("Point at a line to read what was said or done. Choose it to open the verse.");
    const svg = s("svg", { viewBox: `0 0 ${width} ${height}`, class: "gr-map-svg", role: "group", "aria-label": "Mourners joined to where their grief is spoken" });
    mourners.forEach((who) => svg.append(s("text", { x: 196, y: my(who) + 5, class: "gr-map-who", "text-anchor": "end" }, who), s("circle", { cx: 214, cy: my(who), r: 4, class: "gr-map-dot" })));
    targets.forEach((to) => {
      const count = rows.filter((r) => r.to === to).length;
      svg.append(s("circle", { cx: 706, cy: ty(to), r: 5, class: "gr-map-dot is-target" }),
        s("text", { x: 724, y: ty(to) + 5, class: "gr-map-to" }, figure.to[to]),
        s("text", { x: 724, y: ty(to) + 25, class: "gr-map-count" }, `${count} of ${rows.length}`));
    });
    const seen = {};
    rows.forEach((row) => {
      const n = (seen[row.to] = (seen[row.to] || 0) + 1);
      const total = rows.filter((r) => r.to === row.to).length;
      const y1 = my(row.who), y2 = ty(row.to) + (n - (total + 1) / 2) * 7;
      const d = `M220 ${y1} C 440 ${y1}, 480 ${y2}, 700 ${y2}`;
      const describe = () => [h("b", {}, `${row.who} ${row.act} ${row.whom}`), " ", quoteOf(row), " ", refLink(row.r, row.ref), h("span", { class: "gr-sec" }, ` · ${figure.sections[row.section]}`)];
      const group = s("g", { class: `gr-map-line is-${row.section}`, tabindex: "0", role: "button", "aria-label": `${row.who} ${row.act} ${row.whom}: ${row.words}. ${row.ref}. Opens the verse.` },
        s("path", { d, class: "gr-map-hit" }), s("path", { d, class: "gr-map-stroke" }));
      const on = () => { svg.classList.add("is-pointing"); group.classList.add("is-on"); reading.show(...describe()); };
      const off = () => { svg.classList.remove("is-pointing"); group.classList.remove("is-on"); reading.reset(); };
      group.addEventListener("pointerenter", on); group.addEventListener("pointerleave", off);
      group.addEventListener("focus", on); group.addEventListener("blur", off);
      group.addEventListener("click", () => tools.openSheet(row.r, group));
      group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); tools.openSheet(row.r, group); } });
      svg.append(group);
    });
    // On a phone the drawing gives way to the same voices as a list, grouped by where the words go.
    const list = h("div", { class: "gr-map-list" }, targets.map((to) => h("div", {},
      h("h3", {}, figure.to[to]),
      h("ul", {}, rows.filter((r) => r.to === to).map((r) => h("li", { class: `is-${r.section}` }, h("b", {}, `${r.who} ${r.act} ${r.whom}`), " ", quoteOf(r), " ", refLink(r.r, r.ref)))))));
    return h("figure", { class: "gr-map" }, h("div", { class: "gr-map-wide" }, svg, reading.line), list,
      h("figcaption", {}, figure.read));
  }

  // The voices that belong to one part, as a short ledger under its heading.
  function partVoices(rows, to) {
    const { h, refLink } = tools;
    if (!rows.length) return null;
    return h("ul", { class: "gr-voices" }, rows.map((r) => h("li", { class: `is-${r.section}` },
      h("span", { class: "gr-v-who" }, r.who), h("span", { class: "gr-v-act" }, r.act),
      h("span", { class: "gr-v-whom" }, r.whom, r.whom.toLowerCase() === to[r.to].toLowerCase() ? null : h("small", {}, to[r.to])),
      h("span", { class: "gr-v-words" }, quoteOf(r), " ", refLink(r.r, r.ref)))));
  }

  // ── 01 The days Genesis records, and the same cave ──
  function days(figure) {
    const { h, refLink } = tools;
    const row = (name, n, ref, key, note) => h("div", { class: "gr-days-row" },
      h("p", { class: "gr-days-name" }, name, " ", refLink(key, ref)),
      n ? h("div", { class: "gr-days-dots", "aria-hidden": "true" }, Array.from({ length: n }, () => h("i"))) : h("div", { class: "gr-days-none", "aria-hidden": "true" }),
      h("p", { class: "gr-days-n" }, n ? h("b", {}, String(n)) : null, note));
    return h("figure", { class: "gr-fig gr-days" },
      h("p", { class: "gr-fig-q" }, "How long does Genesis let the mourning take?"),
      figure.rows.map((r) => row(r.label, r.n, r.ref, r.r, ` days · “${r.words}”`)),
      row(figure.none.label, 0, figure.none.ref, figure.none.r, "No number of days is given"),
      h("ol", { class: "gr-cave" }, figure.cave.map((c) => h("li", {}, h("span", { class: "gr-label" }, c.note), h("q", {}, c.words), " ", refLink(c.r, c.ref)))),
      h("figcaption", {}, "The rows are days, one dot a day, as Genesis counts them. Forty and seventy are both given in Genesis 50:3; the text does not say whether the seventy include the forty, so the rows are drawn apart. Abraham's field becomes the family's grave: the same cave receives Jacob."));
  }

  // ── 02 The Song of the Bow, and the cry at the gate ──
  function mark(text, phrase) {
    const out = [], pattern = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      out.push(text.slice(last, match.index), tools.h("mark", {}, match[0]));
      last = match.index + match[0].length;
    }
    return [...out, text.slice(last)];
  }
  function song(figure) {
    const { h, refLink, passages } = tools;
    const lines = passages[figure.r].verses;
    const cry = passages[figure.cry];
    return h("figure", { class: "gr-fig gr-song" },
      h("div", {},
        h("p", { class: "gr-fig-q" }, "Where does the refrain return?"),
        h("ol", { class: "gr-song-lines" }, lines.map(([cv, text]) => h("li", { class: figure.refrainVerses.includes(+cv.split(":")[1]) ? "is-refrain" : "" },
          h("sup", {}, cv.split(":")[1]), mark(text, figure.refrain)))),
        h("p", { class: "gr-fig-note" }, `“${figure.refrain}” three times, at verses ${figure.refrainVerses.join(", ")}: the start, the turn to Jonathan, the end. `, refLink(figure.r, passages[figure.r].label))),
      h("div", { class: "gr-cry" },
        h("p", { class: "gr-fig-q" }, "What does the father say at the gate?"),
        h("blockquote", {}, mark(cry.verses[0][1], figure.phrase)),
        h("p", { class: "gr-fig-note" }, h("b", {}, String(figure.count)), ` times “${figure.phrase}” in one verse. `, refLink(figure.cry, cry.label))));
  }

  // ── 03 The alphabet of grief: Lamentations whole, 22 columns, chapter 3 in threes ──
  function lament(figure) {
    const { h, refLink, passages } = tools;
    const reading = readingLine("Point at a verse to read it here; choose it to open it.");
    const kinds = {};
    figure.comfort.forEach((v) => (kinds[`1:${v}`] = "comfort"));
    const span = (label) => { const m = label.match(/(\d+):(\d+)(?:–(\d+))?$/); return m ? Array.from({ length: (+m[3] || +m[2]) - +m[2] + 1 }, (_, i) => `${m[1]}:${+m[2] + i}`) : []; };
    figure.marks.forEach((m) => span(m.ref).forEach((cv) => (kinds[cv] = m.id)));
    const cellsFor = {};
    const rows = figure.chapters.map((chapter) => {
      const verses = passages[chapter.r].verses;
      const per = chapter.count / 22;
      const columns = Array.from({ length: 22 }, (_, c) => h("div", { class: "gr-ab-col" }, verses.slice(c * per, c * per + per).map(([cv, text]) => {
        const cell = h("span", { class: `gr-ab-cell${kinds[cv] ? ` is-${kinds[cv]}` : ""}${cv === figure.middle ? " is-middle" : ""}`, "data-cv": cv });
        (cellsFor[cv] = cell);
        cell.addEventListener("pointerenter", () => reading.show(h("b", {}, `Lamentations ${cv}`), " ", text));
        cell.addEventListener("pointerleave", reading.reset);
        cell.addEventListener("click", () => tools.openSheet(`LAM.${cv.replace(":", ".")}`, cell));
        return cell;
      })));
      return h("div", { class: `gr-ab-row${per === 3 ? " is-triple" : ""}${chapter.alphabet ? "" : " is-plain"}` }, h("span", { class: "gr-ab-ch" }, refLink(chapter.r, `${chapter.n}`)), h("div", { class: "gr-ab-grid" }, columns), h("span", { class: "gr-ab-n" }, `${chapter.count}`));
    });
    const light = (cvs, on) => cvs.forEach((cv) => cellsFor[cv]?.classList.toggle("is-lit", on));
    const key = (cvs, ...content) => {
      const item = h("li", {}, ...content);
      item.addEventListener("pointerenter", () => light(cvs, true)); item.addEventListener("pointerleave", () => light(cvs, false));
      item.addEventListener("focusin", () => light(cvs, true)); item.addEventListener("focusout", () => light(cvs, false));
      return item;
    };
    const comfortLinks = figure.comfort.map((v, i) => [i ? ", " : "", refLink(`LAM.1.${v}`, `1:${v}`), figure.comfortExact.includes(v) ? "" : " (“no one nearby to comfort”)"]).flat();
    const [middleChapter, middleVerse] = figure.middle.split(":");
    return h("figure", { class: "gr-fig gr-ab" },
      h("p", { class: "gr-fig-q" }, "Where in the book does the hope stand?"),
      h("div", { class: "gr-ab-head", "aria-hidden": "true" }, h("span"), h("div", { class: "gr-ab-grid" }, figure.letters.map((l) => h("span", { lang: "he" }, l))), h("span")),
      rows, reading.line,
      h("ul", { class: "gr-ab-key" },
        key(figure.comfort.map((v) => `1:${v}`), h("i", { class: "gr-ab-swatch is-comfort" }), "No one to comfort, five times in chapter 1: ", ...comfortLinks),
        figure.marks.map((m) => key(span(m.ref), h("i", { class: `gr-ab-swatch is-${m.id}` }), `${m.name}: `, h("q", {}, m.words), " ", refLink(m.r, m.ref.replace("Lamentations ", "")))),
        key([figure.middle], h("i", { class: "gr-ab-swatch is-middle" }), `The middle of the book: verse ${figure.middleIndex} of ${figure.total}, which is `, refLink(`LAM.${middleChapter}.${middleVerse}`, figure.middle))),
      h("figcaption", {}, `A column for each of the 22 letters of the Hebrew alphabet, in chapter 1's order; chapter 3 gives each letter three verses. Chapter 5, drawn dashed, keeps twenty-two verses but not the alphabet. The hope of 3:21–33 ends at verse ${figure.middleIndex} of ${figure.total}: it stands in the middle of the book, and the book goes on past it.`));
  }

  // ── 04 The two men beside Jesus, and the comma ──
  function luke(figure) {
    const { h, refLink, passages } = tools;
    const { two, comma, truly } = figure;
    const said = (item) => h("p", {}, h("q", {}, item.words), " ", refLink(item.r, item.ref));
    const sentence = h("p", { class: "gr-comma-text", "aria-live": "polite" });
    const show = (moved) => {
      const text = moved ? comma.moved : comma.berean;
      const at = text.indexOf("today");
      sentence.replaceChildren(text.slice(0, at), h("mark", {}, "today"), text.slice(at + 5));
      buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === Number(moved))));
      note.replaceChildren(moved ? "Not the Berean. The study names this placement as the one a few translations use." : "The Berean, with nearly all English versions.");
    };
    const buttons = [h("button", { type: "button", class: "gr-switch", onclick: () => show(false) }, "As the Berean reads it"), h("button", { type: "button", class: "gr-switch", onclick: () => show(true) }, "With the comma moved")];
    const note = h("p", { class: "gr-fig-note" });
    show(false);
    return h("figure", { class: "gr-fig gr-two" },
      h("p", { class: "gr-fig-q" }, "What does each man say?"),
      h("div", { class: "gr-two-grid" },
        h("div", { class: "gr-two-side" }, label("One mocks"), said(two.mocks)),
        h("div", { class: "gr-two-mid" }, h("span", {}, "Jesus")),
        h("div", { class: "gr-two-side" }, label("The other says"), h("ol", {}, two.says.map((x) => h("li", {}, said(x)))), label("Then asks"), said(two.asks))),
      h("div", { class: "gr-two-answer" }, label("And is answered"), said(two.answer)),
      h("div", { class: "gr-comma" }, h("p", { class: "gr-fig-q" }, "Where does “today” belong?"),
        h("div", { class: "gr-switches", role: "group", "aria-label": "Where the comma stands" }, buttons), sentence, note,
        h("p", { class: "gr-fig-note" }, `“${truly.phrase}” comes ${truly.refs.length} times in Luke: `,
          truly.refs.map((r, i) => [i ? ", " : "", refLink(r, passages[r].label.replace("Luke ", ""))]).flat(),
          `. Only at ${truly.today[0]} does “today” stand next to it.`)));
  }

  // ── 05 Now, and then ──
  function nowThen(stages) {
    const { h, refLink } = tools;
    return h("figure", { class: "gr-fig gr-nt" },
      h("p", { class: "gr-fig-q" }, "What words does Scripture use for each stage?"),
      h("ol", { class: "gr-nt-line" }, stages.map((stage) => h("li", {},
        h("span", { class: "gr-label" }, stage.stage), h("h4", {}, stage.name),
        h("ul", {}, stage.items.map((item) => h("li", {}, h("q", {}, item.words), " ", refLink(item.r, item.ref))))))),
      h("figcaption", {}, "Death on this side; with Christ at once; the body raised at His coming. “Asleep” is how death looks from here, and it stands beside “at home with the Lord”."));
  }

  return { use: (t) => (tools = t), voices, partVoices, days, song, lament, luke, nowThen };
})();
