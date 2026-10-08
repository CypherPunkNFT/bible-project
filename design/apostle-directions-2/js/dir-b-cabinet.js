// B, after the chapters: the cabinet of the things Scripture names around him (each with the verse that names it),
// or, for Thaddaeus, of whom Scripture names no object, the four lists that carry his name. Then the questions as
// floating words, and the way to the second page.
window.BCabinet = (() => {
  const ordinal = (n) => ({ 10: "tenth", 11: "eleventh" })[n] ?? `${n}th`;
  const bookOfId = (id) => bookName(Math.floor(id / 1e6));

  function cabinetHTML(d) {
    const objs = d.objects, vs = objs.flatMap((o) => o.verses.map((v) => v.id));
    const first = Math.min(...vs), last = Math.max(...vs);
    return `<section class="wrap b-cab"><div class="cab-intro"><div><p class="kicker">The cabinet · ${esc(d.short)}</p><h2 class="cab-big">In his hands</h2></div>
        <div><p class="cab-lede">${objs.length} things Scripture names around ${esc(d.short)}, from ${esc(objs[0].name.toLowerCase())} to ${esc(objs.at(-1).name.toLowerCase())}. Open a case to read the verse that names it, word for word.</p>
          <dl class="cab-stats"><div><dt>Objects</dt><dd>${objs.length}</dd></div><div><dt>Verses quoted</dt><dd>${new Set(vs).size}</dd></div><div><dt>First named</dt><dd>${esc(verseRef(first))}</dd></div><div><dt>Last named</dt><dd>${esc(verseRef(last))}</dd></div></dl></div></div>
      <div class="cab-grid">${objs.map((o, i) => `<button type="button" class="case" data-obj="${i}"><span class="case-art">${Art.object(o.art)}</span>
          <span class="case-n">Nº ${String(i + 1).padStart(2, "0")}</span><span class="case-name">${esc(o.name)}</span><span class="case-ref">${esc(verseRef(o.verses[0].id))}${o.verses.length > 1 ? ` → ${esc(bookOfId(o.verses.at(-1).id))}` : ""}</span></button>`).join("")}
        <div class="case case-note"><p class="kicker">About the cabinet</p><p>Line drawings by this site, to show what each verse names. They are not pictures of the real objects.</p><p>Every case quotes the King James Version; the words in the case are checked against it, word for word.</p></div></div></section>`;
  }
  function objectSheet(d, o, i) {
    const marked = (v) => { const t = esc(vtext(v.id)), p = esc(v.phrase); return t.includes(p) ? t.replace(p, `<mark>${p}</mark>`) : t; };
    return `<p class="kicker">The cabinet · Nº ${String(i + 1).padStart(2, "0")}</p><h3 class="sheet-title">${esc(o.name)}</h3><div class="sheet-art">${Art.object(o.art)}</div>
      <div class="kjv">${o.verses.map((v) => `<p>${marked(v)} <a class="ref" href="${refHref([v.id])}">${esc(verseRef(v.id))}</a></p>`).join("")}</div>${claimFoot({ layer: "scripture" })}`;
  }

  // Thaddaeus: the four lists, each drawn as a scroll of twelve lines with his line marked.
  function listsHTML(d) {
    const acc = d.accounts.find((a) => a.id === "lists");
    return `<section class="wrap b-cab"><div class="cab-intro"><div><p class="kicker">The cabinet · ${esc(d.short)}</p><h2 class="cab-big">In the lists</h2></div>
        <div><p class="cab-lede">Scripture names no object in his story: no net, no road, no letter. What it keeps is his name, four times, in the lists of the Twelve. Two lists call him Thaddaeus; two call him Judas of James.</p>
          <dl class="cab-stats"><div><dt>Lists</dt><dd>4</dd></div><div><dt>Place in Matthew and Mark</dt><dd>Tenth</dd></div><div><dt>Place in Luke and Acts</dt><dd>Eleventh</dd></div><div><dt>Verses that name him</dt><dd>${d.verseCount}</dd></div></dl></div></div>
      <div class="cab-grid lists">${d.lists.map((l, i) => {
        const col = acc?.cols[i];
        return `<button type="button" class="case" data-list="${i}"><span class="case-art"><svg class="art obj" viewBox="0 0 200 150" fill="none" stroke-linecap="round" aria-hidden="true">
          <path class="ln" pathLength="1" d="M40 22h120M40 128h120" style="--d:0"/><ellipse class="ln" pathLength="1" cx="40" cy="75" rx="6" ry="58" style="--d:.05"/><ellipse class="ln" pathLength="1" cx="160" cy="75" rx="6" ry="58" style="--d:.08"/>
          ${Array.from({ length: 12 }, (_, k) => `<path class="${k + 1 === l.position ? "tn write him" : "fn write"}" pathLength="1" style="--d:${(.1 + k * .04).toFixed(2)}" d="M58 ${32 + k * 8}h${k + 1 === l.position ? 84 : 40 + ((k * 17) % 40)}"/>`).join("")}</svg></span>
          <span class="case-n">${esc(bookName(Math.floor(l.span[0] / 1e6)))} · ${ordinal(l.position)}</span><span class="case-name">“${esc(l.name)}”</span><span class="case-ref">${esc(col ? refText(col.spans[0]) : verseRef(l.span[0]))}</span></button>`;
      }).join("")}</div></section>`;
  }
  function listSheet(d, i) {
    const l = d.lists[i], col = d.accounts.find((a) => a.id === "lists")?.cols[i];
    return `<p class="kicker">${esc(col?.label ?? "")}</p><h3 class="sheet-title">“${esc(l.name)}”</h3><div class="kjv">${(col?.verses ?? []).map((v) => `<p><sup>${chapterOf(v.id).ch}:${chapterOf(v.id).v}</sup> ${markNames(v.text)}</p>`).join("")}</div>${claimFoot({ layer: "scripture", refs: col?.spans ?? [l.span] })}
      <h4 class="sheet-h">One man or two?</h4><p class="sheet-lede">${esc(d.identifications[0]?.text ?? "")}</p>${d.identifications[0] ? claimFoot(d.identifications[0]) : ""}`;
  }

  // A small sky for the link to the second page: him at the centre, everyone named beside him around.
  function skyTeaser(d) {
    const n = d.rows.length, cx = 120, cy = 80;
    return `<svg class="sky-teaser" viewBox="0 0 240 160" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="58" class="st-ring"/><circle cx="${cx}" cy="${cy}" r="34" class="st-ring"/>
      ${d.rows.map((r, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2, rr = r.twelve ? 34 : 58; const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="st-line"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.6 + Math.min(4, r.n * .35)).toFixed(1)}" class="st-dot"/>`; }).join("")}
      <circle cx="${cx}" cy="${cy}" r="7" class="st-me"/></svg>`;
  }

  function mount(host, d) {
    host.innerHTML = (d.objects.length ? cabinetHTML(d) : listsHTML(d))
      + `<div class="wrap"><section class="sec">${secHead("", "Open questions", "What readers still <em>ask</em>", "The questions this page cannot settle, with the answers given and who gives them. Choose a question.")}<div class="q-host"></div></section>
        <a class="b-next" href="${secondPageHref()}">${skyTeaser(d)}<span><span class="kicker">Second page</span><b>Everyone around ${esc(d.short)}, on one sky</b><small>${d.rows.length} people, ${d.places.filter((p) => p.ll).length} places, ${d.scripture.length - d.entries.filter((e) => e.type === "fact").length} moments and his own words, joined by the verses that name them together.</small></span>${icon("arrowRight", 20)}</a></div>`;
    host.addEventListener("click", (e) => {
      const o = e.target.closest("[data-obj]"); if (o) { const i = Number(o.dataset.obj); Sheet.open(objectSheet(d, d.objects[i], i)); return; }
      const l = e.target.closest("[data-list]"); if (l) Sheet.open(listSheet(d, Number(l.dataset.list)));
    });
    return Questions.mount(host.querySelector(".q-host"), d);
  }
  return { mount };
})();
