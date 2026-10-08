// The chapters, cinema style (the Moses cinema containers): I before the call, II with Jesus (or the call), III the
// church in Acts, IV after Scripture (tradition, dashed). Each chapter is one large screen with its giant numeral
// behind, a sky of faint stars above and a line-art landscape beneath; its scenes slide sideways, each with a large
// drawing and the record's own verse, people and places. The side rail of dots finds a chapter.
window.Cinema = (() => {
  const { P, stars, hills, water, walls, svg } = Kit;
  const ground = (period) => {
    if (period === 3) return svg("0 0 1600 120", hills(70, 26, 61, 0, 1600, "g", 0) + walls(980, 96, 300, 34, .05) + P("M1060 62V40H1200V62", "f", .1) + P("M0 110H1600", "f", 0), "cn-land");
    if (period === 4) return svg("0 0 1600 120", hills(80, 20, 62, 0, 1600, "g", 0) + [200, 520, 900, 1260].map((x, i) => P(`M800 120Q${(800 + x) / 2} ${90 - i * 6} ${x} ${60 + i * 4}`, "dash", .1)).join("") + P("M0 110H1600", "f", 0), "cn-land");
    return svg("0 0 1600 120", hills(60, 30, 63 + period, 0, 1600, "g", 0) + hills(76, 16, 64 + period, 0, 1600, "f", .05) + water(0, 1600, 90, 118, 3, 65, "w", .1), "cn-land");
  };
  const skyDots = (seed) => svg("0 0 1600 200", stars(60, seed, [0, 0, 1600, 200], 0), "cn-sky");

  function facts(d, e) {
    const names = Object.keys(e.with ?? {}).map((k) => d.rowByKey[k]?.name).filter(Boolean);
    const places = e.places.map((i) => d.places[i]?.name).filter(Boolean);
    const books = [...new Set(e.refs.map(([a]) => bookName(chapterOf(a).book)))];
    const rows = [
      names.length && ["Named with him", names.slice(0, 6).join(", ") + (names.length > 6 ? ` and ${names.length - 6} more` : "")],
      places.length && ["Where", places.join(", ")],
      e.h && ["In the harmony", `§${e.h.n} · ${e.h.title}`],
      e.refs.length && [books.length > 1 ? `Told in ${books.length} books` : "Passage", refList(e.refs, 4)],
    ].filter(Boolean);
    return rows.length ? `<dl class="cn-facts">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${k === "Passage" || k.startsWith("Told") ? v : esc(v)}</dd></div>`).join("")}</dl>` : "";
  }
  function slide(d, s) {
    const e = d.byKey[s.entry], v = s.v ? { id: s.v, text: d.verses[s.v] } : null;
    return `<div class="cn-slide" data-entry="${esc(e.key)}">
      <div class="cn-text"><p class="kicker">${icon(e.icon, 14)}${esc(LAYER[e.layer] ?? "")}${e.refs[0] ? ` · ${esc(refText(e.refs[0]))}` : ""}</p>
        <h3 class="cn-title">${esc(e.title)}</h3>
        ${v?.text ? `<blockquote class="cn-verse"><p>${markNames(v.text, d.names)}</p><footer>${refLink([v.id, v.id])} · KJV</footer></blockquote>` : ""}
        ${e.text && e.text !== e.title ? `<p class="cn-what">${esc(e.text)}</p>` : ""}
        ${facts(d, e)}
        <div class="cn-actions"><button type="button" class="cn-more" data-open="${esc(e.key)}">${icon("layers", 15)}Read it all<small>${e.refs.length ? plural(e.refs.length, "passage") : "with its sources"}</small></button></div></div>
      <div class="cn-art">${svg("0 0 400 260", (SCENES[s.art] ?? SCENES.horizon)(), "scene")}</div></div>`;
  }
  function emptySlide(d, ch) {
    const lines = (d.notSaid ?? []).filter((t) => /home|trade|family|came from|Gospels|name/i.test(t)).slice(0, 2);
    const names = (d.lists ?? []).map((l) => `<li><b>${esc(l.name)}</b> ${refLink(l.span)}</li>`).join("");
    return `<div class="cn-slide"><div class="cn-text"><p class="kicker">${icon("silence", 14)}${esc(d.periods[0].sub)}</p><h3 class="cn-title">Scripture gives no home, trade or family for him</h3>
      ${lines.map((t) => `<p class="cn-what">${esc(t)}</p>`).join("")}${names ? `<p class="kicker cn-k">How each list names him</p><ul class="cn-names">${names}</ul>` : ""}</div>
      <div class="cn-art">${svg("0 0 400 260", SCENES.silence(), "scene")}</div></div>`;
  }
  function afterSlide(d) {
    const sc = d.ending.scripture.map((c) => `<li><p>${esc(c.text)}</p>${claimFoot(d, c)}</li>`).join("");
    const ladder = d.trad.map((t) => `<li><button type="button" data-open="${esc(t.key)}"><span class="ld-when">${esc(whenShort(t.when))}</span><span class="ld-who">${esc(t.who)}</span>${layerChip(t.layer)}</button></li>`).join("");
    return `<div class="cn-slide cn-after"><div class="cn-text"><p class="kicker">${icon("scroll", 14)}Scripture first</p><h3 class="cn-title">What Scripture says of his end</h3><ul class="cn-ending">${sc}</ul></div>
      <div class="cn-ladder"><p class="kicker">${icon("tradition", 14)}Then tradition · ${plural(d.trad.length, "source")}, earliest first</p><ol>${ladder}</ol>
        <p class="plain-line">Each is labelled with who said it and when; none is blended into Scripture.</p></div></div>`;
  }

  function mount(host, d) {
    const chapters = d.chapters.map((ch) => ({ ...ch, slides: ch.slides.length ? ch.slides.map((s) => slide(d, s)) : [emptySlide(d, ch)] }));
    chapters.push({ n: "IV", period: 4, title: "After Scripture", slides: [afterSlide(d)] });
    const wrap = document.createElement("div");
    wrap.className = "cn"; wrap.dataset.sec = "chapters";
    wrap.innerHTML = chapters.map((ch) => {
      const p = d.periods[ch.period - 1], n = p.entries.length;
      return `<section class="cn-chapter ${ch.period === 4 ? "trad" : ""}" data-chapter="${ch.period}" style="--tone:${PERIOD_TONE[ch.period]}" aria-label="Chapter ${ch.n}: ${esc(ch.title)}">
        ${skyDots(70 + ch.period)}<div class="cn-bgnum" aria-hidden="true">${ch.n}</div>
        <header class="cn-head"><p class="kicker">Chapter ${ch.n} · ${esc(p.title)}</p><h2>${esc(ch.title)}</h2><p class="sub">${esc(p.sub)} · ${n ? plural(n, ch.period === 4 ? "source" : "record") : "nothing recorded"}</p></header>
        <div class="cn-viewport"><div class="cn-track" style="--x:0">${ch.slides.join("")}</div></div>
        ${ch.slides.length > 1 ? `<div class="cn-nav"><button type="button" class="cn-arrow" data-step="-1" aria-label="Previous scene">${icon("arrowLeft", 18)}</button>
          <div class="cn-dots">${ch.slides.map((_, i) => `<button type="button" data-go="${i}" aria-label="Scene ${i + 1}" ${i === 0 ? 'aria-current="true"' : ""}></button>`).join("")}</div>
          <span class="cn-count"><b>1</b> / ${ch.slides.length}</span><button type="button" class="cn-arrow" data-step="1" aria-label="Next scene">${icon("arrowRight", 18)}</button></div>` : ""}
        ${ground(ch.period)}</section>`;
    }).join("") + `<nav class="cn-rail" aria-label="Chapters">${chapters.map((ch) => `<a href="#" data-jump="${ch.period}"><i></i><span>${ch.n} · ${esc(ch.title)}</span></a>`).join("")}</nav>`;
    host.append(wrap);

    const state = new Map();
    const replot = (slideEl) => { const a = slideEl?.querySelector(".cn-art svg"); if (!a) return; a.classList.remove("plot"); void a.getBBox; requestAnimationFrame(() => a.classList.add("plot")); };
    const slideTo = (ch, to) => {
      const track = ch.querySelector(".cn-track"), slides = [...track.children];
      to = Math.max(0, Math.min(slides.length - 1, to));
      if (state.get(ch) === to) return;
      state.set(ch, to);
      track.style.setProperty("--x", String(to));
      ch.querySelectorAll(".cn-dots button").forEach((b, i) => b.toggleAttribute("aria-current", i === to));
      const count = ch.querySelector(".cn-count b"); if (count) count.textContent = String(to + 1);
      replot(slides[to]);
    };
    const rail = wrap.querySelector(".cn-rail");
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const ch = en.target; rail.querySelectorAll("a").forEach((a) => a.toggleAttribute("aria-current", a.dataset.jump === ch.dataset.chapter));
      if (!ch.dataset.seen) { ch.dataset.seen = "1"; replot(ch.querySelector(".cn-slide")); state.set(ch, 0); }
    }), { threshold: .35 });
    wrap.querySelectorAll(".cn-chapter").forEach((c) => io.observe(c));
    const railIo = new IntersectionObserver(([en]) => rail.classList.toggle("show", en.isIntersecting), { threshold: 0 });
    railIo.observe(wrap);
    wrap.addEventListener("click", (e) => {
      const ch = e.target.closest(".cn-chapter");
      const step = e.target.closest("[data-step]"); if (step && ch) { slideTo(ch, (state.get(ch) ?? 0) + Number(step.dataset.step)); return; }
      const go = e.target.closest("[data-go]"); if (go && ch) { slideTo(ch, Number(go.dataset.go)); return; }
      const jump = e.target.closest("[data-jump]"); if (jump) { e.preventDefault(); wrap.querySelector(`[data-chapter="${jump.dataset.jump}"]`)?.scrollIntoView({ behavior: "smooth" }); return; }
      const o = e.target.closest("[data-open]"); if (o) { const en = d.byKey[o.dataset.open]; Sheet.open(entrySheet(d, en), PERIOD_TONE[en.period]); }
    });
    const onKey = (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const ch = [...wrap.querySelectorAll(".cn-chapter")].find((c) => { const r = c.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
      if (ch) slideTo(ch, (state.get(ch) ?? 0) + (e.key === "ArrowRight" ? 1 : -1));
    };
    let sx = null;
    const onDown = (e) => { if (e.target.closest(".cn-viewport")) sx = [e.clientX, e.clientY, e.target.closest(".cn-chapter")]; };
    const onSwipeMove = (e) => {
      if (!sx) return; const dx = e.clientX - sx[0], dy = e.clientY - sx[1];
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { getSelection()?.removeAllRanges(); document.documentElement.classList.add("no-select"); }
    };
    const onUp = (e) => { document.documentElement.classList.remove("no-select"); if (!sx) return; const dx = e.clientX - sx[0], dy = e.clientY - sx[1]; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) slideTo(sx[2], (state.get(sx[2]) ?? 0) + (dx < 0 ? 1 : -1)); sx = null; };
    addEventListener("keydown", onKey); wrap.addEventListener("pointerdown", onDown); addEventListener("pointermove", onSwipeMove); addEventListener("pointerup", onUp); addEventListener("pointercancel", onUp);
    return () => { io.disconnect(); railIo.disconnect(); removeEventListener("keydown", onKey); removeEventListener("pointermove", onSwipeMove); removeEventListener("pointerup", onUp); removeEventListener("pointercancel", onUp); };
  }
  return { mount };
})();
