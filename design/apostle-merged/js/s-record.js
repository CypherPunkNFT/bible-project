// 01 · How much does Scripture tell? (the record ring) and 02 · Where is he named? (the chapter grid).
window.Record = (() => {
  // ── 01 · The ring, with the chosen part's records beside it ──
  function ring(host, d) {
    const sec = document.createElement("section");
    sec.className = "sec"; sec.dataset.sec = "ring";
    const told = d.scripture.filter((e) => e.type !== "fact").length;
    sec.innerHTML = `${secHead("01", "His life in four parts", "How much does Scripture <em>tell?</em>", `${esc(d.tagline)} Scripture gives no years for his life, so the ring is divided by how much is recorded: ${plural(told, "record")} of what he did or what was said to him, one bead each. The last part is tradition and is drawn dashed. Choose a part to read it.`)}
      <div class="a-ring"><div class="a-ring-art"></div><div class="a-ring-list"></div></div>`;
    host.append(sec);
    const art = sec.querySelector(".a-ring-art"), list = sec.querySelector(".a-ring-list");
    let sel = d.periods.slice(0, 3).reduce((best, p, i) => (p.entries.length > d.periods[best].entries.length ? i : best), 0) + 1;
    const draw = () => {
      art.innerHTML = Ring.svg(d, sel, { size: 440 });
      const p = d.periods[sel - 1], ents = p.entries.map((k) => d.byKey[k]);
      list.style.setProperty("--tone", PERIOD_TONE[sel]);
      list.innerHTML = `<p class="kicker">${p.n} · ${esc(p.sub)}</p><h3>${esc(p.title)}</h3>
        ${ents.length ? `<ol class="a-recs ${sel === 4 ? "trad" : ""} ${ents.length > 9 ? "two" : ""}">${ents.map((e) => `<li><button type="button" data-open="${esc(e.key)}"><span class="t">${esc(e.title)}</span><small>${e.type === "trad" ? esc(whenShort(e.when)) : e.refs[0] ? esc(refText(e.refs[0])) : ""}</small></button></li>`).join("")}</ol>`
          : `<p class="plain-line">${sel === 1 ? "Scripture gives no home, trade or family for him." : "Scripture records nothing here."}</p>`}`;
    };
    Ring.bind(art, d, (p, key) => { sel = p; draw(); if (key) Sheet.open(entrySheet(d, d.byKey[key]), PERIOD_TONE[p]); });
    list.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) Sheet.open(entrySheet(d, d.byKey[b.dataset.open]), PERIOD_TONE[sel]); });
    draw();
  }

  // ── 02 · The chapter grid ──
  const ROWS = ["MAT", "MRK", "LUK", "JHN", "ACT"];
  const entriesIn = (d, book, ch) => d.scripture.filter((e) => e.refs.some(([a, b = a]) => { const x = chapterOf(a), y = chapterOf(b); return x.book === book && ch >= x.ch && ch <= y.ch; }));
  function grid(host, d) {
    const sec = document.createElement("section");
    sec.className = "sec"; sec.dataset.sec = "grid";
    const alt = d.alt?.[0], heat = d.heat, altHeat = alt?.heat ?? {};
    const codes = [...new Set([...Object.keys(heat), ...Object.keys(altHeat)])];
    const meta = (c) => heat[c] ?? altHeat[c];
    const order = (c) => meta(c).num;
    const gospels = codes.filter((c) => ROWS.includes(c)).sort((a, b) => order(a) - order(b)), letters = codes.filter((c) => !ROWS.includes(c)).sort((a, b) => order(a) - order(b));
    const max = Math.max(1, ...Object.values(heat).flatMap((b) => Object.values(b.counts)), ...Object.values(altHeat).flatMap((b) => Object.values(b.counts)));
    const missing = ROWS.filter((c) => !codes.includes(c));
    const row = (code) => {
      const b = meta(code), n = b.chapters, mine = heat[code]?.counts ?? {}, other = altHeat[code]?.counts ?? {};
      const sum = Object.values(mine).reduce((x, y) => x + y, 0), osum = Object.values(other).reduce((x, y) => x + y, 0);
      return `<div class="heat-row" style="--tone:${BOOK_TONE(b.num)}"><span class="heat-book">${esc(b.name)}</span><div class="heat-cells">${Array.from({ length: n }, (_, i) => {
        const c = mine[i + 1] ?? 0, o = other[i + 1] ?? 0;
        return `<button type="button" class="cell ${c ? "on" : ""} ${o ? "alt" : ""}" style="--k:${(Math.max(c, o * .6) / max).toFixed(3)}" data-b="${code}" data-c="${i + 1}" aria-label="${esc(b.name)} ${i + 1}: ${c} verses${o ? `, ${o} naming ${esc(alt.name)}` : ""}">${c >= Math.max(3, max * .45) ? `<i>${c}</i>` : ""}</button>`;
      }).join("")}</div><span class="heat-sum">${sum}${osum ? `<small>+${osum}</small>` : ""}</span></div>`;
    };
    const verses = Object.values(heat).reduce((n, b) => n + Object.values(b.counts).reduce((x, y) => x + y, 0), 0);
    const chapters = Object.values(heat).reduce((n, b) => n + Object.keys(b.counts).length, 0);
    sec.innerHTML = `${secHead("02", "Chapter by chapter", "Where is he <em>named?</em>", `One square for each chapter of the books that name ${esc(d.short)}: ${plural(verses, "verse")} in ${plural(chapters, "chapter")}. The darker the square, the more verses in it name him.${alt ? ` Squares with a dashed edge name ${esc(alt.name)}, who is ${esc(d.short)} only if the two are one man (see the questions below).` : ""} Choose a chapter to read what happens there.`)}
      <div class="heat-wrap"><div class="heat-scroll"><div class="heat">${gospels.length ? `<p class="heat-group">The Gospels and Acts</p>${gospels.map(row).join("")}` : ""}${letters.length ? `<p class="heat-group">The letters and Revelation</p>${letters.map(row).join("")}` : ""}</div></div>
        <aside class="heat-now" aria-live="polite"></aside></div>
      <div class="heat-foot"><div class="heat-key"><span>Fewer</span>${[0, .15, .35, .6, 1].map((k) => `<i style="--k:${k}" class="${k ? "on" : ""}"></i>`).join("")}<span>More verses name him</span>${alt ? `<i class="alt" style="--k:.4"></i><span>names ${esc(alt.name)}</span>` : ""}</div>
        ${missing.length ? `<p class="heat-others">No verse in ${missing.map((c) => ({ MAT: "Matthew", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts" })[c]).join(", ").replace(/, ([^,]*)$/, " or $1")} names him.</p>` : ""}</div>`;
    host.append(sec);
    const now = sec.querySelector(".heat-now");
    const show = (code, ch) => {
      const b = meta(code), mineV = heat[code]?.first[ch], altV = altHeat[code]?.first[ch], v = mineV ?? altV, ents = entriesIn(d, b.num, ch);
      sec.querySelectorAll(".cell").forEach((x) => x.classList.toggle("sel", x.dataset.b === code && Number(x.dataset.c) === ch));
      now.style.setProperty("--tone", BOOK_TONE(b.num));
      now.innerHTML = `<p class="kicker">${esc(b.name)} ${ch}</p><h3>${plural(heat[code]?.counts[ch] ?? 0, "verse")} name him${altHeat[code]?.counts[ch] ? `; ${plural(altHeat[code].counts[ch], "verse")} name ${esc(alt.name)}` : ""}</h3>
        ${v ? `<blockquote><p>${markNames(d.verses[v] ?? "", d.names)}</p><footer>${refLink([v, v])} · ${mineV ? "the first verse here that names him" : `names ${esc(alt.name)}`}</footer></blockquote>` : `<p class="plain-line">No verse in this chapter names him.</p>`}
        ${ents.length ? `<p class="kicker heat-k">What happens here</p><ul class="heat-ents">${ents.map((e) => `<li><button type="button" data-open="${esc(e.key)}">${icon(e.icon, 15)}<span>${esc(e.title)}</span></button></li>`).join("")}</ul>` : ""}
        <a class="read" href="/read/kjv/${bookCode(b.num)}/${ch}">${icon("open", 13)}Read ${esc(b.name)} ${ch}</a>`;
    };
    sec.addEventListener("pointermove", (e) => {
      const c = e.target.closest(".cell"); if (!c) { Tip.hide(); return; }
      const code = c.dataset.b, ch = Number(c.dataset.c), b = meta(code), ents = entriesIn(d, b.num, ch);
      Tip.show(`<b>${esc(b.name)} ${ch}</b><small>${plural(heat[code]?.counts[ch] ?? 0, "verse")} name him${altHeat[code]?.counts[ch] ? ` · ${altHeat[code].counts[ch]} name ${esc(alt.name)}` : ""}</small>${ents.length ? `<small>${ents.slice(0, 3).map((x) => esc(x.title)).join(" · ")}</small>` : ""}`, e.clientX, e.clientY);
    });
    sec.addEventListener("pointerleave", () => Tip.hide());
    sec.addEventListener("click", (e) => {
      const c = e.target.closest(".cell"); if (c) { show(c.dataset.b, Number(c.dataset.c)); return; }
      const o = e.target.closest("[data-open]"); if (o) Sheet.open(entrySheet(d, d.byKey[o.dataset.open]), PERIOD_TONE[d.byKey[o.dataset.open].period]);
    });
    let best = null;
    for (const code of codes) for (const [ch, n] of Object.entries(heat[code]?.counts ?? altHeat[code]?.counts ?? {})) if (!best || n > best[2] || (n === best[2] && ROWS.includes(code) && !ROWS.includes(best[0]))) best = [code, Number(ch), n];
    if (best) show(best[0], best[1]);
  }
  return { ring, grid };
})();
