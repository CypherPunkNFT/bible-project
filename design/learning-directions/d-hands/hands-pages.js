// D · In your hands: one reader's titles fanned on the table (choose one to hold it), and the item page as a full
// reader (the open book, the contents beside it, and every page as a rail beneath).
(() => {
  const { esc, icon, plural } = Frame;
  const D = DIRS.d;

  function age(wrap, id) {
    const aud = LEARN.A[id], items = LEARN.forAudience(id);
    const n = items.length, spreadDeg = Math.min(64, n * 9);
    wrap.innerHTML = `${Frame.crumbs("Direction D · In your hands")}
      <section class="ih-age" style="--tone: var(${aud.tone})"><div><p class="kicker rule">On the table · ${aud.name}</p><h1>${aud.name}: <em>${aud.setting ? aud.how.split(",")[0].toLowerCase() : `ages ${aud.age}`}</em></h1>
          <p class="lede" style="margin-top:.9rem">${aud.line} ${plural(n, "title")} on the table${items.some((x) => x.status === "ready") ? "" : ", all planned"}. Choose a cover to hold it.</p>
          <nav class="ih-pick" aria-label="Readers">${LEARN.AUDIENCES.map((a) => `<a href="#d/age/${a.id}"${a.id === id ? ' aria-current="page"' : ""}>${a.name}</a>`).join("")}</nav></div>
        <div class="fan">${items.map((x, i) => { const deg = n === 1 ? 0 : -spreadDeg / 2 + (spreadDeg / (n - 1)) * i;
          return `<button type="button" data-id="${x.id}" style="--tone: var(${LEARN.A[x.audience].tone});transform: translateX(-50%) rotate(${deg}deg);z-index:${i}" data-deg="${deg}" aria-label="${esc(x.title)}">${ART.cover(x)}</button>`; }).join("")}</div></section>
      <section class="sec" data-heldsec></section>`;
    const sec = wrap.querySelector("[data-heldsec]");
    const hold = (x) => {
      wrap.querySelectorAll(".fan button").forEach((b) => { const on = b.dataset.id === x.id, deg = Number(b.dataset.deg);
        b.classList.toggle("on", on); b.style.transform = `translateX(-50%) rotate(${on ? 0 : deg * 1.15}deg) translateY(${on ? "-2.2rem" : "0"})`; });
      const fromWorkbook = x.builtFrom.some((b) => b.path === "/resources/learning");
      sec.innerHTML = `<div class="sec-head"><span class="sec-num">01</span><div><h2>${esc(x.title)}</h2><p>${esc(x.sub)}.</p></div></div>
        ${x.status === "ready" ? `<p><a class="btn solid" href="#d/item/${x.id}">Open it ${icon("arrowRight", 14)}</a></p>` : ""}
        ${fromWorkbook ? `<p class="plain-line muted" style="margin-bottom:.6rem">It will be drawn from the written workbook. These are the workbook's real session pages it would follow; the title itself is not written yet.</p>
          <div class="ih-from">${MOSES.sessions.map((s) => `<figure><img src="${Frame.page(s.page)}" alt="Workbook page ${s.page}" loading="lazy"><figcaption>Workbook p. ${s.page} · ${esc(s.title)}</figcaption></figure>`).join("")}</div>` : ""}
        ${Frame.record(x)}`;
    };
    wrap.querySelectorAll(".fan button").forEach((b) => b.addEventListener("click", () => hold(LEARN.I[b.dataset.id])));
    hold(items.find((x) => x.status === "ready") ?? items.find((x) => x.builtFrom.some((b) => b.path === "/resources/learning")) ?? items[0]);
  }

  function item(wrap, id) {
    const it = LEARN.I[id];
    if (it.status !== "ready") {
      wrap.innerHTML = `${Frame.crumbs("Direction D · In your hands")}<div data-held></div><section class="sec"><div class="sec-head"><span class="sec-num">01</span><div><h2>The <em>record</em></h2></div></div>${Frame.record(it)}</section>`;
      const h = wrap.querySelector("[data-held]");
      h.innerHTML = D.held(it);
      h.querySelector("[data-back]").addEventListener("click", () => { location.hash = "#d/item/moses-three-forties"; });
      return;
    }
    const groups = [["Front", [1, 2, 3, 4]], ...MOSES.sessions.map((s) => [`${s.n} · ${s.title}`, Array.from({ length: s.pages[1] - s.pages[0] + 1 }, (_, k) => s.pages[0] + k)]), ["Sources", [41, 42]]];
    wrap.innerHTML = `${Frame.crumbs("Direction D · In your hands")}
      <section class="ih-desk"><div class="ih-side"><p class="kicker rule">Workbook · adults · ready</p><h1>Moses<em>three forties</em></h1>
          <p class="sum">${esc(MOSES.tagline)}. ${MOSES.sessions.length} sessions, 42 pages, the same page numbers on A4 and US Letter.</p>${Frame.downloads(it)}${D.toc()}</div>
        <div data-hands></div></section>
      <section class="sec" style="margin-top:1.6rem"><div class="sec-head"><span class="sec-num">01</span><div><h2>All forty-two <em>pages</em></h2><p>Choose any page to open the book there.</p></div></div>
        <div class="rail">${groups.map(([label, ps]) => `<div class="rail-group"><h4>${esc(label)}</h4><div>${ps.map((p) => `<button type="button" data-open="${p}" aria-label="Page ${p}"><img src="${Frame.page(p)}" alt="" loading="lazy"></button>`).join("")}</div></div>`).join("")}</div></section>
      <section class="sec"><div class="sec-head"><span class="sec-num">02</span><div><h2>The <em>record</em></h2></div></div>${Frame.record(it)}</section>`;
    const hands = wrap.querySelector("[data-hands]");
    const book = D.Book(hands, { start: 1, onTurn: (pages) => { D.markToc(wrap, pages); wrap.querySelectorAll(".rail button").forEach((b) => b.classList.toggle("on", pages.includes(Number(b.dataset.open)))); } });
    wrap.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => { book.open(Number(b.dataset.open)); if (b.closest(".rail")) hands.scrollIntoView({ behavior: "smooth", block: "center" }); }));
  }

  Object.assign(DIRS.d, { age, item });
})();
