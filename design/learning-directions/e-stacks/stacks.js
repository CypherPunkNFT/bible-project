// E · Doors and stacks: the owner's merge of A and B (2026-10-08). B's landing ("Choose a door.") sits on top; choosing
// a door opens A's stack for that age in place beneath the doors (the books lying flat, grouped by subject, with A's
// panel beside them), and under the stack B's "What it is built from" ring for the same age. Choosing another door
// slides to its stack; choosing the open door again closes it. The address keeps the age (#e/children) without
// redrawing the page. Below: B's subject lanes and Moses behind every door, then A's series and A's four steps.
// Nothing is open until the reader picks a door, so the landing keeps its moment.
(() => {
  const { esc, icon, plural } = Frame;
  const { AUDIENCES, TRACKS, SERIES, KINDS } = LEARN;
  const SLIDE_MS = 680, OPEN_MS = 760, EASE = "cubic-bezier(.65, 0, .25, 1)";
  const order = AUDIENCES.map((a) => a.id);

  // A's and B's parts link to their own direction; here every link stays in E.
  function retarget(root) {
    root.querySelectorAll('a[href^="#"]').forEach((a) => {
      const m = a.getAttribute("href").match(/^#[a-d]\/(item|age)\/([\w-]+)$/);
      if (m) a.setAttribute("href", m[1] === "item" ? `#e/item/${m[2]}` : `#e/${m[2]}`);
    });
  }

  // One age, opened: A's stack and panel (section 01), then B's ring of what it is built from (section 02).
  function view(aud) {
    const items = LEARN.forAudience(aud.id), ready = items.filter((it) => it.status === "ready").length;
    const subjects = new Set(items.map((it) => it.track)).size;
    const { srcs, svg } = DIRS.b.constellation(items, aud.tone, aud.art);
    const stack = DIRS.a.view(aud).replace(/ · <a class="textlink" href="#a\/age\/[^"]+">[^<]*<\/a>/, "");
    return `<div class="ed-view" data-aud="${aud.id}" style="--tone: var(${aud.tone})">
      <section class="sec ed-sec"><div class="sec-head"><span class="sec-num">01</span><div><h2>${aud.name}: <em>the stack behind the door</em></h2>
          <p>${aud.line} ${plural(items.length, "title")}, ${ready ? `${ready} ready` : "none ready yet"}, in ${plural(subjects, "subject")}. Solid books are ready to download, outlines are planned; point at one to read about it.</p></div></div>
        <div class="sh-kinds" role="group" aria-label="Light one kind">${KINDS.map((k) => `<button type="button" class="sh-kind" data-kind="${k.id}" aria-pressed="false">${ART.kind(k.id, 20, 1.25)}<span><b>${k.plural}</b><small data-count></small></span></button>`).join("")}</div>
        ${stack}</section>
      <section class="sec"><div class="sec-head"><span class="sec-num">02</span><div><h2>What it is <em>built from</em></h2><p>The ${plural(items.length, "title")} behind the ${aud.name.toLowerCase()} door on the inner ring; the ${plural(srcs.length, "page")} of the site they are written from on the outer ring.</p></div></div>
        <div class="constel" style="--tone: var(${aud.tone})"><div>${svg}</div><div class="constel-side" data-side></div></div></section></div>`;
  }

  // B's constellation behaviour, for one opened age.
  function wireRing(v, items) {
    const box = v.querySelector(".constel"), side = v.querySelector("[data-side]");
    const listHtml = `<h3>${plural(items.length, "title")} behind this door</h3><p>Choose a title (or a page on the outer ring) to draw its links. Every line ends at a page the site has already reviewed.</p>
      <ul>${items.map((it) => `<li><a href="#e/item/${it.id}" data-pick="${it.id}">${esc(it.title)}</a> <span class="muted">· ${LEARN.K[it.kind].name}</span> ${Frame.status(it)}</li>`).join("")}</ul>`;
    const clear = () => box.querySelectorAll(".on,.off").forEach((e) => e.classList.remove("on", "off"));
    const mark = (sel, test) => box.querySelectorAll(sel).forEach((el) => el.classList.add(test(el) ? "on" : "off"));
    function pickItem(itemId) {
      const it = LEARN.I[itemId], paths = new Set(it.builtFrom.map((b) => b.path));
      clear();
      mark(".lk", (l) => l.dataset.it === itemId); mark(".it", (g) => g.dataset.it === itemId); mark(".src", (g) => paths.has(g.dataset.src));
      side.innerHTML = `<p class="kicker">${LEARN.K[it.kind].name} · ${LEARN.T[it.track].name}</p><h3 style="margin-top:.4rem">${esc(it.title)}</h3><p>${esc(it.sub)}. ${Frame.status(it)}</p>
        <ul>${it.builtFrom.map((b) => `<li><a class="textlink" href="${b.path}">${esc(b.title)}</a></li>`).join("")}</ul><p style="margin-top:1rem"><a class="btn" href="#e/item/${it.id}">Open this title ${icon("arrowRight", 14)}</a> <button type="button" class="btn" data-reset style="margin-top:.4rem">All titles</button></p>`;
    }
    function pickSrc(path) {
      const users = new Set(items.filter((it) => it.builtFrom.some((b) => b.path === path)).map((it) => it.id));
      clear();
      mark(".lk", (l) => l.dataset.src === path); mark(".it", (g) => users.has(g.dataset.it)); mark(".src", (g) => g.dataset.src === path);
    }
    side.innerHTML = listHtml;
    side.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-pick]");
      if (pick) { e.preventDefault(); pickItem(pick.dataset.pick); }
      if (e.target.closest("[data-reset]")) { clear(); side.innerHTML = listHtml; }
    });
    box.addEventListener("click", (e) => {
      const it = e.target.closest(".it"), src = e.target.closest(".src");
      if (it) pickItem(it.dataset.it); else if (src) pickSrc(src.dataset.src);
    });
  }

  function front(wrap) {
    const ages = AUDIENCES.filter((a) => !a.setting), settings = AUDIENCES.filter((a) => a.setting);
    const steps = [["Choose the pages", "Only the site's reviewed pages: a person's story, a study, a Topics category."], ["Write from them", "Summaries in plain words, questions whose answers are in the verses they name."],
      ["Check every word", "Every reference must exist and every quotation must match the King James text, or nothing is built."], ["Print and shelve", "A4 and US Letter with the same page numbers, a cover, and a row in the catalogue."]];
    const moses = LEARN.inSeries("moses");
    wrap.innerHTML = `${Frame.crumbs("Direction E · Doors and stacks")}
      <section class="dr-land ed-land"><div class="dr-sky" aria-hidden="true"></div>
        <div class="dr-head"><p class="kicker">Resources · Learning materials</p><h1>Choose <em>a door.</em></h1><p>Five doors by age and two for those who use them together. Open one to see its stack, every title written from the site's reviewed pages.</p></div>
        <div class="doors">${ages.map((a) => DIRS.b.door(a, `#e/${a.id}`)).join("")}${settings.map((a) => DIRS.b.door(a, `#e/${a.id}`)).join("")}</div>
        <p class="hint-line dr-hint" data-door></p>
        <div class="dr-bar"><div><b>${LEARN.ready.length}</b><span>Ready to print</span></div><div><b>${LEARN.planned.length}</b><span>Planned</span></div><div><b>${TRACKS.length}</b><span>Subjects</span></div><div><b>${SERIES.length}</b><span>Series</span></div><div><b>2</b><span>Paper sizes</span></div></div>
      </section>
      <div class="ed-drawer" hidden><div class="ed-stage"></div></div>
      <div data-lanes></div>
      <section class="sec"><div class="sec-head"><span class="sec-num"></span><div><h2>The same story <em>behind every door</em></h2><p>Moses at every age: one reviewed story, told for each reader. Only the adults' workbook is written; the others are planned.</p></div></div>
        <div class="dr-mini">${moses.map((m) => DIRS.b.door(LEARN.A[m.audience], `#e/item/${m.id}`, `<span class="n">${esc(m.title)}<br>${m.status === "ready" ? "Ready" : "Planned"}</span>`)).join("")}</div></section>
      <section class="sec"><div class="sec-head"><span class="sec-num"></span><div><h2>Series that <em>cross the ages</em></h2><p>Some titles belong together: one subject told at every age, or a path to follow in order. The filled point is the one ready today.</p></div></div>
        <div class="sh-series">${SERIES.map((s) => DIRS.a.seriesBlock(s.id)).join("")}</div></section>
      <section class="sec"><div class="sec-head"><span class="sec-num"></span><div><h2>How a title <em>reaches the shelf</em></h2><p>The same four steps made the Moses workbook. A planned title becomes ready only after all four.</p></div></div>
        <ol class="sh-steps">${steps.map(([b, p], i) => `<li><span>0${i + 1}</span><b>${b}</b><p>${p}</p></li>`).join("")}</ol></section>`;
    DIRS.b.lanes(wrap.querySelector("[data-lanes]"));
    retarget(wrap);
    wireDoors(wrap);
  }

  function wireDoors(wrap) {
    const doors = wrap.querySelector(".doors"), drawer = wrap.querySelector(".ed-drawer"), stage = wrap.querySelector(".ed-stage"), hint = wrap.querySelector("[data-door]");
    const restHint = () => (age ? `<b>${LEARN.A[age].name}</b> is open below. <span class="muted">Choose another door to slide to its stack, or this one again to close it.</span>` : "Choose a door to open its stack.");
    let age = null, kind = null, slide = null, opening = null;

    // Section numbers follow what is open: 01 and 02 belong to the open stack, the rest count on from there.
    const renumber = () => { let n = 0; wrap.querySelectorAll(".sec-num").forEach((el) => { if (!el.closest("[hidden], .is-outgoing")) el.textContent = String(++n).padStart(2, "0"); }); };

    // A's stack behaviour: pointing at a book lifts it and fills the panel; clicking keeps it.
    function lead(v, el) {
      const line = v.querySelector(".st-lead"), panel = v.querySelector(".st-panel");
      if (!el || getComputedStyle(panel).borderLeftStyle === "none") { line.hidden = true; return; }
      const box = v.querySelector(".st-view").getBoundingClientRect(), b = el.getBoundingClientRect(), p = panel.getBoundingClientRect();
      const x1 = b.right - box.left + 6, x2 = p.left - box.left;
      line.hidden = x2 - x1 < 8;
      Object.assign(line.style, { left: `${x1}px`, width: `${x2 - x1}px`, top: `${b.top + b.height / 2 - box.top}px` });
    }
    function show(v, el) {
      const panel = v.querySelector(".st-panel");
      panel.innerHTML = DIRS.a.panel(LEARN.I[el.dataset.id]);
      retarget(panel);
      v.querySelectorAll(".bk.is-on").forEach((x) => x.classList.remove("is-on"));
      el.classList.add("is-on");
      lead(v, el);
    }
    function keep(v, el) {
      v.querySelectorAll(".bk[aria-pressed='true']").forEach((x) => x.setAttribute("aria-pressed", "false"));
      el.setAttribute("aria-pressed", "true");
      v.kept = el;
      show(v, el);
    }
    function lightKind(v) {
      v.querySelectorAll(".bk").forEach((el) => { el.classList.toggle("dim", !!kind && el.dataset.kind !== kind); el.classList.toggle("lit", !!kind && el.dataset.kind === kind); });
      const items = LEARN.forAudience(v.dataset.aud);
      v.querySelectorAll(".sh-kind").forEach((c) => { const n = items.filter((it) => it.kind === c.dataset.kind).length;
        c.querySelector("[data-count]").textContent = n ? `${n} here` : "None here"; c.classList.toggle("none", !n); c.setAttribute("aria-pressed", String(c.dataset.kind === kind)); });
    }
    function wireView(v) {
      const stackEl = v.querySelector(".st-stack");
      stackEl.addEventListener("pointerover", (e) => { const el = e.target.closest(".bk"); if (el && !el.classList.contains("is-on")) show(v, el); });
      stackEl.addEventListener("pointerleave", () => { if (v.kept && !v.kept.classList.contains("is-on")) show(v, v.kept); });
      stackEl.addEventListener("click", (e) => { const el = e.target.closest(".bk"); if (el) keep(v, el); });
      v.querySelector(".st-panel").addEventListener("click", (e) => { const b = e.target.closest("[data-page]"); if (b) DIRS.a.viewer(Number(b.dataset.page)); });
      v.querySelectorAll(".sh-kind").forEach((chip) => chip.addEventListener("click", () => {
        kind = chip.getAttribute("aria-pressed") === "true" ? null : chip.dataset.kind;
        stage.querySelectorAll(".ed-view").forEach(lightKind);
      }));
      wireRing(v, LEARN.forAudience(v.dataset.aud));
      lightKind(v);
      keep(v, v.querySelector(".bk.ready") ?? v.querySelector(".bk"));
    }

    function markDoors() {
      doors.classList.toggle("has-chosen", !!age);
      wrap.querySelector(".ed-land").classList.toggle("is-open", !!age);
      doors.querySelectorAll(".door").forEach((d) => { const on = d.dataset.aud === age; d.classList.toggle("is-chosen", on); d.setAttribute("aria-expanded", String(on)); });
      // On a phone the doors are a sideways row: bring the chosen one to the middle of it.
      if (age && doors.scrollWidth > doors.clientWidth) { const d = doors.querySelector(".is-chosen"), shift = d.getBoundingClientRect().left - doors.getBoundingClientRect().left;
        doors.scrollTo({ left: doors.scrollLeft + shift - (doors.clientWidth - d.offsetWidth) / 2, behavior: "smooth" }); }
      hint.innerHTML = restHint();
      history.replaceState(null, "", age ? `#e/${age}` : "#e");
    }
    const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    function endSlide() {
      if (!slide) return;
      const s = slide;
      slide = null;
      s.anims.forEach((a) => a.cancel());
      s.old.remove();
      s.next.classList.remove("is-incoming");
      stage.classList.remove("is-sliding");
      lead(s.next, s.next.kept);
    }
    function endOpening() { if (!opening) return; opening.forEach((a) => a.cancel()); opening = null; drawer.classList.remove("is-opening"); }

    // Opening: the drawer grows from nothing beneath the doors while the stack rises a little into place.
    function openDrawer(id, animate) {
      age = id;
      stage.innerHTML = view(LEARN.A[id]);
      drawer.hidden = false;
      wireView(stage.firstElementChild);
      markDoors(); renumber();
      if (!animate) return;
      const h = drawer.offsetHeight, opts = { duration: reduce() ? 1 : OPEN_MS, easing: EASE, id: "the stack opening" };
      drawer.classList.add("is-opening");
      opening = [drawer.animate([{ height: "0px" }, { height: `${h}px` }], opts), stage.animate([{ transform: "translateY(-48px)" }, { transform: "translateY(0)" }], opts)];
      opening[0].finished.then(endOpening, () => {});
      Ticker.refresh();
      const top = doors.getBoundingClientRect().top + scrollY - document.querySelector(".site-header").offsetHeight - 12;
      if (top > scrollY + 40) scrollTo({ top, behavior: reduce() ? "auto" : "smooth" });
    }
    function closeDrawer() {
      endSlide(); endOpening();
      const h = drawer.offsetHeight;
      age = null;
      markDoors();
      drawer.classList.add("is-opening");
      opening = [drawer.animate([{ height: `${h}px` }, { height: "0px" }], { duration: reduce() ? 1 : SLIDE_MS, easing: EASE, fill: "forwards", id: "the stack closing" })];
      opening[0].finished.then(() => { if (age) return; endOpening(); drawer.hidden = true; stage.replaceChildren(); renumber(); }, () => {});
      Ticker.refresh();
    }
    // Another door: the open stack slides out and the next slides in, the way A's age bar does it.
    function slideTo(id) {
      endSlide(); endOpening();
      const sign = order.indexOf(id) > order.indexOf(age) ? 1 : -1;
      age = id;
      markDoors();
      const old = stage.querySelector(".ed-view"), h0 = stage.offsetHeight;
      old.classList.add("is-outgoing");
      stage.insertAdjacentHTML("beforeend", view(LEARN.A[id]));
      const next = stage.lastElementChild;
      next.classList.add("is-incoming");
      stage.classList.add("is-sliding");
      wireView(next);
      renumber();
      const h1 = next.offsetHeight, shift = stage.clientWidth + 64;
      const opts = { duration: reduce() ? 1 : SLIDE_MS, easing: EASE, fill: "both", id: "the stack sliding" };
      const anims = [old.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-sign * shift}px)` }], opts),
        next.animate([{ transform: `translateX(${sign * shift}px)` }, { transform: "translateX(0)" }], opts),
        stage.animate([{ height: `${h0}px` }, { height: `${h1}px` }], opts)];
      slide = { anims, old, next };
      Promise.all(anims.map((a) => a.finished)).then(() => { if (slide?.next === next) endSlide(); }, () => {});
      Ticker.refresh();
    }
    function choose(id) {
      if (!LEARN.A[id]) return;
      if (id === age) closeDrawer();
      else if (!age || drawer.hidden) { endOpening(); openDrawer(id, true); }
      else slideTo(id);
    }

    doors.addEventListener("click", (e) => {
      const d = e.target.closest(".door");
      if (!d || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      choose(d.dataset.aud);
    });
    doors.querySelectorAll(".door").forEach((d) => {
      d.setAttribute("aria-expanded", "false");
      d.addEventListener("pointerenter", () => { hint.innerHTML = DIRS.b.doorHint(LEARN.A[d.dataset.aud]); });
      d.addEventListener("pointerleave", () => { hint.innerHTML = restHint(); });
    });
    const onKey = (e) => {
      if (!wrap.isConnected) { removeEventListener("keydown", onKey); return; }
      if (!age || e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || document.querySelector(".viewer")) return;
      const i = order.indexOf(age);
      if (e.key === "ArrowRight") { e.preventDefault(); choose(order[(i + 1) % order.length]); }
      if (e.key === "ArrowLeft") { e.preventDefault(); choose(order[(i - 1 + order.length) % order.length]); }
    };
    addEventListener("keydown", onKey);
    const onResize = () => { if (!wrap.isConnected) { removeEventListener("resize", onResize); return; } const v = stage.querySelector(".ed-view:last-child"); if (v?.kept) lead(v, v.querySelector(".bk.is-on") ?? v.kept); };
    addEventListener("resize", onResize);
    document.fonts?.ready.then(onResize);

    // An address with an age (#e/children) opens that door straight away, without the opening motion.
    const first = location.hash.replace(/^#/, "").split("/")[1];
    if (LEARN.A[first]) openDrawer(first, false); else { hint.innerHTML = restHint(); renumber(); }
  }

  DIRS.e = { name: "Doors and stacks", ageNote: "Ages open on the front", defaultAge: "adults", front, retarget };
})();
