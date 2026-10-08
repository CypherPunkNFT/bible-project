// A · The shelf, front page. One stack of books per age, switched like the A · B · C · D mock-ups (a floating bar,
// or the left and right keys) and kept in the address (#a/children). Each title is a book lying flat, spine to the
// reader, its title reading left to right; the one ready workbook is a solid, coloured spine and planned titles are
// outlines. Beside the stack, a panel shows the book pointed at (or the one clicked). Kind chips light one kind.
(() => {
  const { esc, icon, plural } = Frame;
  const { AUDIENCES, KINDS, TRACKS, SERIES } = LEARN;
  const FIRST_AGE = "adults";
  // Planned books: [thickness px, width % of the stack] by kind. Real books take their thickness from their pages.
  const SHAPE = { story: [24, 96], activity: [30, 88], cards: [31, 64], lesson: [31, 84], workbook: [34, 82], plan: [28, 74], devotional: [31, 78], maps: [23, 94], guide: [31, 78] };
  const jitter = (id, salt, span) => { let h = 2166136261 ^ salt; for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000 * 2 * span - span; };

  function bookShape(it) {
    const [base, width] = SHAPE[it.kind];
    let thick = base;
    if (it.status === "ready") thick = Math.round(17 + it.pages * 0.5);
    else if (it.sessions) thick = Math.min(37, Math.round(22 + it.sessions * 1.15));
    // Never narrower than its title needs (about 520px of stack at full width).
    const need = (it.title.length * 7.4 + LEARN.K[it.kind].name.length * 6.4 + 150) / 5.2;
    const dx = Math.round(jitter(it.id, 3, 12));
    return { thick: Math.round(thick + jitter(it.id, 1, 2)), width: Math.round(Math.min(100 - Math.abs(dx) / 2.2, Math.max(need, width + jitter(it.id, 2, 4)))), dx };
  }

  function book(it) {
    const { thick, width, dx } = bookShape(it), ready = it.status === "ready";
    return `<button type="button" class="bk k-${it.kind} ${it.status}" data-id="${it.id}" data-kind="${it.kind}" aria-pressed="false"
      style="--t:${thick};--w:${width}%;--dx:${dx};--tone:var(${LEARN.A[it.audience].tone})" aria-label="${esc(it.title)}, ${LEARN.K[it.kind].name}, ${ready ? "ready" : "planned"}">
      <span class="bk-g">${ART.kind(it.kind, 15, 1.3)}</span><span class="bk-t">${esc(it.title)}</span><span class="bk-k">${LEARN.K[it.kind].name}</span>
      <span class="bk-s">${ready ? "Ready" : "Planned"}</span></button>`;
  }

  // The stack, top to bottom: grouped by subject (in the site's track order), the ready title first in its group.
  const groupsFor = (aud) => {
    const items = LEARN.forAudience(aud.id);
    return TRACKS.map((t) => [t, items.filter((it) => it.track === t.id).sort((p, q) => (q.status === "ready") - (p.status === "ready"))]).filter(([, l]) => l.length);
  };
  const stack = (aud) => `<div class="st-stack">${groupsFor(aud).map(([t, list]) =>
    `<div class="st-group"><div class="st-label" title="${t.name}"><span>${t.short}</span></div><div class="st-books">${list.map(book).join("")}</div></div>`).join("")}
    <div class="st-group st-base-row"><span></span><div class="st-base"></div></div></div>`;

  function panel(it) {
    const a = LEARN.A[it.audience], k = LEARN.K[it.kind], t = LEARN.T[it.track], ready = it.status === "ready";
    const series = it.series.map(([s, n]) => `${LEARN.S[s].name} <span class="muted">· ${n} of ${LEARN.inSeries(s).length}</span>`).join("<br>") || '<span class="muted">None</span>';
    const sessions = it.sessions ? `${plural(it.sessions, "session")}${it.minutes ? `, about ${it.minutes} minutes each` : ""}${ready ? ` · ${it.pages} pages` : " (planned)"}` : '<span class="muted">Set when it is written</span>';
    const guide = it.guide ? "Yes" : ready ? "Not yet <span class=\"muted\">· the “How to use” page covers groups</span>" : "No";
    const rows = [["For", `${a.name}${a.setting ? "" : ` · ${a.age}`} <span class="muted">· ${a.how.toLowerCase()}</span>`], ["Kind", k.name], ["Subject", t.name], ["Series", series], ["Sessions", sessions], ["Leader guide", guide],
      [ready ? "Written from" : "Will be written from", `<ul class="pn-from">${it.builtFrom.map((b) => `<li><a href="${b.path}" title="${esc(b.path)}">${esc(b.title)}</a></li>`).join("")}</ul>`]];
    return `<div class="pn-top"><div class="pn-cover">${ART.cover(it)}</div>
        <div><p class="kicker" style="--tone: var(${a.tone})">${k.name} · ${t.short}</p><h3>${esc(it.title)}</h3><p class="pn-sub">${esc(it.sub)}</p>${Frame.status(it)}</div></div>
      <dl class="pn-facts">${rows.map(([dt, dd]) => `<dt>${dt}</dt><dd>${dd}</dd>`).join("")}</dl>
      ${ready ? `<div class="pn-pages">${[[3, "How to use it"], [4, "The three forties"], [5, "Session 1"], [7, "Questions"]].map(([n, c]) => `<button type="button" data-page="${n}"><img src="${Frame.page(n)}" alt="Page ${n}: ${c}" loading="lazy"><small>p. ${n} · ${c}</small></button>`).join("")}</div>
        ${Frame.downloads(it)}<p class="pn-note">${esc(it.review)}</p>`
        : `<p class="pn-note">Not written yet, so there is nothing to download. It becomes ready only after its pages are written from the sources above and every verse is checked.</p>`}
      <a class="pn-open" href="#a/item/${it.id}">Open the title ${icon("arrowRight", 14)}</a>`;
  }

  function view(aud) {
    const items = LEARN.forAudience(aud.id), ready = items.filter((i) => i.status === "ready").length, subjects = groupsFor(aud).length;
    return `<div class="st-view" data-aud="${aud.id}" style="--tone: var(${aud.tone})">
      <div class="st-left"><header class="st-head"><div class="st-art">${ART.audience(aud.art)}</div>
          <div><p class="kicker">${aud.setting ? "Setting" : `Ages ${aud.age}`} · ${aud.how}</p><h3>${aud.name}</h3><p class="st-line">${aud.line}</p>
          <p class="st-meta">${plural(items.length, "title")} · ${ready ? `${ready} ready` : "none ready yet"} · ${plural(subjects, "subject")} · <a class="textlink" href="#a/age/${aud.id}">Everything for ${aud.name.toLowerCase()}</a></p></div></header>
        ${stack(aud)}</div>
      <aside class="st-panel" aria-live="polite"></aside><i class="st-lead" aria-hidden="true"></i></div>`;
  }

  // Kept for direction B, which borrows A's one-line description of a title.
  const hintFor = (it) => `<b>${esc(it.title)}</b> · ${esc(it.sub)}<br>${Frame.facts(it)} · ${LEARN.T[it.track].name} · ${Frame.status(it)} <span class="muted">${it.status === "ready" ? "Open it to see the pages and download." : `Built from: ${it.builtFrom.map((b) => esc(b.title)).join("; ")}`}</span>`;

  function seriesBlock(sid, hereId) {
    const s = LEARN.S[sid], list = LEARN.inSeries(sid);
    return `<div class="sh-path"><div><span class="type">${s.type}</span><h3>${s.name}</h3><p>${s.line}</p></div>
      <div class="sh-nodes">${list.map((it) => `<a class="sh-node ${it.status}${it.id === hereId ? " here" : ""}" href="#a/item/${it.id}"><i></i><b>${esc(it.title)}</b><small>${LEARN.A[it.audience].name} · ${LEARN.K[it.kind].name}${it.status === "planned" ? " · planned" : " · ready"}</small></a>`).join("")}</div></div>`;
  }

  const ageFromHash = () => { const id = location.hash.replace(/^#/, "").split("/")[1]; return LEARN.A[id] ? id : FIRST_AGE; };

  function front(wrap) {
    const age = ageFromHash();
    wrap.innerHTML = `${Frame.crumbs("Direction A · The shelf")}
      <section class="sh-intro">
        <div><p class="kicker rule">Resources · 01 · Learning materials</p><h1 class="plain-title">Something for<br><em>every age.</em></h1></div>
        <div><p class="lede">Workbooks, lessons, activity pages and reading plans, written from the site's own reviewed pages and checked word for word against the King James text. One stack for each age, and two for the people who use them together.</p>
          <dl class="figures"><div><dt>Ready to print</dt><dd>${LEARN.ready.length}</dd></div><div><dt>Planned</dt><dd>${LEARN.planned.length}</dd></div><div><dt>Ages + settings</dt><dd>5 + 2</dd></div><div><dt>Subjects</dt><dd>${TRACKS.length}</dd></div></dl></div>
      </section>
      <section class="sec st-sec" style="margin-top:1.6rem"><div class="sec-head"><span class="sec-num">01</span><div><h2>A stack for each reader, <em>one at a time</em></h2><p>Choose an age in the bar below or with the arrow keys. The solid book is ready to download; the outlines are planned. Point at a book to read about it, click to keep it open.</p></div></div>
        <div class="sh-kinds" role="group" aria-label="Light one kind">${KINDS.map((k) => `<button type="button" class="sh-kind" data-kind="${k.id}" aria-pressed="false">${ART.kind(k.id, 20, 1.25)}<span><b>${k.plural}</b><small data-count></small></span></button>`).join("")}</div>
        <div class="st-stage">${view(LEARN.A[age])}</div>
        <nav class="ag-switch" aria-label="Choose an age">${AUDIENCES.map((a) => `<a href="#a/${a.id}" data-age="${a.id}" style="--tone: var(${a.tone})" title="${a.name}${a.setting ? "" : ` · ${a.age}`}"${a.id === age ? ' aria-current="page"' : ""}>${ART.audience(a.art, "ag-ico")}<span>${a.name}</span></a>`).join("")}</nav></section>
      <section class="sec"><div class="sec-head"><span class="sec-num">02</span><div><h2>Series that <em>cross the ages</em></h2><p>Some titles belong together: one subject told at every age, or a path to follow in order. The filled point is the one ready today.</p></div></div>
        <div class="sh-series">${SERIES.map((s) => seriesBlock(s.id)).join("")}</div></section>
      <section class="sec"><div class="sec-head"><span class="sec-num">03</span><div><h2>How a title <em>reaches the shelf</em></h2><p>The same four steps made the Moses workbook. A planned title becomes ready only after all four.</p></div></div>
        <ol class="sh-steps">${[["Choose the pages", "Only the site's reviewed pages: a person's story, a study, a Topics category."], ["Write from them", "Summaries in plain words, questions whose answers are in the verses they name."], ["Check every word", "Every reference must exist and every quotation must match the King James text, or nothing is built."], ["Print and shelve", "A4 and US Letter with the same page numbers, a cover, and a row in the catalogue."]].map(([b, p], i) => `<li><span>0${i + 1}</span><b>${b}</b><p>${p}</p></li>`).join("")}</ol></section>`;
    DIRS.a.wireStack(wrap, age);
  }

  DIRS.a = { name: "The shelf", defaultAge: "children", front, seriesBlock, hintFor, view, panel };
})();
