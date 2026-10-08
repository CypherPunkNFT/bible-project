// A · The shelf: one audience's shelf as a cabinet, and one item's page (the real Moses workbook, or a planned title).
(() => {
  const { esc, icon, plural } = Frame;
  const A = DIRS.a;

  function ageStrip(current, href) {
    return `<nav class="sh-ages" aria-label="Other shelves">${LEARN.AUDIENCES.map((a) => `<a href="${href(a.id)}" style="--tone: var(${a.tone})"${a.id === current ? ' aria-current="page"' : ""}>${ART.audience(a.art)}${a.name}</a>`).join("")}</nav>`;
  }
  // The 52 lessons of "A year through the Bible" as one line of ticks, quarters as arcs above.
  function yearStrip() {
    const qs = LEARN.inSeries("year").filter((it) => it.kind === "lesson");
    const W = 1040, step = W / 52;
    const arcs = qs.map((q, i) => { const x1 = i * 13 * step + 4, x2 = (i + 1) * 13 * step - 4, mx = (x1 + x2) / 2;
      return `<g class="yr-q" data-id="${q.id}"><path d="M${x1} 70 Q${mx} ${8} ${x2} 70" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/>
        <text x="${mx}" y="36" text-anchor="middle" font-family="var(--serif)" font-size="17" fill="currentColor">${esc(q.title)}</text><text x="${mx}" y="54" text-anchor="middle" font-size="11" fill="var(--muted)">Lessons ${i * 13 + 1}–${(i + 1) * 13}</text></g>`; }).join("");
    const ticks = Array.from({ length: 52 }, (_, i) => `<path d="M${i * step + step / 2} 76 v${i % 13 === 0 ? 14 : 8}" stroke="currentColor" opacity="${i % 13 === 0 ? .8 : .4}"/>`).join("");
    return `<div style="overflow-x:auto"><svg viewBox="0 0 ${W} 100" style="min-width:640px;width:100%;color:var(--ink)" aria-label="Fifty-two lessons in four quarters">${arcs}<path d="M0 76 H${W}" stroke="var(--ink)"/>${ticks}</svg></div>
      <p class="hint-line" data-year>Each quarter follows the Topics eras in order. <span class="muted">Point at a quarter to see what it is built from. All four are planned.</span></p>`;
  }

  function age(wrap, id) {
    const aud = LEARN.A[id], items = LEARN.forAudience(id);
    const sessions = items.reduce((n, it) => n + (it.sessions ?? 0), 0);
    const seriesHere = LEARN.SERIES.filter((s) => LEARN.inSeries(s.id).some((it) => items.includes(it)));
    let no = 0;
    const groups = LEARN.TRACKS.map((t) => [t, items.filter((it) => it.track === t.id)]).filter(([, l]) => l.length);
    wrap.innerHTML = `${Frame.crumbs("Direction A · The shelf")}<a class="sh-back" href="#a/${id}">${icon("arrowLeft", 14)}Back to the stacks</a>
      <section class="sh-age-hero" style="--tone: var(${aud.tone})"><div class="big-art">${ART.audience(aud.art)}</div>
        <div><p class="kicker rule">${aud.setting ? `The ${aud.name.toLowerCase()} shelf` : `The shelf for ${aud.name.toLowerCase()}`}</p><h1 class="plain-title">${aud.name}<br><em>${aud.setting ? aud.how.split(",")[0] : aud.age.replace("–", " to ")}.</em></h1>
          <p class="lede" style="margin-top:1rem">${aud.line} ${aud.how}.</p>
          <dl class="figures"><div><dt>Titles</dt><dd>${items.length}</dd></div><div><dt>Ready</dt><dd>${items.filter((i) => i.status === "ready").length}</dd></div><div><dt>Sessions planned</dt><dd>${sessions || "—"}</dd></div><div><dt>Subjects</dt><dd>${groups.length}</dd></div></dl></div></section>
      ${ageStrip(id, (x) => `#a/age/${x}`)}
      <section class="sec"><div class="sec-head"><span class="sec-num">01</span><div><h2>On this shelf, <em>by subject</em></h2><p>Each case is one title, drawn as its cover will look. Outlines are planned; each names the site pages it will be written from.</p></div></div>
        <div class="cabinet">${groups.flatMap(([, list]) => list).map((it) => `<a class="cab" href="#a/item/${it.id}" style="--tone: var(${LEARN.A[it.audience].tone})"><div class="pic">${ART.cover(it)}</div>
          <div class="meta"><span class="no">N° ${String(++no).padStart(2, "0")} · ${LEARN.T[it.track].short}</span><h3>${esc(it.title)}</h3><p>${LEARN.K[it.kind].name} · ${esc(it.sub)}</p>${Frame.status(it)}</div></a>`).join("")}</div></section>
      ${id === "children" ? `<section class="sec"><div class="sec-head"><span class="sec-num">02</span><div><h2>A year <em>through the Bible</em></h2><p>The children's path: fifty-two lessons, thirteen a quarter, each with a leader guide.</p></div></div>${yearStrip()}</section>` : ""}
      ${seriesHere.length ? `<section class="sec"><div class="sec-head"><span class="sec-num">${id === "children" ? "03" : "02"}</span><div><h2>Series <em>on this shelf</em></h2><p>Where a title here belongs to a series, the rest of the series is on other shelves.</p></div></div><div class="sh-series">${seriesHere.map((s) => A.seriesBlock(s.id)).join("")}</div></section>` : ""}`;
    const yh = wrap.querySelector("[data-year]");
    if (yh) { const base = yh.innerHTML; wrap.querySelectorAll(".yr-q").forEach((g) => { g.addEventListener("pointerenter", () => { const it = LEARN.I[g.dataset.id]; yh.innerHTML = `<b>${esc(it.title)}</b> · ${esc(it.sub)} · ${Frame.status(it)} <span class="muted">Built from ${it.builtFrom.map((b) => esc(b.title)).join("; ")}.</span>`; }); g.addEventListener("pointerleave", () => { yh.innerHTML = base; }); g.style.cursor = "pointer"; g.addEventListener("click", () => { location.hash = `#a/item/${g.dataset.id}`; }); }); }
  }

  const SAMPLES = [[2, "Contents"], [3, "How to use it"], [4, "The three forties"], [5, "Session 1 opens"], [7, "Questions to write in"], [41, "Sources"]];
  function viewer(start) {
    let n = start;
    const box = document.createElement("div");
    box.className = "viewer";
    const draw = () => { box.innerHTML = `<figure><img src="${Frame.page(n)}" alt="Page ${n} of the workbook"><figcaption><button type="button" data-v="-1" aria-label="Previous page">${icon("chevL", 16)}</button>Page ${n} of 42<button type="button" data-v="1" aria-label="Next page">${icon("chevR", 16)}</button><button type="button" data-v="x" aria-label="Close">${icon("x", 16)}</button></figcaption></figure>`; };
    const close = () => { box.remove(); removeEventListener("keydown", key); };
    const key = (e) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") { n = Math.min(42, n + 1); draw(); } if (e.key === "ArrowLeft") { n = Math.max(1, n - 1); draw(); } };
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) { if (e.target === box) close(); return; } if (b.dataset.v === "x") close(); else { n = Math.max(1, Math.min(42, n + Number(b.dataset.v))); draw(); } });
    addEventListener("keydown", key);
    draw();
    document.body.append(box);
  }

  function item(wrap, id) {
    const it = LEARN.I[id], aud = LEARN.A[it.audience], ready = it.status === "ready";
    const [name, rest] = it.title.includes(":") ? it.title.split(/:\s*/) : [it.title, ""];
    wrap.innerHTML = `${Frame.crumbs("Direction A · The shelf")}<a class="sh-back" href="#a/age/${aud.id}">${icon("arrowLeft", 14)}The ${aud.name.toLowerCase()} shelf</a>
      <section class="sh-item" style="--tone: var(${aud.tone})">
        <div class="sh-stand">${ready ? `<div class="fan f1"><img src="${Frame.page(4)}" alt=""></div><div class="fan f2"><img src="${Frame.page(5)}" alt=""></div>` : ""}<div class="front">${ART.cover(it)}</div></div>
        <div><p class="kicker rule">${LEARN.K[it.kind].name} · ${aud.name}</p><h1>${esc(name)}${rest ? `<em>${esc(rest)}</em>` : ""}</h1>
          <p class="sum">${ready ? esc(MOSES.summary) : `${esc(it.sub)}. This title is planned: it has a place on the shelf and the pages it will be written from, but nothing has been written yet.`}</p>
          ${Frame.downloads(it)}${ready ? "" : '<div style="height:1.4rem"></div>'}${Frame.record(it)}</div></section>
      ${ready ? `<section class="sec"><div class="sec-head"><span class="sec-num">01</span><div><h2>Inside <em>the workbook</em></h2><p>Real pages from the A4 edition. Open one to turn through all forty-two.</p></div></div>
        <div class="sh-pages">${SAMPLES.map(([n, c]) => `<button type="button" data-page="${n}"><img src="${Frame.page(n)}" alt="Page ${n}: ${c}" loading="lazy"><small><b>p. ${n}</b> · ${c}</small></button>`).join("")}</div></section>
      <section class="sec"><div class="sec-head"><span class="sec-num">02</span><div><h2>Eight sessions, <em>three forties</em></h2><p>Each session opens with its own line drawing. Choose one to read its summary, a key verse and its questions.</p></div></div>
        <div class="sess-grid">${MOSES.sessions.map((s) => `<button type="button" class="sess" data-s="${s.n}" aria-pressed="false">${ART.moses(s.art)}<span class="meta"><span class="no">Session ${s.n} · ${MOSES.parts[s.part - 1].place}</span><h3>${esc(s.title)}</h3><p>${esc(s.read)} · p. ${s.page}</p></span></button>`).join("")}</div><div data-open></div></section>` :
      `<section class="sec"><div class="sec-head"><span class="sec-num">01</span><div><h2>What it will be <em>written from</em></h2><p>Every planned title names its sources before a word is written, so the shelf shows only what the site can stand behind.</p></div></div>
        <ul class="sh-steps" style="grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))">${it.builtFrom.map((b, i) => `<li><span>0${i + 1}</span><b><a class="textlink" href="${b.path}">${esc(b.title)}</a></b><p>${esc(b.path)}</p></li>`).join("")}</ul></section>`}
      ${it.series.length ? `<section class="sec"><div class="sec-head"><span class="sec-num">${ready ? "03" : "02"}</span><div><h2>In <em>${it.series.length > 1 ? "two series" : "a series"}</em></h2></div></div><div class="sh-series">${it.series.map(([s]) => A.seriesBlock(s, it.id)).join("")}</div></section>` : ""}`;
    wrap.querySelectorAll("[data-page]").forEach((b) => b.addEventListener("click", () => viewer(Number(b.dataset.page))));
    const open = wrap.querySelector("[data-open]");
    wrap.querySelectorAll(".sess").forEach((b) => b.addEventListener("click", () => {
      const s = MOSES.sessions[Number(b.dataset.s) - 1];
      wrap.querySelectorAll(".sess").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const k = (kind) => s.questions.filter((q) => q.kind === kind).length;
      open.innerHTML = `<div class="sess-open"><div><span class="kicker">Session ${s.n} · ${MOSES.parts[s.part - 1].label} · ${MOSES.parts[s.part - 1].place}</span><h3>${esc(s.title)}</h3><p class="brief">${esc(s.brief)} <span style="font-size:.72rem">(${esc(s.briefRefs)})</span></p>
        <blockquote>${esc(s.key[0].text)}<small>${esc(s.key[0].ref)} · KJV</small></blockquote><p class="qk"><span><b>${k("observe")}</b>observe</span><span><b>${k("interpret")}</b>interpret</span><span><b>${k("reflect")}</b>reflect</span></p></div>
        <button type="button" data-page="${s.page}"><img src="${Frame.page(s.page)}" alt="The page where session ${s.n} opens"></button></div>`;
      open.querySelector("[data-page]").addEventListener("click", () => viewer(s.page));
    }));
  }

  Object.assign(DIRS.a, { age, item, viewer });
})();
