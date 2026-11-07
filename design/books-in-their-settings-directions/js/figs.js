// The figures of Reading the Bible well. Every phrase and count they show comes from data.js, where build-data.py
// checked it against the Berean; nothing here types a verse. Each figure states its question, says in one sentence
// what it shows, can be pointed at and chosen, and reaches the verse.
window.RBWFigs = ({ D, h, art, verses, refLink, runs, label, figure, Art }) => {
  const NS = "http://www.w3.org/2000/svg";
  const s = (tag, attrs = {}, ...children) => {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== null) element.setAttribute(key, value);
    element.append(...children.flat().filter(Boolean));
    return element;
  };
  const books = Object.fromEntries(D.shelf.books.map((b) => [b.code, b]));
  const divName = Object.fromEntries(D.shelf.divisions);
  // Sizes drawn from data go into one constructed style sheet, never into inline styles.
  const sizes = new CSSStyleSheet();
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sizes];
  const sizeRule = (css) => sizes.insertRule(css, sizes.cssRules.length);
  const verseOf = (id, cv) => verses(id).find((v) => v[0] === cv)?.[1] ?? "";
  // A row of choices moved through with the arrow keys (one tab stop for the whole figure).
  function roving(items, choose) {
    let at = 0;
    items.forEach((item, i) => {
      item.setAttribute("tabindex", i === 0 ? "0" : "-1");
      item.addEventListener("focus", () => { at = i; choose(i); });
      item.addEventListener("mouseenter", () => choose(i));
      item.addEventListener("click", () => choose(i));
      item.addEventListener("keydown", (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        const jump = { Home: 0, End: items.length - 1 }[event.key];
        if (step === undefined && jump === undefined) return;
        event.preventDefault();
        const next = jump ?? Math.min(items.length - 1, Math.max(0, at + step));
        items[at].setAttribute("tabindex", "-1");
        items[next].setAttribute("tabindex", "0");
        items[next].focus();
      });
    });
  }

  // ── The book a part opens, as a label off the shelf ──
  const bookTag = (code) => h("p", { class: `rbw-book rbw-div-${books[code].div}` }, h("i", { "aria-hidden": "true" }), h("span", {}, `Reading ${books[code].name}`), h("small", {}, divName[books[code].div]));

  // ── 00 The shelf: 66 books, as tall as their chapters ──
  function shelf() {
    const readout = h("p", { class: "rbw-readout", "aria-live": "polite" });
    const tell = (b) => readout.replaceChildren(...[h("b", {}, b.name), ` · ${b.ch} chapter${b.ch > 1 ? "s" : ""} · ${divName[b.div]}`,
      b.walked ? [" · ", h("a", { href: b.walked === "opening" ? "#part-02" : `#part-${b.walked}` }, b.walked === "opening" ? "read in the opening and part 02" : `read in part ${b.walked}`)] : b.named ? " · named on this page" : " · not opened here"].flat());
    const spines = [];
    const row = (list, name) => h("div", { class: "rbw-shelf-row", role: "group", "aria-label": name }, list.map((b) => {
      const spine = h("span", { class: `rbw-spine rbw-div-${b.div}${b.walked ? " is-walked" : b.named ? " is-named" : ""}`, role: "img", "aria-label": `${b.name}, ${b.ch} chapters` }, h("i", { style: undefined }), b.walked ? h("small", {}, b.name) : null);
      spine.dataset.ch = b.ch;
      spines.push([spine, b]);
      return spine;
    }));
    const old = D.shelf.books.slice(0, 39), knew = D.shelf.books.slice(39);
    const fig = figure("shelf", "What is the Bible?", "A library of sixty-six books, each drawn as tall as its chapters and coloured by its part of the Bible. The five this study opens stand out; the others it names are half-lit. Point at a book to name it; choose a lit one to go to its part.",
      h("div", { class: "rbw-shelf" }, row(old, "Old Testament, 39 books"), h("span", { class: "rbw-shelf-name" }, "Old Testament · 39"), row(knew, "New Testament, 27 books"), h("span", { class: "rbw-shelf-name" }, "New Testament · 27")),
      readout,
      h("ul", { class: "rbw-key" }, D.shelf.divisions.map(([key, name]) => h("li", { class: `rbw-div-${key}` }, h("i", { "aria-hidden": "true" }), name))));
    spines.forEach(([spine, b]) => { spine.classList.add(`rbw-h${Math.min(150, b.ch)}`); });
    [...new Set(D.shelf.books.map((b) => b.ch))].forEach((ch) => sizeRule(`.rbw-h${ch} i { height: ${Math.round(10 + Math.sqrt(ch) * 9)}px; }`));
    roving(spines.map(([spine]) => spine), (i) => { spines.forEach(([x], j) => x.classList.toggle("is-on", i === j)); tell(spines[i][1]); });
    spines.forEach(([spine, b]) => b.walked && spine.addEventListener("click", () => document.getElementById(b.walked === "opening" ? "part-02" : `part-${b.walked}`)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })));
    tell(books.JHN);
    return fig;
  }

  // ── 01 John as three weeks ──
  function john() {
    const J = D.john;
    const notes = J.days.filter((d) => d.note);
    return figure("john", "How long is John at a chapter a day?", "Three weeks. Each square is a day and a chapter; choose one to open that chapter here.",
      h("p", { class: "rbw-day-q" }, label("Each day, ask"), h("q", {}, J.question)),
      h("ol", { class: "rbw-weeks-grid" }, J.days.map((d) => h("li", { class: d.note ? "has-note" : "" },
        h("a", { class: "rbw-ref rbw-day", href: `?ref=${d.r}`, "data-ref": d.r, "aria-label": `Day ${d.n}: John ${d.n}, ${d.verses} verses` },
          h("small", {}, `Day ${d.n}`), h("b", {}, String(d.n)), h("span", {}, `${d.verses} verses`))))),
      h("ul", { class: "rbw-day-notes" }, notes.map((d) => h("li", {}, h("b", {}, `Day ${d.n} · ${d.note.t}`), " ", refLink(d.note.r), ": ", d.note.says))));
  }

  // ── 02 Six example weeks: a streak, or coming back ──
  function weeks() {
    const W = D.weeks;
    const marks = [...W.marks].map(Number);
    let run = 0;
    const counts = marks.map((m) => (run = m ? run + 1 : 0));
    const cells = marks.map((m, i) => h("li", { class: m ? "is-read" : "is-missed", "aria-label": `Day ${i + 1}: ${m ? "read" : "missed"}` },
      h("i", { "aria-hidden": "true" }), h("span", { class: "rbw-count", "aria-hidden": "true" }, m ? String(counts[i]) : "0")));
    const grid = h("ol", { class: "rbw-days is-back" }, cells);
    const summary = h("p", { class: "rbw-readout", "aria-live": "polite" });
    const views = {
      streak: () => summary.replaceChildren(h("b", {}, "Counted as a streak: "), `the longest run is ${W.longest} days, and the count falls to nothing at every gap.`),
      back: () => summary.replaceChildren(h("b", {}, "Counted as coming back: "), `read on ${W.read} of ${marks.length} days, and came back ${W.returns} times. The gaps stay; the line goes on.`),
    };
    const buttons = Object.keys(views).map((key) => h("button", { type: "button", class: "rbw-toggle", "aria-pressed": key === "back" ? "true" : "false", onclick: () => show(key) }, key === "back" ? "Counted as coming back" : "Counted as a streak"));
    function show(key) {
      buttons.forEach((b, i) => b.setAttribute("aria-pressed", String(Object.keys(views)[i] === key)));
      grid.className = `rbw-days is-${key}`;
      views[key]();
    }
    show("back");
    return figure("weeks", "What does a missed day do to a habit?", "A habit is not a streak; it is coming back. Choose how to count the same six weeks.",
      h("div", { class: "rbw-toggles", role: "group", "aria-label": "How to count" }, buttons), grid, summary,
      h("p", { class: "rbw-note" }, "An example of six weeks, not anyone's record."));
  }

  // ── 03 The reader, labelled ──
  function reader() {
    const R = D.reader;
    const marks = {};
    const mark = (kind, n) => h("span", { class: "rbw-pin", "data-k": kind, "aria-hidden": "true" }, String(n));
    R.labels.forEach((l, i) => { marks[`${l.k}`] = i + 1; });
    const at = (kind) => R.labels.find((l) => l.k === kind)?.cv;
    const lordText = (text) => text.split("LORD").flatMap((piece, i) => (i ? [h("span", { class: "rbw-lord", "data-k": "lord" }, "LORD"), piece] : [piece]));
    let firstLord = true;
    const page = h("div", { class: "rbw-sample", "aria-label": `Sample of the reader: ${D.passages[R.r].label}` }, verses(R.r).map(([cv, text]) => {
      const [c, v] = cv.split(":");
      const out = [];
      if (v === "1") out.push(h("span", { class: "rbw-chapnum", "data-k": "chapter" }, c, at("chapter") === cv ? mark("chapter", marks.chapter) : null));
      (R.heads[cv] || []).forEach((head) => out.push(h("span", { class: "rbw-head-ed", "data-k": "heading" }, head, at("heading") === cv ? mark("heading", marks.heading) : null)));
      const body = at("lord") === cv && firstLord ? [lordText(text), mark("lord", marks.lord)] : [text];
      if (at("lord") === cv) firstLord = false;
      out.push(h("span", { class: "rbw-sv" }, h("sup", { "data-k": at("verse") === cv ? "verse" : undefined }, v), at("verse") === cv ? mark("verse", marks.verse) : null, " ", body, " "));
      return out;
    }));
    const notes = R.labels.map((l, i) => h("li", { tabindex: "0", "data-k": l.k },
      h("span", { class: "rbw-pin", "aria-hidden": "true" }, String(i + 1)), h("b", {}, l.name), h("span", {}, ` · ${l.means}. ${l.note}`)));
    const light = (kind) => page.querySelectorAll("[data-k]").forEach((el) => el.classList.toggle("is-on", el.dataset.k === kind));
    notes.forEach((n) => { ["mouseenter", "focus"].forEach((e) => n.addEventListener(e, () => light(n.dataset.k))); ["mouseleave", "blur"].forEach((e) => n.addEventListener(e, () => light(null))); });
    return figure("reader", "What is on the page besides the text?", "Some of what you see was added to help you find your way. Point at a label to find it in the sample.",
      h("div", { class: "rbw-reader" }, page, h("ol", { class: "rbw-pins" }, notes)),
      h("p", { class: "rbw-note" }, refLink(R.r), " as the Berean prints it, with its editors' heading. Not a picture of the site's reader."));
  }

  // ── 04 Jonah: the whole book on one line ──
  function jonah() {
    const J = D.jonah;
    const W = 960, top = 112, step = 30, gap = 14, left = 18, right = 26;
    const per = (W - left - right - gap * 3) / J.line.length;
    const chapterOf = (cv) => Number(cv.split(":")[0]);
    const x = (i) => left + per * (i + .5) + gap * (chapterOf(J.line[i].cv) - 1);
    const y = (level) => top - level * step;
    const index = Object.fromEntries(J.line.map((v, i) => [v.cv, i]));
    let d = `M${x(0)} ${y(J.line[0].level)}`;
    J.line.forEach((v, i) => { if (i) { const px = x(i - 1), py = y(J.line[i - 1].level), nx = x(i), ny = y(v.level); d += ny === py ? ` L${nx} ${ny}` : ` C${px + (nx - px) * .6} ${py} ${px + (nx - px) * .4} ${ny} ${nx} ${ny}`; } });
    const bands = [0, 1, 2, 3].map((c) => {
      const first = J.line.findIndex((v) => chapterOf(v.cv) === c + 1), last = first + J.chapters[c] - 1;
      return s("g", { class: "rbw-band" }, s("rect", { x: x(first) - per / 2, y: 64, width: x(last) - x(first) + per, height: y(-5) - 28, rx: 4 }), s("text", { x: x(first) - per / 2 + 6, y: y(-5) + 30 }, `Chapter ${c + 1}`));
    });
    const half = (from, to, text, end) => s("g", { class: "rbw-half" }, s("path", { d: `M${x(from) - per / 2} 56 v-6 H${x(to) + per / 2} v6` }),
      s("text", { x: end ? x(to) + per / 2 : x(from) - per / 2, y: 44, "text-anchor": end ? "end" : "start" }, text));
    const c3 = index["3:1"];
    const reason = J.reason, ri = index[reason.at], bi = index[reason.back];
    const dots = J.line.map((v, i) => s("circle", { class: `rbw-v${J.fish.includes(v.cv) ? " is-fish" : ""}`, cx: x(i), cy: y(v.level), r: 4.2, "data-i": i, role: "button", "aria-label": `Jonah ${v.cv}` }));
    const labels = J.steps.map((st) => (st.level === 0
      ? s("text", { class: "rbw-step-t", x: x(index[st.cv]) - 8, y: y(st.level) - 8, "text-anchor": "end" }, `${st.t} ↑`)
      : s("text", { class: "rbw-step-t", x: x(index[st.cv]) + 7, y: y(st.level) - 7 }, st.t)));
    const icons = J.appointed.map((a, k) => {
      const g = s("g", { class: "rbw-appointed", transform: `translate(${x(index[a.cv]) - 11} ${y(J.line[index[a.cv]].level) + 10 + Math.max(0, k - 1) * 24})` });
      g.innerHTML = Art[a.draw].replace(/<svg[^>]*>|<\/svg>/g, ""); // fixed drawings from art.js only
      return g;
    });
    const svg = s("svg", { viewBox: `0 0 ${W} 330`, class: "rbw-jonah-svg", "aria-hidden": "true" },
      bands, half(0, c3 - 1, "Chapters 1–2: Jonah runs", true), half(c3, J.line.length - 1, "Chapters 3–4: Jonah obeys, and is angry"),
      s("path", { class: "rbw-ground", d: `M${left} ${y(0)} H${W - right}` }),
      s("path", { class: "rbw-arc", d: `M${x(ri)} ${y(0) - 8} C${x(ri)} ${8} ${x(bi)} ${8} ${x(bi)} ${y(J.line[bi].level) - 8}` }),
      s("text", { class: "rbw-arc-t", x: (x(ri) + x(bi)) / 2, y: 20, "text-anchor": "middle" }, "4:2 tells why he ran in 1:3"),
      J.command.at.map((cv) => s("path", { class: "rbw-cmd-tick", d: `M${x(index[cv])} ${y(0) - 7} v-12` })),
      s("path", { class: "rbw-line", d }),
      s("path", { class: "rbw-open", d: `M${x(J.line.length - 1)} ${y(0)} h${right - 4}` }),
      s("text", { class: "rbw-end", x: x(J.line.length - 1) + 4, y: y(0) + 26 }, "?"),
      labels, icons, dots);
    const readout = h("p", { class: "rbw-readout rbw-jonah-read", "aria-live": "polite" });
    function choose(i) {
      dots.forEach((dot, j) => dot.classList.toggle("is-on", i === j));
      const v = J.line[i];
      const stepHere = J.steps.find((st) => st.cv === v.cv), appointed = J.appointed.find((a) => a.cv === v.cv);
      const tag = stepHere ? stepHere.t : appointed ? `God appointed: ${appointed.t}` : J.command.at.includes(v.cv) ? "The same command opens this half" : v.cv === reason.at ? "The reason, told last" : v.cv === J.end ? "The book ends on a question" : null;
      readout.replaceChildren(h("b", {}, `Jonah ${v.cv}`), tag ? h("span", { class: "rbw-tag" }, tag) : null, " ", verseOf(J.r, v.cv));
    }
    const holder = h("div", { class: "rbw-jonah", tabindex: "0", role: "group", "aria-label": "Jonah's 48 verses on one line. Use the arrow keys to move from verse to verse." }, svg);
    let at = 0;
    dots.forEach((dot, i) => { dot.addEventListener("mouseenter", () => { at = i; choose(i); }); dot.addEventListener("click", () => { at = i; choose(i); }); });
    holder.addEventListener("keydown", (event) => {
      const move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }[event.key];
      if (move === undefined) return;
      event.preventDefault();
      at = Math.min(J.line.length - 1, Math.max(0, at + move));
      choose(at);
    });
    choose(index[J.steps[0].cv]); at = index[J.steps[0].cv];
    return figure("jonah", "Where is the book going?", `Down, and back. The line follows Jonah from the call, down to the roots of the mountains, and up onto dry land; the fish is ${J.fish.length} verses of ${J.line.length}. Point at a verse, or use the arrow keys, to read it here.`,
      holder, readout,
      h("ul", { class: "rbw-jonah-key" },
        h("li", {}, h("b", {}, "Down and up"), J.steps.map((st, i) => [i ? " · " : " ", refLink(st.r, st.cv), " ", h("q", {}, st.t)])),
        h("li", {}, h("b", {}, "Appointed"), J.appointed.map((a, i) => [i ? " · " : " ", refLink(a.r, a.cv), " ", a.t])),
        h("li", {}, h("b", {}, "The same command"), " (the gold ticks) ", h("q", {}, J.command.t), " ", J.command.r.map((r, i) => [i ? " and " : "", refLink(r)])),
        h("li", {}, h("b", {}, "The reason, told last"), " ", refLink(reason.r), " ", h("q", {}, reason.t), ", back to ", refLink(reason.backR))));
  }

  // ── 04 Whose words was Jonah using? ──
  function shared() {
    const S = D.shared;
    const inAll = S.rows.filter((r) => r.in.every(Boolean)).length;
    const missing = S.verses.map((v, i) => [v, S.rows.filter((r) => !r.in[i]).length]).filter(([, n]) => n);
    const says = `${inAll} of ${S.rows.length} phrases are in all three verses.` + missing.map(([v, n]) => ` ${D.passages[v].label} lacks ${n}.`).join("");
    return figure("shared", "Whose words was Jonah using?", `God's own, about Himself. ${says}`,
      h("table", { class: "rbw-shared" },
        h("thead", {}, h("tr", {}, h("th", { scope: "col" }, h("span", { class: "rbw-sr" }, "Phrase")), S.verses.map((v) => h("th", { scope: "col" }, refLink(v))))),
        h("tbody", {}, S.rows.map((r) => h("tr", {}, h("th", { scope: "row" }, h("q", {}, r.t)), r.in.map((yes, i) => h("td", { class: yes ? "is-in" : "is-out", title: `${yes ? "In" : "Not in"} ${D.passages[S.verses[i]].label}` }, h("i", { "aria-hidden": "true" }), h("span", { class: "rbw-sr" }, yes ? "in this verse" : "not in this verse"))))))));
  }

  // ── 05 The letter around the verse ──
  function letter() {
    const L = D.letter;
    const notes = Object.fromEntries(L.notes.map((n) => [n.cv, n]));
    const rows = verses(L.r).map(([cv, text]) => {
      const n = notes[cv];
      const row = h("li", { class: `rbw-lrow${cv === L.focus ? " is-focus" : ""}`, "data-cv": cv },
        n ? h("span", { class: "rbw-lnote", tabindex: "0" }, n.t) : h("span", { class: "rbw-lnote is-empty", "aria-hidden": "true" }),
        h("span", { class: "rbw-ltext" }, h("sup", {}, cv.split(":")[1]), " ", text));
      return row;
    });
    rows.forEach((row) => { const note = row.querySelector(".rbw-lnote[tabindex]"); if (!note) return; ["mouseenter", "focus"].forEach((e) => note.addEventListener(e, () => row.classList.add("is-on"))); ["mouseleave", "blur"].forEach((e) => note.addEventListener(e, () => row.classList.remove("is-on"))); });
    const focusText = verseOf(L.r, L.focus);
    return figure("letter", "Where does verse 11 stand?", `Inside a letter, with ${L.before} verses before it. The card is how the verse is usually seen; the letter is where it was written. Point at a note in the margin to light its verse.`,
      h("div", { class: "rbw-letter-wrap" },
        h("div", { class: "rbw-card" }, h("p", {}, focusText), h("small", {}, "Jeremiah 29:11"), h("span", { class: "rbw-card-cap" }, "As it is usually seen: alone")),
        h("div", { class: "rbw-letter" }, h("p", { class: "rbw-letter-head" }, label("The letter"), refLink(L.r), " · from Jerusalem to Babylon"), h("ol", {}, rows))));
  }

  function years() {
    const Y = D.years;
    const most = Math.max(...Y.map((y) => y.n));
    Y.forEach((y) => sizeRule(`.rbw-w${Math.round((y.n / most) * 100)} { width: ${Math.max(1.2, (y.n / most) * 100)}%; }`));
    return figure("years", "How long was the wait?", "Seventy years against two, drawn to the same scale. Most of the adults who first heard the letter would die in Babylon.",
      h("ul", { class: "rbw-years" }, Y.map((y) => h("li", {},
        h("span", { class: "rbw-years-who" }, y.who), h("span", { class: "rbw-years-bar" }, h("i", { class: `rbw-w${Math.round((y.n / most) * 100)}` })),
        h("span", { class: "rbw-years-n" }, h("b", {}, String(y.n)), " ", h("q", {}, y.t), " ", refLink(y.r))))));
  }

  // ── 06 Six stepping stones ──
  function stones(items) {
    const readout = h("div", { class: "rbw-stone-read", "aria-live": "polite" });
    const buttons = items.map((it) => h("button", { type: "button", class: "rbw-stone", "aria-pressed": "false" },
      art(Art.stoneLamp, "rbw-stone-lamp"), h("span", { class: "rbw-stone-n" }, String(it.n)), h("span", { class: "rbw-stone-q" }, runs(it.label))));
    const show = (i) => {
      buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
      readout.replaceChildren(h("b", {}, `${items[i].n} · `, runs(items[i].label)), items[i].runs.length ? h("p", {}, runs(items[i].runs)) : null);
    };
    buttons.forEach((b, i) => b.addEventListener("click", () => show(i)));
    show(0);
    return figure("stones", "What do I ask of my next passage?", "Six questions, in order, one step at a time. Choose a stone; the lamp moves to it.",
      h("ol", { class: "rbw-stones" }, buttons.map((b) => h("li", {}, b))), readout);
  }

  return { bookTag, shelf, john, weeks, reader, jonah, shared, letter, years, stones };
};
