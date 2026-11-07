// The figures of What the Bible says about itself. Each one draws only phrases build-data.py has found in their verses
// or in the study's own sentences, and every count comes from data.js, not from this file.
window.SWFig = (() => {
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Words shared by a quotation and its source, marked wherever they stand, with case set aside.
  function marked(h, text, phrases) {
    if (!phrases.length) return [text];
    const pattern = new RegExp(`(${phrases.map(escape).join("|")})`, "gi");
    return text.split(pattern).map((piece, i) => (i % 2 ? h("mark", { class: "sw-shared" }, piece) : piece));
  }

  function written({ D, h, art, refLink, label }) {
    const { written: list, tests, passages } = D;
    const trace = h("div", { class: "sw-trace", id: "sw-trace", "aria-live": "polite" });
    const buttons = [];
    function show(index) {
      const w = list[index];
      buttons.forEach((b, i) => b.setAttribute("aria-pressed", i === index ? "true" : "false"));
      const inSource = new Set(passages[w.src].verses.map((v) => v[0]));
      trace.className = `sw-trace${w.who === "Jesus" ? "" : " is-devil"}`;
      trace.replaceChildren(
        h("div", { class: "sw-trace-said" },
          label("Said"), h("p", { class: "sw-trace-who" }, w.who, " · ", refLink(w.r)),
          h("blockquote", {}, marked(h, passages[w.r].verses.map((v) => v[1]).join(" "), w.shared))),
        h("div", { class: "sw-trace-from" },
          label("Taken from"), h("p", { class: "sw-trace-who" }, refLink(w.src), h("span", { class: "sw-muted" }, ", read with the verses around it, "), refLink(w.ar)),
          h("p", { class: "sw-trace-verses" }, passages[w.ar].verses.map(([cv, text]) => h("span", { class: inSource.has(cv) ? "is-source" : "" }, h("sup", {}, cv.split(":")[1]), " ", marked(h, text, w.shared), " ")))),
        h("div", { class: "sw-trace-use" }, label("What it is used to do, in the study's words"), h("p", {}, w.use)));
    }
    const columns = tests.map((test) => h("div", { class: "sw-test" },
      art(SWArt.tests[test.art], "sw-test-art"),
      h("p", { class: "sw-test-name" }, h("span", {}, `Test ${test.n}`), " ", test.name),
      h("p", { class: "sw-test-offer" }, h("q", {}, test.offer), " ", refLink(test.r)),
      list.map((w, index) => {
        if (w.test !== test.n) return null;
        const button = h("button", { type: "button", class: `sw-said${w.who === "Jesus" ? "" : " is-devil"}`, "aria-pressed": "false", "aria-controls": "sw-trace", onclick: () => { show(index); if (matchMedia("(max-width: 720px)").matches) trace.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } },
          h("span", { class: "sw-said-words" }, `“${w.formula}”`), h("span", { class: "sw-said-who" }, `${w.who}, ${passages[w.r].label}`));
        buttons[index] = button;
        return button;
      })));
    show(0);
    return h("figure", { class: "sw-written-fig" },
      h("div", { class: "sw-tests" }, columns), trace,
      h("figcaption", { class: "sw-muted" }, "Marked: the words the quotation and its source share. The Berean's own wording is kept in each."));
  }

  const uses = ({ D, h, refLink, label }) => h("figure", { class: "sw-fig sw-uses" },
    label("Four uses, one goal"),
    h("ol", {}, D.uses.items.map(([word, gloss]) => h("li", {}, h("b", {}, word), h("span", {}, gloss)))),
    h("p", { class: "sw-goal" }, h("q", {}, D.uses.goal), " ", refLink(D.uses.gr)),
    h("figcaption", {}, "The four words are the verse's ", refLink(D.uses.r), "; the meaning beside each is the study's."));

  const readings = ({ D, h, refLink, label }) => h("figure", { class: "sw-fig sw-readings" },
    label("Read two ways"),
    D.readings.map((item) => h("div", { class: "sw-two" },
      h("p", { class: "sw-two-verse" }, h("q", {}, item.words), " ", refLink(item.r)),
      h("p", { class: "sw-two-state" }, item.chosen ? "The study prefers the first reading." : "Both shown. Neither is chosen."),
      ["a", "b"].map((key) => h("p", { class: `sw-two-reading${item.chosen === key ? " is-chosen" : ""}` }, item[key])))));

  function forty({ D, h, refLink, label }) {
    const marks = new Map();
    D.deut.marks.forEach((m, i) => marks.set(m.chapter, [...(marks.get(m.chapter) || []), i + 1]));
    return h("figure", { class: "sw-fig sw-forty" },
      label("Forty days, forty years"),
      D.forty.map((f) => h("p", { class: "sw-forty-line" }, h("q", {}, f.words), " ", refLink(f.r))),
      label("Where the three answers come from"),
      h("div", { class: "sw-deut", role: "img", "aria-label": `Deuteronomy's ${D.deut.chapters} chapters; Jesus' answers come from chapters ${D.deut.marks.map((m) => m.chapter).join(", ")}` },
        Array.from({ length: D.deut.chapters }, (_, i) => h("i", { class: marks.has(i + 1) ? "is-marked" : "", title: `Deuteronomy ${i + 1}` }, marks.has(i + 1) ? marks.get(i + 1).join(" ") : ""))),
      h("ol", { class: "sw-deut-key" }, D.deut.marks.map((m) => h("li", {}, refLink(m.r)))),
      h("figcaption", {}, `Deuteronomy's ${D.deut.chapters} chapters, counted from the Berean. The three answers are numbered in the order Jesus gave them.`));
  }

  const clear = ({ D, h, refLink, label }) => h("figure", { class: "sw-fig sw-clear" },
    label("Clear, and hard in places"),
    h("p", { class: "sw-clear-a" }, h("q", {}, D.clear.pair[0].words), " ", refLink(D.clear.pair[0].r)),
    h("p", { class: "sw-clear-says" }, D.clear.says),
    h("p", { class: "sw-clear-b" }, h("q", {}, D.clear.pair[1].words), " ", refLink(D.clear.pair[1].r)));

  function facts({ D, h, refLink, label }) {
    const holder = h("div", { class: "sw-facts" });
    const chip = (f) => h("li", {}, h("q", {}, f.words), " ", refLink(f.r));
    const toggle = h("button", { type: "button", class: "sw-toggle", "aria-pressed": "false", onclick: () => draw(toggle.getAttribute("aria-pressed") !== "true") }, "Set them under ", D.passages[D.frame.r].label);
    function draw(framed) {
      toggle.setAttribute("aria-pressed", framed ? "true" : "false");
      holder.replaceChildren(framed
        ? h("div", { class: "sw-framed" }, ["suffer", "rise"].map((key) => h("div", {}, h("p", { class: "sw-frame-head" }, h("q", {}, D.frame[key])), h("ul", {}, D.facts.filter((f) => f.under === key).map(chip)))))
        : h("ul", { class: "sw-loose" }, D.facts.map(chip)));
    }
    draw(false);
    return h("figure", { class: "sw-fig sw-facts-fig" },
      label("Every fact, in Cleopas's words"), holder, toggle,
      h("figcaption", {}, D.frame.says, " The grouping is the page's; every word is Luke's."));
  }

  const opened = ({ D, h, refLink, label }) => h("figure", { class: "sw-fig sw-opened" },
    label(`“Opened”, ${D.opened.length} times in Luke 24`),
    h("ol", {}, D.opened.map((o) => h("li", {}, h("b", {}, o.what), h("span", {}, h("q", {}, o.words), " ", refLink(o.r))))),
    h("figcaption", {}, "Every verse of Luke 24 that says “opened”, found by script."));

  return { written, parts: { "01": uses, "02": readings, "03": forty, "04": clear, "05": facts, "06": opened } };
})();
