// D · In your hands, front page. The one real workbook lies open as a two-page spread you can turn (arrows, keys,
// the page edges, or the slider); its contents and downloads sit beside it, and the whole catalogue is gathered
// below as covers. Choosing a planned cover puts that title in your hands instead: its outline and its sources.
(() => {
  const { esc, icon, plural } = Frame;
  const { AUDIENCES, ITEMS } = LEARN;
  const N = 42;
  const sectionOf = (n) => { if (n <= 4) return ["Cover", "Contents", "How to use this workbook", "The three forties"][n - 1]; if (n >= 41) return "Sources";
    const s = MOSES.sessions.find((x) => n >= x.pages[0] && n <= x.pages[1]); return `Session ${s.n} · ${s.title}`; };

  // The open book. Wide: spreads [1], [2,3], [4,5] … [42]. Narrow: one page at a time. Turning is a Web Animation.
  function Book(host, { start = 1, onTurn } = {}) {
    const single = () => matchMedia("(max-width: 700px)").matches;
    const spreadOf = (n) => (single() ? [n] : n === 1 ? [1] : n % 2 === 0 ? (n + 1 <= N ? [n, n + 1] : [n]) : [n - 1, n]);
    let pages = spreadOf(start), busy = false;
    host.innerHTML = `<div class="book"><div class="book-stage"><div class="spread"></div></div>
      <div class="book-bar"><button type="button" class="round" data-go="-1" aria-label="Previous page">${icon("chevL", 18)}</button>
        <p class="where" data-where></p><button type="button" class="round" data-go="1" aria-label="Next page">${icon("chevR", 18)}</button>
        <input type="range" min="1" max="${N}" value="${start}" aria-label="Go to page"></div></div>`;
    const spread = host.querySelector(".spread"), where = host.querySelector("[data-where]"), range = host.querySelector("input");
    const slot = (n, side) => n ? `<div class="leafslot ${side}"><img src="${Frame.page(n)}" alt="Page ${n}"></div>` : "";
    function paint() {
      spread.classList.toggle("single", single());
      spread.classList.toggle("solo", !single() && pages.length === 1);
      spread.innerHTML = (pages.length === 1 ? slot(pages[0], single() ? "" : pages[0] === 1 ? "r" : "l") : slot(pages[0], "l") + slot(pages[1], "r")) + `<span class="gutter"></span><span class="hit prev" data-go="-1"></span><span class="hit next" data-go="1"></span>`;
      where.innerHTML = `<b>${pages.map((p) => `p. ${p}`).join(" – ")}</b>${esc(sectionOf(pages.at(-1)))}`;
      range.value = pages[0];
      host.querySelector('.book-bar [data-go="-1"]').disabled = pages[0] === 1;
      host.querySelector('.book-bar [data-go="1"]').disabled = pages.at(-1) === N;
      onTurn?.(pages);
    }
    function go(next, dir) {
      if (busy || next.join() === pages.join()) return;
      const leaf = document.createElement("div");
      leaf.className = "leaf";
      const wide = !single(), forward = dir > 0;
      const front = forward ? pages.at(-1) : pages[0], back = forward ? next[0] : next.at(-1);
      leaf.innerHTML = `<div class="face"><img src="${Frame.page(front)}" alt=""></div><div class="face back"><img src="${Frame.page(back)}" alt=""></div>`;
      leaf.style.left = wide ? (forward ? "50%" : "0") : "0";
      leaf.style.transformOrigin = wide ? (forward ? "0 50%" : "100% 50%") : (forward ? "0 50%" : "100% 50%");
      // Under the leaf, show the destination pages already, except the face that is turning.
      pages = next; paint();
      if (wide) { const hide = spread.querySelector(forward ? ".leafslot.l" : ".leafslot.r"); if (hide) hide.style.visibility = "hidden"; }
      spread.append(leaf);
      busy = true;
      const anim = leaf.animate([{ transform: "rotateY(0deg)" }, { transform: `rotateY(${forward ? -180 : 180}deg)` }], { duration: 900, easing: "cubic-bezier(.45,.05,.25,1)", fill: "forwards", id: "flip" });
      Ticker.refresh();
      anim.finished.then(() => { leaf.remove(); spread.querySelectorAll(".leafslot").forEach((s) => (s.style.visibility = "")); busy = false; }).catch((error) => { console.warn("book: page turn interrupted", error); leaf.remove(); busy = false; });
    }
    const step = (d) => { const target = d > 0 ? pages.at(-1) + 1 : pages[0] - 1; if (target >= 1 && target <= N) go(spreadOf(target), d); };
    host.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b && !b.disabled) step(Number(b.dataset.go)); });
    range.addEventListener("input", () => { pages = spreadOf(Number(range.value)); paint(); });
    const key = (e) => { if (!host.isConnected) { removeEventListener("keydown", key); return; } if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); };
    addEventListener("keydown", key);
    addEventListener("resize", () => { if (host.isConnected) { pages = spreadOf(pages[0]); paint(); } });
    paint();
    return { open(n) { const t = spreadOf(n); go(t, t[0] >= pages[0] ? 1 : -1); } };
  }

  const toc = () => `<div class="ih-toc">${[[3, "", "How to use it"], [4, "", "The three forties"], ...MOSES.sessions.map((s) => [s.page, String(s.n), s.title]), [41, "", "Sources"]]
    .map(([p, n, t]) => `<button type="button" data-open="${p}"><span>${n}</span><b>${esc(t)}</b><span>${p}</span></button>`).join("")}</div>`;
  const markToc = (root, pages) => root.querySelectorAll("[data-open]").forEach((b) => { const p = Number(b.dataset.open); b.setAttribute("aria-current", String(pages.includes(p))); });

  function held(it) {
    const a = LEARN.A[it.audience];
    return `<div class="held">${ART.cover(it)}<div><p class="kicker" style="--tone: var(${a.tone})">${LEARN.K[it.kind].name} · ${a.name} · planned</p><h2>${esc(it.title)}</h2><p>${esc(it.sub)}. Nothing has been written yet, so there are no pages to turn. When it is written, it will come from:</p>
      <ul style="margin-top:.8rem;border-top:1px solid var(--line)">${it.builtFrom.map((b) => `<li style="padding:.45rem 0;border-bottom:1px solid var(--line);font-size:.84rem"><a class="textlink" href="${b.path}">${esc(b.title)}</a></li>`).join("")}</ul>
      <p style="margin-top:1rem"><button type="button" class="btn" data-back>${icon("arrowLeft", 14)}Back to the workbook</button> <a class="btn" href="#d/item/${it.id}">Its page</a></p></div></div>`;
  }

  function front(wrap) {
    const it = LEARN.I["moses-three-forties"];
    wrap.innerHTML = `${Frame.crumbs("Direction D · In your hands")}
      <section class="ih-desk"><div class="ih-side"><p class="kicker rule">Learning materials · ready now</p><h1>Moses<em>three forties</em></h1>
          <p class="sum">An eight-session workbook for adults, alone or in a group. Turn the pages: this is the real PDF, page for page.</p>${Frame.downloads(it)}${toc()}</div>
        <div data-hands></div></section>
      <section class="sec"><div class="ih-cat-head"><div class="sec-head" style="margin:0"><span class="sec-num">01</span><div><h2>Everything else, <em>gathered round</em></h2><p>${plural(LEARN.planned.length, "title")} planned, drawn as their covers will look. Choose one to hold it; outlines are not written yet.</p></div></div>
        <div class="seg" role="group" aria-label="Show titles for">${[["all", "Everyone"], ...AUDIENCES.map((a) => [a.id, a.name])].map(([id, n], i) => `<button type="button" data-f="${id}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div></div>
        <div class="ih-covers">${ITEMS.map((x) => `<button type="button" class="ih-cover" data-id="${x.id}" data-a="${x.audience}" style="--tone: var(${LEARN.A[x.audience].tone})">${ART.cover(x)}<b>${esc(x.title)}</b><small>${LEARN.A[x.audience].name} · ${LEARN.K[x.kind].name}</small></button>`).join("")}</div></section>`;
    const hands = wrap.querySelector("[data-hands]");
    let book;
    const openBook = (n = 1) => { book = Book(hands, { start: n, onTurn: (p) => markToc(wrap, p) }); };
    openBook(1);
    wrap.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => { if (!hands.querySelector(".book")) openBook(Number(b.dataset.open)); else book.open(Number(b.dataset.open)); }));
    wrap.querySelectorAll(".ih-cover").forEach((c) => c.addEventListener("click", () => {
      const x = LEARN.I[c.dataset.id];
      wrap.querySelectorAll(".ih-cover").forEach((y) => y.classList.toggle("on", y === c));
      if (x.status === "ready") openBook(1); else { hands.innerHTML = held(x); hands.querySelector("[data-back]").addEventListener("click", () => openBook(1)); }
      hands.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    wrap.querySelectorAll("[data-f]").forEach((b) => b.addEventListener("click", () => {
      wrap.querySelectorAll("[data-f]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      wrap.querySelectorAll(".ih-cover").forEach((c) => { c.hidden = b.dataset.f !== "all" && !LEARN.forAudience(b.dataset.f).some((x) => x.id === c.dataset.id); });
    }));
  }

  DIRS.d = { name: "In your hands", defaultAge: "families", front, Book, toc, markToc, held, sectionOf };
})();
