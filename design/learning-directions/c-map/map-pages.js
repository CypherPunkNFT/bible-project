// C · The curriculum map: one reader as a scope and sequence (what comes before, this reader, what comes after), and
// one item as a sequence (the three forties in years, the sessions, all 42 pages, and every question by kind).
(() => {
  const { esc, plural } = Frame;
  const { AUDIENCES, TRACKS } = LEARN;

  function age(wrap, id) {
    const aud = LEARN.A[id], i = AUDIENCES.findIndex((a) => a.id === id);
    const cols = [AUDIENCES[i - 1], aud, AUDIENCES[i + 1]];
    const rowsFor = TRACKS.filter((t) => cols.some((a) => a && LEARN.forAudience(a.id).some((it) => it.track === t.id)));
    const own = LEARN.forAudience(id);
    const word = (it) => `<a class="w ${it.status}" href="#c/item/${it.id}" data-id="${it.id}">${ART.kind(it.kind, 15)}${esc(it.title)}</a>`;
    wrap.innerHTML = `${Frame.crumbs("Direction C · The curriculum map")}
      <section class="cm-age-hero" style="--tone: var(${aud.tone})"><div><p class="kicker rule">Scope and sequence · ${aud.name}</p><h1>${aud.name}: <em>what comes before, and after</em></h1>
        <p class="lede" style="margin-top:.9rem">${aud.line} Each subject is read across three columns: the reader before, this one, and the next, so a leader can see where a series begins and where it leads.</p></div>
        <dl class="figures"><div><dt>Titles here</dt><dd>${own.length}</dd></div><div><dt>Subjects here</dt><dd>${new Set(own.map((x) => x.track)).size}<small> of ${TRACKS.length}</small></dd></div><div><dt>Sessions planned</dt><dd>${own.reduce((n, x) => n + (x.sessions ?? 0), 0) || "—"}</dd></div></dl></section>
      <nav class="cm-pick" aria-label="Readers">${AUDIENCES.map((a) => `<a href="#c/age/${a.id}"${a.id === id ? ' aria-current="page"' : ""}>${a.name}</a>`).join("")}</nav>
      <section class="sec" style="margin-top:1.6rem"><div class="sec-head"><span class="sec-num">01</span><div><h2>Subject by subject, <em>across three readers</em></h2><p>Dashed lines join titles of the same series. Blank means the plan has nothing there yet.</p></div></div>
        <div class="bridge-scroll"><div class="bridge" style="--tone: var(${aud.tone})"><span class="bh"></span>${cols.map((a, k) => `<span class="bh${k === 1 ? " focus" : ""}">${k === 0 ? "Before" : k === 1 ? "This reader" : "After"}<b>${a ? a.name : "—"}</b></span>`).join("")}
          ${rowsFor.map((t) => `<span class="bt">${ART.track(t.id, 17)}${t.name}</span>${cols.map((a, k) => { const list = a ? LEARN.forAudience(a.id).filter((it) => it.track === t.id && it.audience === a.id) : [];
            return `<div class="bc${k === 1 ? " focus" : ""}">${list.length ? list.map(word).join("") : `<span class="none">${a ? "Nothing yet" : ""}</span>`}</div>`; }).join("")}`).join("")}
          <svg aria-hidden="true"></svg></div></div></section>`;
    const bridge = wrap.querySelector(".bridge"), svg = bridge.querySelector(":scope > svg");
    const draw = () => {
      const box = bridge.getBoundingClientRect(), paths = [];
      for (const s of LEARN.SERIES) {
        const els = LEARN.inSeries(s.id).map((it) => bridge.querySelector(`.w[data-id="${it.id}"]`)).filter(Boolean);
        for (let k = 1; k < els.length; k++) {
          const a = els[k - 1].getBoundingClientRect(), b = els[k].getBoundingClientRect();
          if (Math.abs(a.left - b.left) < 20) continue;
          const [x1, y1, x2, y2] = [a.right - box.left + 4, a.top - box.top + a.height / 2, b.left - box.left - 4, b.top - box.top + b.height / 2];
          paths.push(`<path d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}"/>`);
        }
      }
      svg.innerHTML = paths.join("");
    };
    requestAnimationFrame(draw); document.fonts?.ready.then(draw); addEventListener("resize", draw);
  }

  const TONES = ["--history", "--poetry", "--epistles"], KIND_TONE = { observe: "--prophets", interpret: "--gospels", reflect: "--acts" };
  const sectionOf = (n) => { if (n <= 4) return { label: n === 1 ? "Cover" : MOSES.front[n - 1][1], tone: "--muted" }; if (n >= 41) return { label: "Sources", tone: "--muted" };
    const s = MOSES.sessions.find((x) => n >= x.pages[0] && n <= x.pages[1]); return { label: `Session ${s.n} · ${s.title}`, tone: TONES[s.part - 1], s }; };

  function timeline() {
    const W = 1000, x = (y) => 20 + (y / 120) * (W - 40);
    const span = (s) => s.n === 1 ? [0, 40] : s.n === 2 ? [40, 80] : [80 + ((s.n - 3) * 40) / 6, 80 + ((s.n - 2) * 40) / 6];
    const blocks = MOSES.sessions.map((s) => { const [a, b] = span(s); return `<g class="blk" data-s="${s.n}" style="--tone: var(${TONES[s.part - 1]})"><rect x="${x(a) + 2}" y="58" width="${x(b) - x(a) - 4}" height="34" rx="4"/><text x="${(x(a) + x(b)) / 2}" y="80" text-anchor="middle">${s.n === 1 || s.n === 2 ? `${s.n} · ${esc(s.title)}` : s.n}</text></g>`; }).join("");
    const parts = MOSES.parts.map((p, i) => `<text class="part" x="${(x(i * 40) + x(i * 40 + 40)) / 2}" y="30" text-anchor="middle">${p.place}</text>`).join("");
    const ticks = [0, 40, 80, 120].map((y) => `<g class="tick"><path class="axis" d="M${x(y)} 40 V100"/><text x="${x(y)}" y="118" text-anchor="middle">${y}</text></g>`).join("");
    return `<svg viewBox="0 0 ${W} 126" role="img" aria-label="The sessions placed on Moses' hundred and twenty years">${parts}<path class="axis" d="M20 100 H${W - 20}"/>${ticks}${blocks}</svg>`;
  }

  function item(wrap, id) {
    const it = LEARN.I[id];
    if (it.status !== "ready") {
      const a = LEARN.A[it.audience];
      wrap.innerHTML = `${Frame.crumbs("Direction C · The curriculum map")}<section class="cm-item"><div><p class="kicker rule">${LEARN.T[it.track].name} × ${a.name} · planned</p><h1>${esc(it.title)}</h1><p class="lede" style="margin-top:.8rem">${esc(it.sub)}. Its cell on the map is reserved; nothing is written yet, so there are no pages to show.</p></div>${ART.cover(it)}</section>
        <section class="sec"><div class="sec-head"><span class="sec-num">01</span><div><h2>The <em>record</em></h2></div></div>${Frame.record(it)}<p style="margin-top:1.2rem"><a class="textlink" href="#c/age/${a.id}">See it in ${a.name.toLowerCase()}'s scope and sequence</a></p></section>`;
      return;
    }
    const qs = MOSES.sessions.flatMap((s) => s.questions.map((q, k) => ({ ...q, s: s.n, k: k + 1 })));
    wrap.innerHTML = `${Frame.crumbs("Direction C · The curriculum map")}
      <section class="cm-item"><div><p class="kicker rule">People of the Bible × Adults · workbook</p><h1>Moses: <em>three forties</em></h1><p class="lede" style="margin-top:.8rem">${esc(MOSES.summary)}</p>${Frame.downloads(it)}</div>${ART.cover(it)}</section>
      <section class="sec" style="margin-top:1.4rem"><div class="sec-head"><span class="sec-num">01</span><div><h2>Eight sessions <em>on a hundred and twenty years</em></h2><p>Acts 7 gives the shape: forty in Egypt, forty in Midian, forty in the wilderness. Six of the eight sessions fall in the last forty. Choose a session, or any of the 42 pages below.</p></div></div>
        <div class="pages-row"><div><div class="seq">${timeline()}</div><div class="pages-strip">${Array.from({ length: 42 }, (_, k) => { const sec = sectionOf(k + 1); return `<button type="button" data-p="${k + 1}" style="--tone: var(${sec.tone})" aria-label="Page ${k + 1}: ${esc(sec.label)}"></button>`; }).join("")}</div>
          <p class="hint-line" data-ph></p></div><figure><img data-pimg src="${Frame.page(5)}" alt=""><figcaption data-pcap></figcaption></figure></div></section>
      <section class="sec"><div class="sec-head"><span class="sec-num">02</span><div><h2>Every question, <em>by kind</em></h2><p>Fifty-six questions: observe asks what the text says, interpret what it means in its setting, reflect brings it to the reader. Choose a square to read the question.</p></div></div>
        <div class="qgrid"><span></span>${MOSES.sessions.map((s) => `<span class="qs">${s.n}</span>`).join("")}
          ${["observe", "interpret", "reflect"].map((k) => `<span class="qh">${k}</span>${MOSES.sessions.map((s) => `<div class="qc">${qs.filter((q) => q.s === s.n && q.kind === k).map((q) => `<button type="button" style="--k: var(${KIND_TONE[k]})" data-q="${s.n}-${q.k}" aria-label="Session ${s.n}, question ${q.k}"></button>`).join("")}</div>`).join("")}`).join("")}</div>
        <p class="hint-line" data-qh>Session 1 opens with three observe questions. <span class="muted">Choose any square.</span></p></section>
      <section class="sec"><div class="sec-head"><span class="sec-num">03</span><div><h2>The <em>record</em></h2></div></div>${Frame.record(it)}</section>`;
    const ph = wrap.querySelector("[data-ph]"), img = wrap.querySelector("[data-pimg]"), cap = wrap.querySelector("[data-pcap]");
    const showPage = (n) => { const sec = sectionOf(n); img.src = Frame.page(n); img.alt = `Page ${n}`; cap.textContent = `Page ${n} of 42 · ${sec.label}`;
      ph.innerHTML = `<b>Page ${n}.</b> ${esc(sec.label)}${sec.s ? ` <span class="muted">· read ${esc(sec.s.read)}</span>` : ""}`;
      wrap.querySelectorAll(".pages-strip button").forEach((b) => b.classList.toggle("on", Number(b.dataset.p) === n));
      wrap.querySelectorAll(".blk").forEach((b) => b.classList.toggle("on", sec.s && Number(b.dataset.s) === sec.s.n)); };
    wrap.querySelectorAll(".pages-strip button").forEach((b) => { b.addEventListener("pointerenter", () => showPage(Number(b.dataset.p))); b.addEventListener("click", () => showPage(Number(b.dataset.p))); });
    wrap.querySelectorAll(".blk").forEach((b) => b.addEventListener("click", () => showPage(MOSES.sessions[Number(b.dataset.s) - 1].page)));
    const qh = wrap.querySelector("[data-qh]");
    wrap.querySelectorAll(".qc button").forEach((b) => b.addEventListener("click", () => {
      const [s, k] = b.dataset.q.split("-").map(Number), q = MOSES.sessions[s - 1].questions[k - 1];
      wrap.querySelectorAll(".qc button").forEach((x) => x.classList.toggle("on", x === b));
      qh.innerHTML = `<b>Session ${s}, question ${k}</b> <span class="muted">(${q.kind})</span><br>${esc(q.text)} <span class="muted">· ${esc(q.refs)}</span>`;
    }));
    showPage(5);
    wrap.querySelector(".qc button")?.click();
  }

  Object.assign(DIRS.c, { age, item });
})();
