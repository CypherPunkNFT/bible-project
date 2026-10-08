// C · Side by side. The Authors "Preached Bible" way: 01 a heat grid of the Gospels and Acts, one square per chapter
// lit by how many verses name him; 02 one moment, told by each account in its own KJV words, as quiet columns;
// 03 crystals by kind of moment, as a filter; 04 the places as a sideways row of large tiles; 05 the mission globe;
// 06 the questions as floating words.
(() => {
  const ROWS = ["MAT", "MRK", "LUK", "JHN", "ACT"];
  const codeNum = (code) => [...Array(67).keys()].find((n) => bookCode(n) === code);
  const entriesIn = (d, book, ch) => d.scripture.filter((e) => e.refs.some(([a, b = a]) => { const x = chapterOf(a), y = chapterOf(b); return x.book === book && ch >= x.ch && ch <= y.ch; }));

  function intro(d) {
    const chapters = Object.values(d.heat).reduce((n, b) => n + Object.keys(b.counts).length, 0);
    const inRows = ROWS.reduce((n, c) => n + Object.values(d.heat[c]?.counts ?? {}).reduce((a, b) => a + b, 0), 0);
    return `<section class="intro"><div><p class="kicker rule">${esc(d.title)} · the accounts side by side</p>
        <h1>Where is ${esc(d.short)} <em>in the story?</em></h1>
        <p class="lede">Every verse that names him, chapter by chapter; the same moment as each Gospel tells it; his moments by kind; and the places, near and far.</p></div>
      <dl class="figures"><div><dt>Verses that name him</dt><dd>${d.verseCount}</dd></div><div><dt>In the Gospels and Acts</dt><dd>${inRows}<small> verses</small></dd></div>
        <div><dt>Chapters that name him</dt><dd>${chapters}<small> in ${plural(Object.keys(d.heat).length, "book")}</small></dd></div><div><dt>Told more than once</dt><dd>${d.accounts.length}<small> ${d.accounts.length === 1 ? "moment" : "moments"} compared</small></dd></div></dl></section>`;
  }

  // ── 01 · The heat grid ──
  function heat(wrap, d) {
    const sec = document.createElement("section");
    sec.className = "sec";
    // The Gospels and Acts first (rows with no verse are named in a note, not drawn empty), then the letters that name him.
    const present = ROWS.filter((c) => d.heat[c]), missing = ROWS.filter((c) => !d.heat[c]).map((c) => bookName(codeNum(c)));
    const letters = Object.keys(d.heat).filter((c) => !ROWS.includes(c)).sort((a, b) => codeNum(a) - codeNum(b));
    const max = Math.max(1, ...Object.values(d.heat).flatMap((b) => Object.values(b.counts)));
    const row = (code) => {
      const b = d.heat[code], n = b.chapters;
      return `<div class="heat-row"><span class="heat-book">${esc(b.name)}</span><div class="heat-cells">${Array.from({ length: n }, (_, i) => {
        const c = b.counts[i + 1] ?? 0;
        return `<button type="button" class="cell ${c ? "on" : ""}" style="--k:${(c / max).toFixed(3)}" data-b="${code}" data-c="${i + 1}" aria-label="${esc(b.name)} ${i + 1}: ${c} verses">${c >= Math.max(3, max * .5) ? `<i>${c}</i>` : ""}</button>`;
      }).join("")}</div><span class="heat-sum">${Object.values(b.counts).reduce((x, y) => x + y, 0)}</span></div>`;
    };
    sec.innerHTML = `${secHead("01", "Chapter by chapter", "Where is he <em>named?</em>", `One square for each chapter of the books that name ${esc(d.short)}; the darker the square, the more verses in it name him. Point at a square to see what happens there; choose one to read the first verse that names him.`)}
      <div class="heat-scroll"><div class="heat">${present.length ? `<p class="heat-group">The Gospels and Acts</p>${present.map(row).join("")}` : ""}
        ${letters.length ? `<p class="heat-group">The letters</p>${letters.map(row).join("")}` : ""}</div></div>
      <div class="heat-foot"><div class="heat-key"><span>Fewer</span>${[0, .15, .35, .6, 1].map((k) => `<i style="--k:${k}" class="${k ? "on" : ""}"></i>`).join("")}<span>More verses name him</span></div>
        ${missing.length ? `<p class="heat-others">No verse in ${missing.join(", ").replace(/, ([^,]*)$/, " or $1")} names him.</p>` : ""}</div>
      <div class="heat-now" aria-live="polite"></div>`;
    wrap.append(sec);
    const now = sec.querySelector(".heat-now");
    const show = (code, ch) => {
      const b = d.heat[code], v = b?.first[ch], book = codeNum(code), ents = entriesIn(d, book, ch);
      sec.querySelectorAll(".cell").forEach((x) => x.classList.toggle("sel", x.dataset.b === code && Number(x.dataset.c) === ch));
      now.innerHTML = `<p class="kicker">${esc(b?.name ?? code)} ${ch} · ${plural(b?.counts[ch] ?? 0, "verse")} name him</p>
        ${v ? `<blockquote><p>${markNames(vtext(v))}</p><footer>${refLink([v, v])} · the first verse here that names him</footer></blockquote>` : `<p class="plain-line">No verse in this chapter names him.</p>`}
        ${ents.length ? `<p class="heat-ents">${ents.map((e) => `<button type="button" data-open="${esc(e.key)}">${esc(e.title)}</button>`).join("")}</p>` : ""}`;
    };
    sec.addEventListener("pointermove", (e) => {
      const c = e.target.closest(".cell"); if (!c) { Tip.hide(); return; }
      const code = c.dataset.b, ch = Number(c.dataset.c), b = d.heat[code], ents = entriesIn(d, codeNum(code), ch);
      Tip.show(`<b>${esc(b?.name ?? code)} ${ch}</b><small>${plural(b?.counts[ch] ?? 0, "verse")} name him</small>${ents.length ? `<small>${ents.slice(0, 3).map((x) => esc(x.title)).join(" · ")}</small>` : ""}`, e.clientX, e.clientY);
    });
    sec.addEventListener("pointerleave", () => Tip.hide());
    sec.addEventListener("click", (e) => {
      const c = e.target.closest(".cell"); if (c) { show(c.dataset.b, Number(c.dataset.c)); return; }
      const o = e.target.closest("[data-open]"); if (o) Sheet.open(entrySheet(d.byKey[o.dataset.open]), PERIOD_TONE[d.byKey[o.dataset.open].period]);
    });
    // Open on the chapter that names him most.
    let best = null;
    for (const code of ROWS) for (const [ch, n] of Object.entries(d.heat[code]?.counts ?? {})) if (!best || n > best[2]) best = [code, Number(ch), n];
    if (best) show(best[0], best[1]);
  }

  // ── 02 · One moment, several accounts ──
  function accounts(wrap, d) {
    const sec = document.createElement("section");
    sec.className = "sec";
    sec.innerHTML = `${secHead("02", "Side by side", d.accounts.length > 1 ? "One moment, <em>several accounts</em>" : "One man, <em>four lists</em>", `Each column is one book's own words in the King James Version. His names are marked; switch on "only here" to underline the words that just one account has.`)}
      <div class="acc-tools"><div class="seg acc-pick" role="group" aria-label="Moment">${d.accounts.map((a, i) => `<button type="button" data-a="${i}" aria-pressed="${i === 0}">${esc(a.title)}</button>`).join("")}</div>
        <label class="acc-only"><input type="checkbox"> Only here</label></div>
      <div class="acc-cols"></div>`;
    wrap.append(sec);
    const host = sec.querySelector(".acc-cols"), only = sec.querySelector("input");
    let cur = 0;
    const words = (t) => t.toLowerCase().replace(/[^a-z\s'’-]/g, " ").split(/\s+/).filter((w) => w.length > 3);
    function draw() {
      const a = d.accounts[cur];
      const sets = a.cols.map((c) => new Set(c.verses.flatMap((v) => words(v.text))));
      const unique = (w, i) => sets.every((s, j) => j === i || !s.has(w));
      host.style.setProperty("--cols", a.cols.length);
      host.innerHTML = a.cols.map((c, i) => `<article class="acc-col"><header><p class="kicker">${esc(c.label)}</p><p class="acc-ref">${c.spans.map((s) => refLink(s)).join(" · ")}</p></header>
        <div class="acc-text">${c.verses.map((v) => `<p><sup>${chapterOf(v.id).ch}:${chapterOf(v.id).v}</sup> ${only.checked ? markNames(v.text).replace(/(<[^>]+>|&#?\w+;)|([A-Za-z’']{4,})/g, (m, tag, w) => (tag ? tag : unique(w.toLowerCase(), i) ? `<u>${w}</u>` : w)) : markNames(v.text)}</p>`).join("")}</div>
        <footer>${plural(c.verses.length, "verse")}${c.verses.length >= 12 ? ", first 12 shown" : ""}</footer></article>`).join("");
    }
    sec.querySelector(".acc-pick").addEventListener("click", (e) => { const b = e.target.closest("[data-a]"); if (!b) return; cur = Number(b.dataset.a); sec.querySelectorAll(".acc-pick [data-a]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); });
    only.addEventListener("change", draw);
    draw();
  }

  // ── 03 · Crystals by kind ──
  function crystals(wrap, d) {
    const sec = document.createElement("section");
    sec.className = "sec";
    const kinds = Object.entries(d.kinds).map(([k, v]) => ({ k, ...v, list: d.entries.filter((e) => e.kind === k) })).filter((x) => x.list.length);
    let sel = kinds.filter((x) => x.k !== "tradition").sort((a, b) => b.list.length - a.list.length)[0]?.k ?? kinds[0].k;
    sec.innerHTML = `${secHead("03", "By kind", "What <em>kind</em> of moments?", `His moments in Scripture grouped by this site into kinds, with tradition kept apart. Choose a kind to see its moments.`)}
      <div class="cry"><div class="cry-chips" role="group" aria-label="Kinds">${kinds.map((x) => `<button type="button" class="crystal ${x.k === "tradition" ? "trad" : ""}" data-k="${x.k}" style="--tone:var(${x.tone})" aria-pressed="${x.k === sel}"><span class="cry-ico">${icon(x.icon, 22)}</span><span class="cry-label">${esc(x.label)}</span><span class="cry-n">${x.list.length}</span></button>`).join("")}</div>
        <ol class="cry-list" aria-live="polite"></ol></div>`;
    wrap.append(sec);
    const list = sec.querySelector(".cry-list");
    function draw() {
      const x = kinds.find((k) => k.k === sel);
      list.style.setProperty("--tone", `var(${x.tone})`);
      list.innerHTML = x.list.map((e) => `<li><button type="button" data-open="${esc(e.key)}"><span class="cl-p">${ROMAN[e.period]}</span><span class="cl-t">${esc(e.title)}<small>${e.type === "trad" ? esc(whenShort(e.when)) : e.refs[0] ? esc(refText(e.refs[0])) : ""}${Object.keys(e.with ?? {}).length ? ` · with ${esc(Object.keys(e.with).map((k) => d.rowByKey[k]?.name.split(" ")[0]).slice(0, 3).join(", "))}` : ""}</small></span></button></li>`).join("");
    }
    sec.addEventListener("click", (e) => {
      const c = e.target.closest("[data-k]"); if (c) { sel = c.dataset.k; sec.querySelectorAll(".crystal").forEach((b) => b.setAttribute("aria-pressed", String(b === c))); draw(); return; }
      const o = e.target.closest("[data-open]"); if (o) Sheet.open(entrySheet(d.byKey[o.dataset.open]), PERIOD_TONE[d.byKey[o.dataset.open].period]);
    });
    draw();
  }

  DIRECTIONS.c = {
    mount(main, d) {
      const wrap = document.createElement("div");
      wrap.className = "wrap";
      wrap.innerHTML = topline() + intro(d);
      main.append(wrap);
      heat(wrap, d); accounts(wrap, d); crystals(wrap, d);
      const placesSec = document.createElement("section");
      placesSec.className = "sec";
      placesSec.innerHTML = `${secHead("04", "Near and far", "Where was <em>he?</em>", `${plural(d.places.length, "place")} named in his story, with what happened there and how far each lies from Jerusalem. Tradition's places are dashed. Choose one to find it on the globe below.`)}<div class="p-host"></div>`;
      wrap.append(placesSec);
      const mission = Mission.mount(main, d, { num: "05", title: "The mission, <em>on the globe</em>", sub: `Scripture's journeys are solid; where Scripture stops, tradition's routes are dashed and labelled with who said it and when. Drag the earth to turn it, scroll to come closer.` });
      Places.mount(placesSec.querySelector(".p-host"), d, (pl) => { if (!pl.ll) return; mission.stage.scrollIntoView({ behavior: "smooth", block: "center" }); mission.flyTo(pl); });
      const tail = document.createElement("div");
      tail.className = "wrap";
      tail.innerHTML = `<section class="sec">${secHead("06", "Open questions", "What readers still <em>ask</em>", "The questions this page cannot settle, with the answers given and who gives them. Choose a question.")}<div class="q-host"></div></section>`;
      main.append(tail);
      const stopQ = Questions.mount(tail.querySelector(".q-host"), d);
      return () => { stopQ(); mission.cleanup(); };
    },
  };
})();
