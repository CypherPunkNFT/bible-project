// The whole book: all 150 psalms in five rows, one per book, each psalm a stroke as tall as it is long, each row closed
// by its blessing. Four views answer the study's three questions. Point at a psalm to read it on the line beneath;
// choose it to open it. The field is one Tab stop: arrow keys move between psalms, Enter opens. View and psalm live
// in the address (?lens=, ?psalm=).
window.PSField = (() => {
  const { data, h, refLink, psalm, bookName, plural } = PSKit;
  const LENSES = [
    { id: "books", q: "1", name: "Five books", ask: "Where am I in the book?",
      say: "Each row is one book, closed by its blessing. The gate, Psalms 1 and 2, has no heading; the book ends in five psalms that open and close with Hallelujah." },
    { id: "writers", q: "2", name: "Who the headings name", ask: "Whose prayer is this?",
      say: () => {
        const count = (id, test) => (groupsOf("writers").find((g) => g.id === id) || { psalms: [] }).psalms.filter((n) => test(psalm(n).book)).length;
        const total = (id) => (groupsOf("writers").find((g) => g.id === id) || { psalms: [] }).psalms.length;
        const fifth = data.books[4], unnamed = data.psalms.filter((p) => p.book === 5 && !p.named.length).length;
        return `Coloured by the first writer a heading names. ${count("david", (b) => b <= 2)} of David's ${total("david")} stand in Books I and II, ${count("asaph", (b) => b === 3)} of Asaph's ${total("asaph")} in Book III; ${unnamed} of Book V's ${fifth.last - fifth.first + 1} name no writer.`;
      } },
    { id: "marks", q: "2", name: "What the headings and notes mark", ask: "What kind of psalm is this?",
      say: "Only what the text itself marks: the songs of ascents, the days in David's life, the alphabet poems, the Hallelujah ending. The kinds readers name (lament, trust, praise) are not drawn, because readers place psalms differently." },
    { id: "nt", q: "3", name: "Quoted in the New Testament", ask: "How does the rest of Scripture read it?",
      say: "As dark as the number of New Testament passages that quote the psalm, by the Berean's own notes. Allusions the notes do not mark are not counted." },
  ];
  const lensOf = (id) => LENSES.find((l) => l.id === id) || LENSES[0];
  const groupsOf = (lens) => data.groups[lens] || [];
  const memberOf = (lens, n) => groupsOf(lens).filter((g) => g.psalms.includes(n));
  const strokes = [];
  let lens = "books", only = null, current = 1;
  let readout, chipsRow, lensRow, sayLine;

  function classFor(n) {
    const p = psalm(n);
    if (lens === "books") return `b${p.book}${n <= 2 && !p.heading ? " is-gold" : ""}${n >= 146 ? " is-gold" : ""}`;
    if (lens === "writers") return `w-${(memberOf("writers", n)[0] || { id: "none" }).id}`;
    if (lens === "marks") return memberOf("marks", n).length ? "is-lit" : "is-dim";
    const c = p.cited.length;
    return c >= 5 ? "nt-5" : c >= 2 ? "nt-2" : c === 1 ? "nt-1" : "nt-0";
  }
  function describe(n) {
    const p = psalm(n);
    const extra = lens === "writers" ? (p.named.length ? `Named: ${p.named.join(" and ")}` : p.heading ? "The heading names no writer" : "")
      : lens === "marks" ? memberOf("marks", n).map((g) => g.label).join(", ")
      : lens === "nt" ? `Quoted in ${plural(p.cited.length, "New Testament passage", "New Testament passages")}` : "";
    return { p, extra };
  }
  function paint() {
    const group = only && groupsOf(lens).find((g) => g.id === only);
    strokes.forEach((button, i) => {
      const n = i + 1;
      button.className = `ps-stroke ${classFor(n)}${group ? (group.psalms.includes(n) ? " is-on" : " is-off") : ""}`;
      const { p, extra } = describe(n);
      button.setAttribute("aria-label", `Psalm ${n}, ${bookName(p.book)}, ${plural(p.verses, "verse", "verses")}${extra ? `. ${extra}` : ""}`);
      if (lens === "nt" && p.cited.length >= 5) button.dataset.count = p.cited.length; else delete button.dataset.count;
    });
    lensRow.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lens === lens)));
    const l = lensOf(lens);
    sayLine.replaceChildren(h("b", {}, l.ask), " ", typeof l.say === "function" ? l.say() : l.say);
    chipsRow.replaceChildren(...groupsOf(lens).map((g) => h("button", {
      type: "button", class: `ps-chip ${lens === "writers" ? `w-${g.id}` : ""}`, "aria-pressed": String(only === g.id),
      onclick: () => { only = only === g.id ? null : g.id; paint(); remember(); },
    }, h("span", { class: "ps-chip-mark", "aria-hidden": "true" }), g.label, h("b", {}, String(g.psalms.length)))));
    show(current);
  }
  function show(n) {
    const { p, extra } = describe(n);
    readout.replaceChildren(
      h("span", { class: "ps-read-n" }, `Psalm ${n}`),
      h("span", {}, `${bookName(p.book)} · ${plural(p.verses, "verse", "verses")}`),
      h("span", { class: "ps-read-head" }, p.heading ? `“${p.heading.replace(/"/g, "")}”` : "No heading"),
      ...(extra ? [h("span", { class: "ps-read-extra" }, extra)] : []),
      refLink(`PS.${n}`, "Open it"));
  }
  function remember() {
    const query = new URLSearchParams(location.search);
    query.set("lens", lens);
    query.set("psalm", String(current));
    if (only) query.set("only", only); else query.delete("only");
    history.replaceState(null, "", `?${query}${location.hash}`);
  }
  function focusOn(n, move = true) {
    n = Math.max(1, Math.min(150, n));
    strokes[current - 1].tabIndex = -1;
    current = n;
    strokes[n - 1].tabIndex = 0;
    if (move) strokes[n - 1].focus();
    show(n);
  }
  function keys(event) {
    const p = psalm(current);
    const sameRow = data.books[p.book - 1];
    const offset = current - sameRow.first;
    const row = (b) => data.books[b - 1];
    const step = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: sameRow.first, End: sameRow.last,
      ArrowDown: p.book < 5 ? Math.min(row(p.book + 1).first + offset, row(p.book + 1).last) : null,
      ArrowUp: p.book > 1 ? Math.min(row(p.book - 1).first + offset, row(p.book - 1).last) : null }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    if (step !== null) focusOn(step);
  }
  function section() {
    lensRow = h("div", { class: "ps-lenses", role: "group", "aria-label": "Ways to look at the book" },
      LENSES.map((l) => h("button", { type: "button", "data-lens": l.id, onclick: () => setLens(l.id) },
        h("span", { class: "ps-lens-q" }, `Question ${l.q}`), h("span", { class: "ps-lens-name" }, l.name))));
    sayLine = h("p", { class: "ps-say" });
    chipsRow = h("div", { class: "ps-chips", role: "group", "aria-label": "Show one group only" });
    readout = h("p", { class: "ps-readout", "aria-live": "polite" });
    const rows = data.books.map((book) => {
      const line = h("div", { class: "ps-strokes" });
      for (let n = book.first; n <= book.last; n += 1) {
        const p = psalm(n);
        const button = h("button", { type: "button", tabindex: n === 1 ? "0" : "-1", "data-n": String(n),
          style: `--h:${(8 + Math.sqrt(p.verses) * 4.4).toFixed(1)}px`,
          onclick: () => { focusOn(n, false); document.dispatchEvent(new CustomEvent("ps-open", { detail: { id: `PS.${n}`, from: button } })); },
          onpointerenter: () => show(n), onfocus: () => { if (current !== n) focusOn(n, false); } });
        strokes[n - 1] = button;
        line.append(button);
      }
      line.addEventListener("pointerleave", () => show(current));
      return h("div", { class: `ps-row ps-row-${book.n}` },
        h("p", { class: "ps-row-name" }, h("b", {}, bookName(book.n)), ` Psalms ${book.first}–${book.last}`),
        line,
        h("p", { class: "ps-row-close" }, h("span", { class: "ps-spark-mark", "aria-hidden": "true" }),
          h("q", {}, book.text.replace(/"/g, "")), " ", refLink(book.closing, data.passages[book.closing].label)));
    });
    const field = h("div", { class: "ps-field", role: "group", "aria-label": "The 150 psalms in their five books. Use the arrow keys to move, Enter to open." }, rows);
    field.addEventListener("keydown", keys);
    const query = new URLSearchParams(location.search);
    if (LENSES.some((l) => l.id === query.get("lens"))) lens = query.get("lens");
    if (groupsOf(lens).some((g) => g.id === query.get("only"))) only = query.get("only");
    const asked = Number(query.get("psalm"));
    const sectionEl = h("section", { class: "t-sec ps-book", id: "book", "aria-labelledby": "book-title" },
      h("header", { class: "t-head" }, h("span", { class: "t-num", "aria-hidden": "true" }, "00"),
        h("div", {}, h("h2", { id: "book-title" }, "The whole book. ", h("em", {}, "Five books, one gate.")),
          h("p", {}, `Where does a psalm stand? Each stroke is one psalm, as tall as it is long: Psalm 117 has ${data.numbers.shortest} verses, Psalm 119 has ${data.numbers.longest}. Each row is one of the five books the Berean marks.`))),
      lensRow, sayLine, chipsRow, field, readout,
      h("p", { class: "ps-note" }, "Point at a psalm to read its heading here; choose it to open its first verse and the passages that quote it. Every count is made by script from the site's Berean text."));
    paint();
    if (Number.isInteger(asked) && asked >= 1 && asked <= 150) focusOn(asked, false);
    return sectionEl;
  }
  function setLens(id, group = null) {
    lens = lensOf(id).id;
    only = group && groupsOf(lens).some((g) => g.id === group) ? group : null;
    paint();
    remember();
  }
  // The thin strip over each part: the 150 psalms in their books, the ones the part cites lit.
  function strip(numbers, partTitle) {
    const lit = new Set(numbers);
    return h("figure", { class: "ps-strip" },
      h("div", { class: "ps-strip-books", "aria-hidden": "true" }, data.books.map((b) => h("span", { class: "ps-strip-book" },
        Array.from({ length: b.last - b.first + 1 }, (_, i) => h("i", { class: lit.has(b.first + i) ? "is-on" : "" }))))),
      h("figcaption", {}, `${partTitle} cites ${plural(numbers.length, "psalm", "psalms")} of the 150`, numbers.length <= 12 ? `: ${numbers.join(", ")}` : "", "."));
  }
  return { section, setLens, strip, LENSES };
})();
