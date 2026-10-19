// Direction C · Through the witnesses. Led by the open data: the opening is the torn edge of P46 at θελ[ημα], where the
// supplied letters come and go; then choose a passage, see every open-catalogue copy of that book on a time lane with the
// study's witnesses ringed and their readings named, read the comparison, test four kinds of evidence, and follow the
// editions on a lane of their own.
window.Directions = window.Directions || {};
(() => {
  const { HERO, INTRO, LAYERS, CASES } = PM;
  const { sectionHead, figures, reasoning, closing, gapOf, choice } = PMX;
  const { byId } = MSX;

  const KEYS = {
    galatians: [{ rec: "Q1513469", label: "P46", reading: "ὑμεῖν", greek: true }],
    romans: [{ rec: "Q152962", label: "א", reading: "ω → ο", greek: true }, { rec: "Q209285", label: "B", reading: "ω → ο", greek: true }],
    mark: [{ rec: "Q697885", label: "P45", reading: "not extant" }, { rec: "Q209285", label: "B", reading: "ends 16:8" }, { rec: "Q152962", label: "א", reading: "ends 16:8" }, { rec: "Q318233", label: "A", reading: "16:9–20" }, { rec: "Q6870196", label: "304", reading: "stops at 16:8" }],
  };

  function heroArt() {
    return `<figure class="ch-art" aria-hidden="true">${Evidence.edgeArt({ big: true, loop: true })}
      <span class="ch-tag ch-tag-ink"><i></i>Surviving ink<small>θελ · three letters</small></span>
      <span class="ch-tag ch-tag-break"><i></i>The break<small>papyrus lost at the line’s end</small></span>
      <span class="ch-tag ch-tag-sup"><i></i>Supplied, not seen<small>[ημα] · θέλημα, “will”</small></span>
      <small class="ah-note">P46 · Galatians 1:4 · typographic drawing after Michigan’s transcription, not a tracing</small></figure>`;
  }

  function landing(sec) {
    sec.innerHTML = `<div class="hc-intro ms-intro pm-intro">
        <div><p class="hc-crumb"><a href="/study">Study</a><span>/</span><a href="/study/academic?area=texts">The Bible: formation &amp; transmission</a><span>/</span>02</p>
          <h1>A passage through<em>the manuscripts</em></h1>
          <p class="pm-hero-lead">${esc(HERO.lead)}</p>
          <p class="hc-lede">${esc(HERO.kicker)}, led by the copies themselves. Choose a passage and see every open-catalogue manuscript of that book in time, the few this study reads closely, and what each actually preserves.</p>
          <p class="c-layers">${LAYERS.map(([t, d], i) => `<span title="${esc(d)}"><b>0${i + 1}</b> ${esc(t)}</span>`).join("<i aria-hidden='true'></i>")}</p>
        </div>${heroArt()}</div>${figures()}`;
  }

  // The passage crystals: one per case, with how many open records hold its book and how old the oldest is.
  function chooser(sec, num, onPick) {
    sec.innerHTML = `${sectionHead(num, "Choose a passage", "Three passages, <em>three kinds of difference.</em>", esc(INTRO))}
      <div class="c-crystals" role="group" aria-label="Choose a passage">${CASES.map((c, i) => {
        const book = MS.bookOf[c.id], n = MS.counts[c.id], g = gapOf(book);
        return `<button type="button" data-pick="${c.id}" aria-pressed="${i === 0}" style="--tone: var(${c.tone})">
          <span class="c-cr-num">${c.num}</span><b>${esc(c.passage)}</b><span class="c-cr-title">${esc(c.title)}</span>
          <span class="c-cr-figs"><span><em>${formatNumber(n.records)}</em> open records of ${esc(MS.books[book].name)}</span><span>oldest: <em>${esc(g.oldest.g || g.oldest.n)}</em>, ${esc(g.oldest.d)}</span></span></button>`;
      }).join("")}</div>`;
    choice(sec, "[data-pick]", (b) => onPick(b.dataset.pick));
  }

  function copies(sec, num) {
    sec.innerHTML = `${sectionHead(num, "The copies behind it", "Every open copy, <em>in time.</em>", "One dot per dated record in the open catalogues that holds the book, on a lane for each kind. The study’s own witnesses are ringed, with what they read here. Tap a kind to hide it; choose a chapter to pick out the copies that name it.")}
      <div class="c-lanebox"><div class="c-lane"></div><aside class="c-chapters"><p class="on-k">Chapters named in the records</p><div class="c-cg"></div></aside></div>`;
    let laneApi;
    const draw = (id) => {
      const book = MS.bookOf[id];
      const el = sec.querySelector(".c-lane"); el.className = "c-lane"; el.innerHTML = "";
      laneApi = Lane.lane(el, { book, keys: KEYS[id] });
      const cg = sec.querySelector(".c-cg"); cg.className = "c-cg"; cg.innerHTML = "";
      Lane.chapters(cg, { book, onPick: (pick) => {
        if (!pick) { laneApi.only(null); return; }
        const ids = new Set(pick.records.map((r) => r.i));
        laneApi.only(ids, pick.records.length ? `<b>${esc(MS.books[book].name)} ${pick.chapter}</b> is named by ${plural(pick.records.length, "record")}: ${pick.records.map((r) => `<button type="button" class="c-inline" data-open="${r.i}">${esc(r.n)}</button>`).join(", ")}.` : `No open record names <b>${esc(MS.books[book].name)} ${pick.chapter}</b> by chapter.`);
      } });
    };
    return draw;
  }

  function readingsSec(sec, num) {
    sec.innerHTML = `${sectionHead(num, "What they read", "Read across. <em>Then look beneath.</em>", "The witnesses for the chosen passage, each joined to the reading it supports. Choose one for its evidence and sources; open its record from there.")}
      <div class="c-desk"></div><div class="c-beneath"><div class="c-reason"></div><div class="c-close"></div></div>`;
    const desk = Desk.mount(sec.querySelector(".c-desk"), { caseId: "galatians", menu: false });
    const fill = (id) => {
      desk.setCase(id);
      sec.querySelector(".c-reason").innerHTML = reasoning(id);
      const cl = sec.querySelector(".c-close"); cl.className = "c-close"; cl.innerHTML = ""; CloseReading.mount(cl, id);
    };
    return fill;
  }

  // Four kinds of evidence as crystals; each opens its test below.
  const KINDS = [
    { id: "restore", title: "A restoration", line: "Letters an editor supplies at a break", icon: "<path d='M4 18l4-12 6-1 2 4-3 9z'/><path d='M16 9h4M17 13h3M16 17h4' stroke-dasharray='1.5 2'/>", mount: (el) => { el.innerHTML = `<h3>${PM.EDGE.title}</h3><p class="cr-lead">${esc(PM.EDGE.lead)}</p><div></div>`; Evidence.edge(el.lastElementChild); } },
    { id: "unfinished", title: "An unfinished copy", line: "Where copying stopped, and why it matters", icon: "<path d='M5 3h14v18H5z'/><path d='M8 7h8M8 10h8M8 13h4'/><path d='M8 17h8' stroke-dasharray='1.5 2'/>", mount: (el) => { el.innerHTML = `<h3>${PM.GA304.title}</h3><div></div>`; Evidence.ga304(el.lastElementChild, { loop: true }); } },
    { id: "lost", title: "A lost leaf", line: "Not extant is not omitted", icon: "<path d='M5 3h14v18H5z' stroke-dasharray='2 2.5'/><path d='M9 9l6 6M15 9l-6 6'/>", mount: (el) => Evidence.quiz(el) },
    { id: "related", title: "Related copies", line: "Why counting alone cannot decide", icon: "<circle cx='12' cy='5' r='2.5'/><circle cx='6' cy='19' r='2'/><circle cx='12' cy='19' r='2'/><circle cx='18' cy='19' r='2'/><path d='M12 7.5v9.5M11 7l-4 10M13 7l4 10'/>", mount: (el) => Evidence.copying(el) },
  ];
  function kinds(sec, num) {
    sec.innerHTML = `${sectionHead(num, "Four kinds of evidence", "Not every gap <em>is the same gap.</em>", "Presence, absence, loss and restoration are different kinds of evidence. Choose one to test it on a real case.")}
      <div class="c-kinds" role="group" aria-label="Kinds of evidence">${KINDS.map((k, i) => `<button type="button" data-kind="${k.id}" aria-pressed="${i === 0}"><svg viewBox="0 0 24 24" aria-hidden="true">${k.icon}</svg><b>${esc(k.title)}</b><small>${esc(k.line)}</small></button>`).join("")}</div>
      <div class="c-kind-stage" aria-live="polite"></div>`;
    const stage = sec.querySelector(".c-kind-stage");
    const show = (id) => { stage.className = "c-kind-stage"; stage.innerHTML = ""; const k = KINDS.find((x) => x.id === id); stage.dataset.kind = id; k.mount(stage); };
    choice(sec, "[data-kind]", (b) => show(b.dataset.kind));
    show("restore");
  }

  function editions(sec, num) {
    sec.innerHTML = `${sectionHead(num, "The editions, on a lane of their own", PM.EDITIONS.title, esc(PM.EDITIONS.lead))}<div class="c-eds"></div>`;
    Evidence.editions(sec.querySelector(".c-eds"));
  }

  function mount(wrap) {
    const add = (id) => { const s = document.createElement("section"); s.id = id; s.className = `t-sec pm-sec sec-${id}`; wrap.append(s); return s; };
    const run = (name, fn) => { try { return fn(); } catch (error) { console.error(`Direction C: ${name} failed`, error); return null; } };
    run("landing", () => landing(add("c-landing")));
    const pickSec = add("c-pick"), copySec = add("c-copies"), readSec = add("c-read");
    const drawCopies = run("copies", () => copies(copySec, "02"));
    const fillReadings = run("readings", () => readingsSec(readSec, "03"));
    const pick = (id) => { drawCopies?.(id); fillReadings?.(id); copySec.style.setProperty("--tone", `var(${CASES.find((c) => c.id === id).tone})`); };
    run("chooser", () => chooser(pickSec, "01", pick));
    pick("galatians");
    run("kinds", () => kinds(add("c-kinds"), "04"));
    run("editions", () => editions(add("c-editions"), "05"));
    run("closing", () => { add("c-close").innerHTML = closing("06"); });
    pickSec.after(copySec); copySec.after(readSec);
  }
  window.Directions.c = { mount, parts: { KINDS } };
})();
