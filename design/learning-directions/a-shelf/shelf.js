// A · The shelf, front page. The approved cabinet idea grown into a library: one shelf per age, one spine per title,
// the one ready workbook face-out; planned titles are outlines. A kind filter (the "crystals") lights one kind everywhere.
(() => {
  const { esc, icon, plural } = Frame;
  const { AUDIENCES, KINDS, TRACKS, ITEMS, SERIES } = LEARN;
  const SIZE = { workbook: [48, 200], lesson: [42, 186], plan: [38, 176], devotional: [44, 170], story: [54, 150], activity: [50, 160], cards: [56, 120], maps: [36, 196], guide: [40, 182] };

  const spine = (it, via) => {
    const a = LEARN.A[it.audience];
    if (it.status === "ready") return `<a class="faceout" href="#a/item/${it.id}" data-id="${it.id}" data-kind="${it.kind}"><img src="shared/pages/p01.png" alt="Cover of ${esc(it.title)}">${Frame.status(it)}</a>`;
    const [w, base] = SIZE[it.kind], h = Math.min(250, Math.max(base - 40, 66 + it.title.length * 6.9));
    return `<a class="spine k-${it.kind}" href="#a/item/${it.id}" data-id="${it.id}" data-kind="${it.kind}" style="--w:${w}px;--h:${h}px;--tone:var(${a.tone})" aria-label="${esc(it.title)}, planned">
      ${via ? `<span class="via" title="Comes with a leader guide">${ART.kind("guide", 13)}</span>` : ""}<span class="t"><span class="tt">${esc(it.title)}</span><small>${LEARN.K[it.kind].name}</small></span>${ART.kind(it.kind, 17, 1.3)}</a>`;
  };

  function shelfRow(aud) {
    const items = LEARN.forAudience(aud.id);
    const groups = TRACKS.map((t) => [t, items.filter((it) => it.track === t.id)]).filter(([, list]) => list.length);
    const body = groups.map(([t, list], gi) => `${gi ? '<span class="sh-gap"></span>' : ""}${list.sort((p, q) => (p.status === "ready" ? -1 : 0) - (q.status === "ready" ? -1 : 0)).map((it) => spine(it, aud.id === "leaders" && it.audience !== "leaders")).join("")}`).join("");
    const ready = items.filter((it) => it.status === "ready").length;
    return `<article class="sh-row" style="--tone: var(${aud.tone})" data-aud="${aud.id}">
      <div class="sh-who">${ART.audience(aud.art)}<span class="count">${aud.setting ? "Setting" : `Ages ${aud.age}`}</span><h3><a href="#a/age/${aud.id}">${aud.name}</a></h3><p>${aud.how} · ${plural(items.length, "title")}${ready ? `, ${ready} ready` : ""}</p></div>
      <div><div class="sh-scroll"><div class="sh-shelf">${body}</div><div style="height:30px;position:relative" class="sh-labels">${groups.map(([t]) => `<span data-track="${t.id}"></span>`).join("")}</div></div>
      <p class="hint-line sh-hint" data-hint>${hintDefault(aud, items)}</p></div></article>`;
  }
  const hintDefault = (aud, items) => `<b>${aud.name}.</b> ${aud.line} <span class="muted">Point at a spine to read it; ${Frame.say(new Set(items.map((i) => i.track)).size)} subjects on this shelf.</span>`;
  const hintFor = (it) => `<b>${esc(it.title)}</b> · ${esc(it.sub)}<br>${Frame.facts(it)} · ${LEARN.T[it.track].name} · ${Frame.status(it)} <span class="muted">${it.status === "ready" ? "Open it to see the pages and download." : `Built from: ${it.builtFrom.map((b) => esc(b.title)).join("; ")}`}</span>`;

  // Group labels under each shelf, placed under the first spine of each subject.
  function labelGroups(root) {
    for (const row of root.querySelectorAll(".sh-row")) {
      const shelf = row.querySelector(".sh-shelf"), labels = row.querySelector(".sh-labels");
      labels.style.width = `${shelf.scrollWidth}px`;
      const seen = new Set();
      const spines = [...shelf.children].filter((el) => el.dataset.id);
      labels.innerHTML = spines.map((el) => {
        const t = LEARN.I[el.dataset.id].track;
        if (seen.has(t)) return "";
        seen.add(t);
        const last = spines.filter((x) => LEARN.I[x.dataset.id].track === t).at(-1);
        return `<span class="sh-group" style="left:${el.offsetLeft}px;max-width:${Math.max(40, last.offsetLeft + last.offsetWidth - el.offsetLeft + 10)}px" title="${LEARN.T[t].name}">${LEARN.T[t].short}</span>`;
      }).join("");
    }
  }

  function seriesBlock(sid, hereId) {
    const s = LEARN.S[sid], list = LEARN.inSeries(sid);
    return `<div class="sh-path"><div><span class="type">${s.type}</span><h3>${s.name}</h3><p>${s.line}</p></div>
      <div class="sh-nodes">${list.map((it) => `<a class="sh-node ${it.status}${it.id === hereId ? " here" : ""}" href="#a/item/${it.id}"><i></i><b>${esc(it.title)}</b><small>${LEARN.A[it.audience].name} · ${LEARN.K[it.kind].name}${it.status === "planned" ? " · planned" : " · ready"}</small></a>`).join("")}</div></div>`;
  }

  function front(wrap) {
    const kindsUsed = KINDS.map((k) => [k, ITEMS.filter((it) => it.kind === k.id).length]);
    wrap.innerHTML = `${Frame.crumbs("Direction A · The shelf")}
      <section class="sh-intro">
        <div><p class="kicker rule">Resources · 01 · Learning materials</p><h1 class="plain-title">Something for<br><em>every age.</em></h1></div>
        <div><p class="lede">Workbooks, lessons, activity pages and reading plans, written from the site's own reviewed pages and checked word for word against the King James text. One shelf for each age, and two for the people who use them together.</p>
          <dl class="figures"><div><dt>Ready to print</dt><dd>${LEARN.ready.length}</dd></div><div><dt>Planned</dt><dd>${LEARN.planned.length}</dd></div><div><dt>Ages + settings</dt><dd>5 + 2</dd></div><div><dt>Subjects</dt><dd>${TRACKS.length}</dd></div></dl></div>
      </section>
      <section class="sec" style="margin-top:2rem"><div class="sec-head"><span class="sec-num">01</span><div><h2>Seven shelves, <em>one for each reader</em></h2><p>A spine is a title. The one turned face-out is ready to download; the outlines are planned and not written yet. Choose a kind to light it on every shelf.</p></div></div>
        <div class="sh-kinds" role="group" aria-label="Show one kind">${kindsUsed.map(([k, n]) => `<button type="button" class="sh-kind" data-kind="${k.id}" aria-pressed="false">${ART.kind(k.id, 22, 1.25)}<span><b>${k.plural}</b><small>${plural(n, "title")}</small></span></button>`).join("")}</div>
        <div class="sh-rows">${AUDIENCES.map(shelfRow).join("")}</div></section>
      <section class="sec"><div class="sec-head"><span class="sec-num">02</span><div><h2>Series that <em>cross the shelves</em></h2><p>Some titles belong together: one subject told at every age, or a path to follow in order. The filled point is the one ready today.</p></div></div>
        <div class="sh-series">${SERIES.map((s) => seriesBlock(s.id)).join("")}</div></section>
      <section class="sec"><div class="sec-head"><span class="sec-num">03</span><div><h2>How a title <em>reaches the shelf</em></h2><p>The same four steps made the Moses workbook. A planned title becomes ready only after all four.</p></div></div>
        <ol class="sh-steps">${[["Choose the pages", "Only the site's reviewed pages: a person's story, a study, a Topics category."], ["Write from them", "Summaries in plain words, questions whose answers are in the verses they name."], ["Check every word", "Every reference must exist and every quotation must match the King James text, or nothing is built."], ["Print and shelve", "A4 and US Letter with the same page numbers, a cover, and a row in the catalogue."]].map(([b, p], i) => `<li><span>0${i + 1}</span><b>${b}</b><p>${p}</p></li>`).join("")}</ol></section>`;
    wire(wrap);
  }

  function wire(wrap) {
    labelGroups(wrap);
    addEventListener("resize", () => labelGroups(wrap), { once: true });
    for (const row of wrap.querySelectorAll(".sh-row")) {
      const hint = row.querySelector("[data-hint]"), base = hint.innerHTML;
      row.addEventListener("pointerover", (e) => { const el = e.target.closest("[data-id]"); if (el) { hint.innerHTML = hintFor(LEARN.I[el.dataset.id]); row.querySelectorAll(".is-on").forEach((x) => x.classList.remove("is-on")); el.classList.add("is-on"); } });
      row.addEventListener("pointerleave", () => { hint.innerHTML = base; row.querySelectorAll(".is-on").forEach((x) => x.classList.remove("is-on")); });
    }
    const chips = wrap.querySelectorAll(".sh-kind");
    chips.forEach((chip) => chip.addEventListener("click", () => {
      const on = chip.getAttribute("aria-pressed") !== "true";
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip && on)));
      wrap.querySelectorAll(".sh-shelf [data-kind]").forEach((el) => el.classList.toggle("dim", on && el.dataset.kind !== chip.dataset.kind));
    }));
  }

  DIRS.a = { name: "The shelf", defaultAge: "children", front, seriesBlock, spine, hintFor };
})();
