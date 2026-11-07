// Following Jesus, one mock-up page drawn from data.js (built by build-data.py from the study's content.md).
// The habit it teaches: read the line inside the whole. So the whole sermon is drawn as one band of verses, and every
// famous line, and every part, is shown in its place on it.
(() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`Following Jesus: ${detail}`);
  }
  if (!window.FJ) return stop("This page has no study data: data.js did not load. Run build-data.py, then reload.", "window.FJ is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.FJArt || !window.FJKit || !window.FJBand) return stop("This page could not load its frame or drawings. Reload the page.", "Frame, icon, FJArt, FJKit or FJBand is missing");

  const { study, passages, map, drawings, numbers, callbacks, sources } = window.FJ;
  const { h, s, art, own, refLink, label, runs, setParam, getParam, sectionHead } = FJKit;
  const verseList = (id) => passages[id].verses;
  const back = ["/study/theology?area=jesus", "Jesus Christ"];

  // Every verse of every whole the band can draw opens on its own in the sheet, so ?ref= works for them on reload.
  [map.sermon, ...map.lines.map((l) => l.w)].forEach((id) => {
    const book = passages[id].label.replace(/ \d.*$/, ""), code = id.split(".")[0];
    verseList(id).forEach(([cv, text]) => {
      const key = `${code}.${cv.replace(":", ".")}`;
      if (!own(passages, key)) passages[key] = { label: `${book} ${cv}`, verses: [[cv, text]] };
    });
  });
  const verseId = (wholeId, cv) => `${wholeId.split(".")[0]}.${cv.replace(":", ".")}`;
  const cvsOf = (id) => verseList(id).map(([cv]) => cv);
  const partVerses = Object.fromEntries(Object.entries(map.ranges).map(([n, id]) => [n, cvsOf(id)]));
  const skip = new Set(cvsOf(map.notRead));
  const frames = Object.fromEntries(map.frames.map((f) => [f.id, f]));
  const archOf = (id, lift, cls, text) => ({ a: cvsOf(frames[id].o), b: cvsOf(frames[id].s), lift, cls, text });

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  const header = Frame.header, footer = Frame.footer;
  const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
  Frame.header = () => header()
    .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
    .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
  const main = Frame.mount();
  const page = h("div", { class: "wrap t-page ms-page fj-page" });
  main.append(page);
  const sheet = FJSheet(passages);


  // ── Hero: the standard heading ──
  function hero() {
    const opening = study.opening[0];
    const figures = [
      ["The sermon", numbers.sermonVerses, `verses in Matthew 5–7. This study reads ${numbers.sermonRead} of them and leaves the prayer to its own study`],
      ["Parts", numbers.parts, "six read the sermon through; three read what following costs and where the strength comes from"],
      ["“But I tell you”", numbers.butITellYou, "times in Matthew 5, each going past the act to its root"],
      ["Quoted at length", numbers.versesShown, "verses on this page, each checked word for word against the Berean"],
    ];
    return h("section", { class: "t-sec-landing fj-hero", id: "top" },
      h("div", { class: "hc-intro fj-intro" },
        h("div", {},
          h("nav", { class: "fj-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: back[0] }, back[1]), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "fj-here", "aria-current": "page" }, "Following Jesus")),
          h("p", { class: "fj-concepts" }, study.concepts.join(" · ")),
          h("h1", { tabindex: "-1" }, study.titleParts[0], " ", h("em", {}, study.titleParts[1])),
          h("p", { class: "hc-lede fj-lede" }, runs(study.lead)),
          h("figure", { class: "fj-opening" }, h("blockquote", {}, opening.text),
            h("figcaption", {}, refLink(opening.r, opening.label), " · Berean Standard Bible"))),
        h("figure", { class: "ms-hero-art fj-hero-art" }, art(FJArt.hero), h("span", { class: "ms-art-note" }, h("i"), study.motto[0], h("br"), h("span", {}, study.motto[1])))),
      h("dl", { class: "fj-figures" }, figures.map(([name, value, note]) => h("div", {}, h("dt", {}, name), h("dd", {}, String(value)), h("small", {}, note)))),
      h("nav", { class: "fj-toc", "aria-label": "On this page" },
        h("a", { href: "#map" }, h("b", {}, "00"), "The line inside the whole"),
        study.parts.map((p) => h("a", { href: `#part-${p.n}` }, h("b", {}, p.n), p.title.split(":")[0])),
        h("a", { href: "#question" }, h("b", {}, "?"), "Can anyone live this?"),
        h("a", { href: "#close" }, h("b", {}, "→"), "Hear, and build")));
  }

  // ── 00 The line inside the whole: choose a famous line, see its three answers on the band ──
  function locator() {
    const lines = Object.fromEntries(map.lines.map((l) => [l.id, l]));
    const picker = h("div", { class: "fj-picker", role: "group", "aria-label": "Famous lines" },
      h("p", { class: "fj-picker-k" }, "In the sermon"),
      h("div", { class: "fj-words" }, map.lines.filter((l) => l.w === map.sermon).map(wordButton)),
      h("p", { class: "fj-picker-k" }, "After the sermon"),
      h("div", { class: "fj-words" }, map.lines.filter((l) => l.w !== map.sermon).map(wordButton)));
    const bandHolder = h("div", { class: "fj-map-band" });
    const caption = h("p", { class: "fj-band-say", "aria-live": "polite" }, "Point at a verse to read its first words here; choose it to open it.");
    const answer = h("div", { class: "fj-answer", "aria-live": "polite" });
    function wordButton(line) {
      return h("button", { type: "button", class: "fj-word", "data-line": line.id, "aria-pressed": "false", onclick: () => choose(line.id, true) }, line.says);
    }
    function choose(id, push) {
      if (!own(lines, id)) return;
      const line = lines[id];
      picker.querySelectorAll(".fj-word").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.line === id)));
      const isSermon = line.w === map.sermon;
      const marks = [...map.lines.filter((l) => l.w === line.w && l.id !== id).map((l) => ({ cv: cvsOf(l.r)[0], kind: "famous" })),
        { cv: cvsOf(line.r)[0], kind: "line" }, { cv: cvsOf(line.wr)[0], kind: "who" }, { cv: cvsOf(line.br)[0], kind: "before" }, { cv: cvsOf(line.ar)[0], kind: "after" }];
      const band = FJBand.draw({ verses: verseList(line.w), top: 112, tall: 40, marks, skip: isSermon ? skip : new Set(),
        parts: isSermon ? partVerses : {}, label: { cv: cvsOf(line.r)[0], text: line.says },
        arches: isSermon ? [archOf("listeners", 100, "fj-arch-who", "who is listening: 5:1–2 and 7:28–29"), archOf("law", 58, "fj-arch-law", "“the Law and the Prophets”: 5:17 and 7:12")] : [] });
      hover(band, line.w, caption);
      bandHolder.replaceChildren(h("p", { class: "fj-band-title" }, label("The whole"), " ", refLink(line.w, passages[line.w].label), isSermon ? h("span", { class: "fj-band-note" }, " · 111 marks, one for each verse; the hatched ones are the prayer, read in its own study") : h("span", { class: "fj-band-note" }, ` · ${verseList(line.w).length} marks, one for each verse`)), band.svg);
      answer.replaceChildren(
        h("figure", { class: "fj-said" }, h("blockquote", {}, "“", line.phrase, "”"), h("figcaption", {}, refLink(line.r, passages[line.r].label), " · BSB")),
        h("dl", { class: "fj-three" },
          three("who", "Who is listening", line.who, line.who_phrase, line.wr),
          three("before", "What came just before", null, line.before_phrase, line.br),
          three("after", "Where it is going", null, line.after_phrase, line.ar)),
        h("p", { class: "fj-reading" }, label("Read inside the whole"), " ", line.reading));
      if (push) setParam("line", id);
    }
    function three(kind, name, who, phrase, ref) {
      return h("div", { class: `fj-three-${kind}` },
        h("dt", {}, markIcon(kind), name),
        h("dd", {}, who ? h("span", { class: "fj-who" }, who, ". ") : null, h("q", {}, phrase), " ", refLink(ref, passages[ref].label)));
    }
    const section = h("section", { class: "t-sec fj-map", id: "map" },
      sectionHead("00", "The line", "inside the whole.", "Choose a famous line. The band shows the whole passage it belongs to, one mark for each verse, and three places on it: who is listening, what came just before, and where the passage is going."),
      picker, bandHolder, caption, answer,
      h("div", { class: "fj-legend", "aria-hidden": "true" }, markIcon("line"), "the line", markIcon("who"), "who is listening", markIcon("before"), "just before", markIcon("after"), "where it goes"),
      h("div", { class: "fj-intro-note" }, study.intro.map((p) => h("p", {}, runs(p)))));
    const asked = getParam("line");
    choose(own(lines, asked) ? asked : "judge", false);
    section.choose = (id) => { choose(id, true); section.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
    locator.section = section;
    return section;
  }

  function markIcon(kind) {
    const shapes = { line: s("circle", { cx: 7, cy: 7, r: 4.5, class: "fj-mark-dot" }), who: s("rect", { x: 3, y: 3, width: 8, height: 8, class: "fj-mark fj-mark-who" }),
      before: s("circle", { cx: 7, cy: 7, r: 4, class: "fj-mark fj-mark-before" }), after: s("path", { d: "M3 2L12 7L3 12Z", class: "fj-mark fj-mark-after" }) };
    return s("svg", { viewBox: "0 0 14 14", class: "fj-mark-icon", "aria-hidden": "true" }, shapes[kind]);
  }

  function hover(band, wholeId, caption) {
    const say = (cv) => {
      const text = verseList(wholeId).find(([v]) => v === cv)?.[1] || "";
      caption.textContent = `${passages[wholeId].label.replace(/ \d.*$/, "")} ${cv} · ${text.length > 110 ? `${text.slice(0, 108)}…` : text}`;
    };
    band.svg.addEventListener("pointermove", (event) => { const cv = FJBand.verseAt(band.svg, band.xs, event.clientX); if (cv) say(cv); });
    band.svg.addEventListener("click", (event) => { const cv = FJBand.verseAt(band.svg, band.xs, event.clientX); if (cv) sheet.open(verseId(wholeId, cv)); });
  }

  // ── 01–06 The sermon, read through, with a thin band that keeps the reader's place ──
  function sermon(parts) {
    const holder = h("div", { class: "fj-follow-band" });
    const where = h("p", { class: "fj-follow-say" });
    const wrap = h("section", { class: "t-sec fj-sermon", "aria-label": "The sermon, read through" },
      h("div", { class: "fj-follow", "aria-hidden": "true" }, where, holder), parts.map((p) => part(p)));
    const show = (n) => {
      holder.replaceChildren(FJBand.draw({ verses: verseList(map.sermon), top: 4, tall: 18, labels: false, parts: partVerses, current: n, skip }).svg);
      where.replaceChildren(h("b", {}, n), ` of 06 · ${passages[map.ranges[n]].label} · where you are in the sermon`);
    };
    show(parts[0].n);
    const seen = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) show(e.target.dataset.n); }), { rootMargin: "-45% 0px -50% 0px" });
    requestAnimationFrame(() => wrap.querySelectorAll(".fj-part").forEach((el) => seen.observe(el)));
    return wrap;
  }

  // Where each part's own drawing goes, by the shape of its verses.
  const DRAWING_AT = { "01": ["quote", 1], "02": ["item", 1], "03": ["quote", 1], "04": ["index", 3], "05": ["end"], "06": ["index", 1], "09": ["quote", 1] };
  const DRAWINGS = { "01": blessed, "02": sayings, "03": practices, "04": richMan, "05": lawArch, "06": pairs, "09": vine };

  function part(p, extra = "") {
    const body = h("div", { class: "fj-body" });
    const at = DRAWING_AT[p.n];
    let quotes = 0, list = null;
    p.blocks.forEach((block, index) => {
      if (at && at[0] === "item" && block.k === "item" && !list) body.append(DRAWINGS[p.n]());
      if (block.k === "item") { if (!list) body.append(list = h("ul", { class: "fj-items" })); list.append(renderBlock(block)); }
      else { list = null; body.append(renderBlock(block)); }
      if (block.k === "quote") quotes += 1;
      if (at && ((at[0] === "quote" && block.k === "quote" && quotes === at[1]) || (at[0] === "index" && index + 1 === at[1]))) body.append(DRAWINGS[p.n]());
    });
    if (at && at[0] === "end") body.append(DRAWINGS[p.n]());
    body.append(h("dl", { class: "fj-ask" },
      h("div", {}, h("dt", {}, "Consider"), h("dd", {}, runs(p.consider))),
      h("div", {}, h("dt", {}, "Reflect"), h("dd", {}, runs(p.reflect)))));
    const [title, turn] = p.title.includes(": ") ? p.title.split(/: (.*)/) : [p.title, ""];
    const readingLinks = p.readings.map((id, i) => [i ? " · " : "", refLink(id, passages[id].label)]).flat();
    const quoted = (p.quoted || []).map((id) => [" · quoted: ", refLink(id, passages[id].label)]).flat();
    const mini = own(map.ranges, p.n) ? h("div", { class: "fj-mini-band" }, FJBand.draw({ verses: verseList(map.sermon), top: 4, tall: 16, labels: false, parts: partVerses, current: p.n, skip }).svg) : null;
    return h("article", { class: `fj-part ${extra}`.trim(), id: `part-${p.n}`, "data-n": p.n, "aria-labelledby": `part-${p.n}-title` },
      h("header", { class: "fj-part-head" },
        h("span", { class: "fj-n", "aria-hidden": "true" }, p.n),
        h("div", {}, h("h2", { id: `part-${p.n}-title` }, title, turn ? h("em", {}, turn) : null),
          h("p", { class: "fj-readings" }, label("Main readings"), " ", readingLinks, quoted), mini)),
      body);
  }

  function renderBlock(block) {
    switch (block.k) {
      case "p": return h("p", {}, runs(block.runs));
      case "quote": return h("figure", { class: "fj-quote" }, h("blockquote", {}, block.text), h("figcaption", {}, refLink(block.r, block.label), " · BSB"));
      case "care": return h("aside", { class: "fj-care" }, label("With care"), h("p", {}, runs(block.runs)));
      case "limits": return h("p", { class: "fj-limits" }, label("Its limits"), " ", runs(block.runs));
      case "item": return h("li", {}, h("strong", {}, block.label, "."), " ", runs(block.runs));
      case "voice": return h("div", { class: "fj-voice" }, h("h3", {}, block.label), h("p", {}, runs(block.runs)));
      default: console.error(`Following Jesus: unknown block ${block.k}`); return "";
    }
  }

  // 01: nine sayings that begin "Blessed are"
  function blessed() {
    return h("figure", { class: "fj-blessed fj-wide" },
      h("ol", {}, drawings.blessed.map((row) => h("li", {}, h("span", { class: "fj-b-k" }, "Blessed are"), h("span", { class: "fj-b-who" }, row.who), h("span", { class: "fj-b-for" }, row.promise), refLink(row.r, passages[row.r].label)))),
      h("figcaption", {}, "Nine blessings before a single command. Each names who is blessed, and each comes with a promise."));
  }
  // 02: six times what was said, set beside "But I tell you", the act above the line and its root below it
  function sayings() {
    return h("figure", { class: "fj-ground fj-wide" },
      h("div", { class: "fj-ground-grid" }, drawings.sayings.map((x) => h("div", { class: "fj-g-col" },
        h("p", { class: "fj-g-topic" }, x.topic),
        h("p", { class: "fj-g-said" }, h("q", {}, x.said), " ", refLink(x.sr, passages[x.sr].label)),
        h("p", { class: "fj-g-tell" }, h("span", { class: "fj-label" }, "But I tell you"), h("q", {}, x.tell), " ", refLink(x.tr, passages[x.tr].label))))),
      h("figcaption", {}, "Above the line, what was said; below it, “But I tell you”. Each time He goes down from the visible act to its root."));
  }
  // 03: three practices with one refrain; prayer is read in its own study
  function practices() {
    return h("figure", { class: "fj-three-ways fj-wide" },
      h("div", { class: "fj-tw-grid" }, drawings.practices.map((x) => h("div", { class: `fj-tw-col${x.read_here ? "" : " is-elsewhere"}` },
        h("h3", {}, x.name),
        h("p", {}, h("q", {}, x.when), " ", refLink(x.wr, passages[x.wr].label)),
        h("p", { class: "fj-tw-secret" }, h("q", {}, x.secret), " ", refLink(x.xr, passages[x.xr].label)),
        h("p", { class: "fj-tw-refrain" }, h("q", {}, drawings.refrain), " ", refLink(x.rr, passages[x.rr].label)),
        x.read_here ? null : h("p", { class: "fj-tw-note" }, "Read in ", h("a", { class: "fj-link", href: "/mockups/prayer-in-the-letters-directions/" }, h("em", {}, "Prayer across Scripture")))))),
      h("figcaption", {}, "Giving, prayer, fasting: the same warning against an audience, and the same promise, three times."));
  }
  // 04: the rich man's own words, every "I" and "my" marked, then God's answer
  function richMan() {
    const r = drawings.rich;
    return h("figure", { class: "fj-rich" },
      h("p", { class: "fj-rich-text" }, r.verses.map(([cv, parts]) => h("span", {}, h("sup", {}, cv.split(":")[1]), parts.map((x) => (typeof x === "string" ? x : h("mark", {}, x.m))), " "))),
      h("p", { class: "fj-rich-answer" }, h("q", {}, r.answer), " ", refLink(r.ar, passages[r.ar].label)),
      h("figcaption", {}, `${r.count} times in three verses the man says I, my or myself (`, refLink(r.r, passages[r.r].label), "). God is not in his sentences until God answers him."));
  }
  // 05: the band again, with the arch closing at 7:12
  function lawArch() {
    const band = FJBand.draw({ verses: verseList(map.sermon), top: 70, tall: 30, parts: partVerses, current: "05", skip, arches: [archOf("law", 56, "fj-arch-law", "“the Law and the Prophets”: 5:17 and 7:12")] });
    hover(band, map.sermon, h("span"));
    return h("figure", { class: "fj-law fj-wide" }, band.svg,
      h("figcaption", {}, "The phrase opens the middle of the sermon at ", refLink(frames.law.o, "5:17"), " and closes it at ", refLink(frames.law.s, "7:12"), ". Everything between shows what it looks like for the Law to be fulfilled."));
  }
  // 06: four pairs at the end of the sermon
  function pairs() {
    return h("figure", { class: "fj-pairs fj-wide" },
      h("div", { class: "fj-pairs-grid" }, drawings.pairs.map((x) => h("div", { class: "fj-pair" },
        art(FJArt.pairs[x.id], "fj-mini-wrap"), h("h3", {}, x.name),
        h("p", { class: "fj-pair-one" }, h("q", {}, x.one), " ", refLink(x.or, passages[x.or].label)),
        h("p", { class: "fj-pair-two" }, h("q", {}, x.two), " ", refLink(x.tr, passages[x.tr].label))))),
      h("figcaption", {}, "Each pair asks the same question: has the hearing turned into a life?"));
  }
  // A curve through every point in turn (Catmull-Rom, written as cubic Béziers).
  function smoothThrough(points) {
    let d = `M${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(i + 2, points.length - 1)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1.map(round).join(" ")} ${c2.map(round).join(" ")} ${round(p2[0])} ${round(p2[1])}`;
    }
    return d;
  }
  function round(n) { return Math.round(n * 10) / 10; }
  // 09: one leaf for each verse that says "remain", sized by how often it says it
  function vine() {
    const v = drawings.vine, count = v.leaves.length;
    const svg = s("svg", { viewBox: "0 0 640 170", class: "fj-vine-svg", role: "group", "aria-label": `${v.total} times in ${count} verses, Jesus says remain` });
    // Each leaf grows from the stem: the stem is a smooth curve drawn through every leaf's base.
    const bases = v.leaves.map((leaf, i) => [60 + i * (520 / Math.max(count - 1, 1)), 96 - 34 * Math.sin((i / Math.max(count - 1, 1)) * Math.PI * 1.4)]);
    svg.append(s("path", { class: "fj-vine-stem", d: smoothThrough([[10, bases[0][1] + 14], ...bases, [630, bases[bases.length - 1][1] - 12]]) }));
    v.leaves.forEach((leaf, i) => {
      const [x, y] = bases[i], size = 8 + Math.min(Math.trunc(leaf.n), 6) * 5;
      const link = s("a", { href: `?ref=${encodeURIComponent(leaf.r)}`, class: "fj-ref fj-leaf", "data-ref": leaf.r, "aria-label": `John ${leaf.cv}, says remain ${leaf.n} times` },
        s("path", { class: "fj-leaf-shape", d: `M${x} ${y}c${size * 0.6} ${-size * 0.9} ${size * 1.6} ${-size * 0.9} ${size * 1.8} ${-size * 0.2}c${-size * 0.4} ${size * 0.8} ${-size * 1.3} ${size * 0.9} ${-size * 1.8} ${size * 0.2}Z` }),
        s("text", { x: x + size * 0.9, y: y + size * 0.55 + 14, "text-anchor": "middle", class: "fj-leaf-text" }, leaf.cv));
      svg.append(link);
    });
    return h("figure", { class: "fj-vine fj-wide" }, svg,
      h("figcaption", {}, `In ${passages[v.r].label} Jesus says “remain” ${v.total} times, in ${count} verses. Each leaf is one of those verses; the larger the leaf, the more often it says the word. Choose a leaf to read it.`));
  }

  // ── The study's question, between the sermon and what follows: two voices, each labelled ──
  function question(q) {
    const voices = q.blocks.filter((b) => b.k === "voice"), rest = q.blocks.filter((b) => b.k !== "voice");
    return h("section", { class: "t-sec fj-question", id: "question" },
      sectionHead("?", "Can anyone", "actually live this?"),
      h("div", { class: "fj-q-lead" }, rest.map(renderBlock)),
      h("div", { class: "fj-voices" }, voices.map((b, i) => h("div", { class: `fj-voice-col${i ? " is-others" : ""}` }, h("p", { class: "fj-voice-k" }, i ? "Reported as theirs" : "This site, with the confession"), renderBlock(b)))));
  }

  // ── 07 beside 08: "Read this beside part 07, not instead of it." ──
  function beside(two) {
    const [a, b] = drawings.beside;
    return h("section", { class: "t-sec fj-beside", "aria-label": "Count the cost, and come to Me" },
      h("div", { class: "fj-beside-head" },
        h("p", { class: "fj-beside-say" }, h("q", {}, a.t), " ", refLink(a.r, passages[a.r].label)),
        h("p", { class: "fj-beside-mid" }, "The same Lord says both"),
        h("p", { class: "fj-beside-say" }, h("q", {}, b.t), " ", refLink(b.r, passages[b.r].label))),
      h("div", { class: "fj-beside-grid" }, two.map((p) => part(p, "fj-part-half"))));
  }

  // ── Close: hear, and build ──
  function close() {
    const c = study.close, passage = passages[c.passage];
    const lessons = h("p", { class: "fj-callbacks" }, label("Open them in the map"), " ",
      Object.entries(callbacks).map(([phrase, id], i) => [i ? " · " : "", h("button", { type: "button", class: "fj-callback", onclick: () => locator.section.choose(id) }, `“${phrase}”`)]).flat());
    const habit = c.blocks.findIndex((b) => b.k === "p" && FJKit.plain(b.runs).includes("read the line inside the whole"));
    return h("section", { class: "t-sec fj-close", id: "close" },
      sectionHead("→", "Hear,", "and build."),
      h("div", { class: "fj-close-grid" },
        h("div", { class: "fj-close-text" }, c.blocks.map((b, i) => (i === habit ? [renderBlock(b), lessons] : renderBlock(b))).flat(),
          h("p", { class: "fj-question-line" }, runs(c.question)), h("p", { class: "fj-again" }, c.again)),
        h("figure", { class: "fj-passage" },
          h("figcaption", {}, label("The passage again"), " ", refLink(c.passage, passage.label), " · BSB"),
          h("div", { class: "fj-passage-text" }, passage.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv.split(":")[1]), text, " "))))),
      art(FJArt.close, "fj-close-art"),
      h("div", { class: "fj-sources" }, h("h3", {}, "Sources"), h("ul", {}, sources.map(([name, use]) => h("li", {}, h("b", {}, name), " ", use)))),
      h("a", { class: "fj-back", href: back[0] }, art(icon("arrowLeft", 16)), `Back to ${back[1]}`));
  }

  // ── Draw the page, now that every helper above is defined ──
  page.append(hero(), locator());
  const sermonParts = study.parts.filter((p) => own(map.ranges, p.n));
  const laterParts = study.parts.filter((p) => !own(map.ranges, p.n));
  page.append(sermon(sermonParts), question(study.questions[0]), beside(laterParts.slice(0, 2)), ...laterParts.slice(2).map((p) => part(p, "fj-part-wide")), close());
})();
