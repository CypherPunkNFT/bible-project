// A · 03 · Did their paths cross? Two lanes over his records in story order; every record whose verses name the
// other person is joined across, numbered, and listed below with the verse itself and the place, where the record
// names one. When the other person is Peter or Paul, the early writers who put the two together are listed too, dashed.
window.PathsCross = (() => {
  function mount(_container, d) {
    const el = document.createElement("section");
    el.className = "sec";
    const best = [...d.rows].sort((a, b) => b.n - a.n);
    let partner = d.rowByKey[d.pairDefault] ? d.pairDefault : best[0]?.key;
    el.innerHTML = `${secHead("03", "Two people side by side", "Did their paths <em>cross?</em>", `Choose someone named beside ${esc(d.short)}. Every record where a verse names them both is joined across and listed below with the verse itself.`)}
      <div class="pair-pick"><span class="pair-me">${esc(d.short)}</span><span class="and">and</span>
        <label class="picker"><select aria-label="The other person">${best.map((r) => `<option value="${r.key}">${esc(r.name)} (${r.n})</option>`).join("")}</select></label></div>
      <div class="suggest">${best.slice(0, 6).map((r) => `<button type="button" class="chip" data-k="${r.key}">${esc(r.name)}<small>${r.n}</small></button>`).join("")}</div>
      <p class="pair-say" aria-live="polite"></p><div class="pair-lanes"></div><ol class="cross-list"></ol>`;
    const lanes = el.querySelector(".pair-lanes"), list = el.querySelector(".cross-list"), say = el.querySelector(".pair-say"), select = el.querySelector("select");
    const cols = d.scripture;
    let width = 0;

    function draw() {
      if (!width || !partner) return;
      const r = d.rowByKey[partner], W = width, left = 110, step = (W - left - 10) / cols.length, X = (i) => left + step * (i + .5);
      const shared = cols.map((e, i) => (e.with[partner] ? i : -1)).filter((i) => i >= 0);
      const yA = 26, yB = 76, o = [];
      d.periods.slice(0, 3).forEach((p, pi) => {
        const idx = cols.map((e, i) => (e.period === pi + 1 ? i : -1)).filter((i) => i >= 0);
        if (idx.length) o.push(`<line class="pb" x1="${left + step * idx[0]}" x2="${left + step * idx[0]}" y1="6" y2="100"/><text class="pbt" x="${left + step * idx[0] + 4}" y="112">${p.n}</text>`);
      });
      o.push(`<text class="ln-l" x="0" y="${yA + 4}">${esc(d.short)}</text><text class="ln-l" x="0" y="${yB + 4}">${esc(r.name.split(" (")[0])}</text>`);
      o.push(`<line class="lane" x1="${left}" x2="${W - 10}" y1="${yA}" y2="${yA}"/><line class="lane b" x1="${left}" x2="${W - 10}" y1="${yB}" y2="${yB}"/>`);
      cols.forEach((e, i) => o.push(`<circle class="tick" cx="${X(i)}" cy="${yA}" r="2.2"/>`));
      shared.forEach((i, n) => o.push(`<g class="cross" data-i="${i}"><line x1="${X(i)}" x2="${X(i)}" y1="${yA}" y2="${yB}"/><circle cx="${X(i)}" cy="${yA}" r="4.5"/><circle class="${cols[i].writer === partner ? "wr" : ""}" cx="${X(i)}" cy="${yB}" r="4.5"/><text x="${X(i)}" y="${(yA + yB) / 2 + 4}" text-anchor="middle">${n + 1}</text></g>`));
      lanes.innerHTML = `<svg width="${W}" height="118" viewBox="0 0 ${W} 118" class="pair-svg">${o.join("")}</svg>`;

      // The sentence and the list.
      const name = r.name, writer = shared.filter((i) => cols[i].writer === partner).length;
      const other = WHO.find((w) => w !== d.who && WHO_NAME[w] === name);
      const trad = other ? d.trad.filter((t) => new RegExp(`\\b${WHO_NAME[other]}\\b`).test(t.text)) : [];
      say.innerHTML = shared.length
        ? `<b>${esc(d.short)}</b> and <b>${esc(name)}</b> are named together in ${plural(shared.length, "record")} of Scripture${writer ? `; in ${writer} of them ${esc(name)} is the writer, telling it himself` : ""}.${trad.length ? ` Early writers outside Scripture put them together ${trad.length} more ${trad.length === 1 ? "time" : "times"}, shown dashed.` : ""}`
        : `No record of ${esc(d.short)} in Scripture names ${esc(name)}.`;
      list.innerHTML = shared.map((i, n) => {
        const e = cols[i], v = e.with[partner][0], places = e.places.map((pi) => d.places[pi]?.name).filter(Boolean);
        return `<li><span class="n">${n + 1}</span><div><p class="t"><button type="button" data-open="${esc(e.key)}">${esc(e.title)}</button></p>
          <p class="meta">${ROMAN[e.period]} · ${esc(d.periods[e.period - 1].title)}${places.length ? ` · ${places.map(esc).join(", ")}` : ""}${e.writer === partner ? ` · ${esc(name)} writes it` : ""}</p>
          <blockquote>${markNames(vtext(v), [...d.names, name.split(/[ ,(]/)[0]])}<footer>${refLink([v, v])} · KJV</footer></blockquote></div></li>`;
      }).join("") + trad.map((t) => `<li class="trad"><span class="n">${icon("tradition", 16)}</span><div><p class="t">${esc(t.who)}</p><p class="meta">${esc(t.when)}</p><blockquote class="plain">${esc(t.text)}</blockquote>${claimFoot({ layer: t.layer, cites: t.cites })}</div></li>`).join("");
    }
    function choose(key) {
      if (!d.rowByKey[key]) return;
      partner = key; select.value = key;
      el.querySelectorAll(".suggest .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.k === key)));
      draw();
    }
    select.addEventListener("change", () => choose(select.value));
    el.querySelector(".suggest").addEventListener("click", (e) => { const c = e.target.closest("[data-k]"); if (c) choose(c.dataset.k); });
    el.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) Sheet.open(entrySheet(d.byKey[b.dataset.open]), PERIOD_TONE[d.byKey[b.dataset.open].period]); });
    lanes.addEventListener("pointermove", (e) => { const g = e.target.closest(".cross"); if (!g) { Tip.hide(); return; } const en = cols[Number(g.dataset.i)]; Tip.show(`<b>${esc(en.title)}</b><small>${en.refs[0] ? esc(refText(en.refs[0])) : ""}</small>`, e.clientX, e.clientY); });
    lanes.addEventListener("pointerleave", () => Tip.hide());
    requestAnimationFrame(() => { width = lanes.clientWidth; choose(partner); });
    onResize(lanes, (w) => { width = w; draw(); });
    return { el, choose };
  }
  return { mount };
})();
