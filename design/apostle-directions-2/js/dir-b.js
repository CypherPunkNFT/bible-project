// B · Chapters. The owner's "ideal page" applied to an apostle: the life ring as the header; one detailed line-art
// scene on a slow loop under it; then four cinema chapters, one per part of the ring, each with a giant numeral and
// faint stars behind, scenes that slide sideways, and "See the map", which slides the globe in beside the chapter.
// Then the cabinet of things Scripture names around him, the questions as floating words, and a link to the
// second page (people.html: everyone around him on one sky).
(() => {
  // One scene of a chapter, from the spec: a fact, a record, Scripture's ending, or tradition's records.
  function slideData(d, s) {
    if (s.trad) {
      const recs = s.trad.map((i) => d.trad[i]).filter(Boolean);
      return { title: "What the early writers say", trad: recs, art: s.art, period: 4 };
    }
    if (s.ending) {
      const [kind, i] = s.ending.split("."), c = d.ending[kind][Number(i)];
      const v = c.refs?.[0]?.[0];
      const quote = c.text.match(/“([^”]+)”/)?.[1];
      return { title: quote ? `“${quote}”` : "What Scripture says", text: c.text, verse: v, layer: c.layer, refs: c.refs ?? [], art: s.art, period: 4 };
    }
    const e = d.byKey[s.entry ?? `fact.${s.fact}`];
    return { e, title: e.title, text: e.type === "moment" ? null : e.text, verse: s.verse ?? e.lead, layer: e.layer, refs: e.refs, art: s.art, period: e.period, with: e.with };
  }

  function slideHTML(d, ch, s, k, n) {
    const sd = slideData(d, s), p = d.periods[ch.period - 1];
    const names = sd.with ? Object.keys(sd.with).map((key) => d.rowByKey[key]?.name).filter(Boolean) : [];
    const body = sd.trad
      ? `<ol class="b-trad">${sd.trad.map((t) => `<li><p class="b-trad-who">${esc(whoShort(t.who))} <span>${esc(whenShort(t.when))}</span></p><p>${esc(t.text)}</p>${claimFoot({ layer: t.layer, cites: t.cites })}</li>`).join("")}</ol>`
      : `${sd.verse ? `<blockquote class="b-verse"><p>${markNames(vtext(sd.verse))}</p><footer>${esc(verseRef(sd.verse))} · KJV</footer></blockquote>` : ""}
         ${sd.text && sd.text !== sd.title ? `<p class="b-note">${esc(sd.text)}</p>` : ""}
         ${claimFoot({ layer: sd.layer, refs: sd.refs })}
         ${names.length ? `<p class="b-with">Named with him: ${names.slice(0, 6).map(esc).join(", ")}${names.length > 6 ? ` and ${names.length - 6} more` : ""}</p>` : ""}`;
    return `<div class="b-slide" data-k="${k}" data-art="${esc(sd.art)}">
      <div class="b-text"><p class="kicker">${p.n} · ${esc(p.title)} <span class="b-of">${k + 1} of ${n}</span></p>
        <h3 class="b-title">${esc(sd.title)}</h3>${body}
        <div class="b-actions"><button type="button" class="b-map-btn" data-map="${ch.period}">${icon("globe", 16)}See the map</button>${sd.e ? `<button type="button" class="b-read" data-open="${esc(sd.e.key)}">Read it all</button>` : ""}</div></div>
      <div class="b-art">${Art.scene(sd.art)}</div></div>`;
  }

  // Faint stars behind a chapter: a fixed scatter, different per chapter.
  function starsSVG(seed) {
    let s = seed * 9301 + 49297;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return `<svg class="b-stars" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${Array.from({ length: 90 }, () => `<circle cx="${(r() * 1000).toFixed(0)}" cy="${(r() * 600).toFixed(0)}" r="${(.5 + r() * 1.3).toFixed(2)}" style="animation-delay:${(-r() * 8).toFixed(1)}s"/>`).join("")}</svg>`;
  }

  function chapterHTML(d, ch) {
    const p = d.periods[ch.period - 1], n = ch.slides.length;
    return `<section class="b-ch ${ch.period === 4 ? "is-trad" : ""}" id="ch-${ch.period}" data-ch="${ch.period}" style="--tone:${PERIOD_TONE[ch.period]}">
      ${starsSVG(ch.period + d.who.length)}<div class="b-numeral" aria-hidden="true">${p.n}</div>
      <div class="b-ch-in">
        <header class="b-ch-head"><p class="kicker">Chapter ${p.n} · ${esc(p.title)}</p><h2>${esc(ch.title)}</h2><p class="b-ch-sub">${esc(p.sub)} · ${plural(p.entries.length, d.periods.indexOf(p) === 3 ? "source" : "record")}</p></header>
        <div class="b-viewport"><div class="b-track" style="--x:0">${ch.slides.map((s, k) => slideHTML(d, ch, s, k, n)).join("")}</div></div>
        ${n > 1 ? `<div class="b-nav"><button type="button" class="round" data-step="-1" aria-label="Previous scene">${icon("arrowLeft", 16)}</button>
          <div class="b-dots">${ch.slides.map((_, k) => `<button type="button" data-go="${k}" aria-label="Scene ${k + 1}" ${k ? "" : 'aria-current="true"'}></button>`).join("")}</div>
          <button type="button" class="round" data-step="1" aria-label="Next scene">${icon("arrowRight", 16)}</button></div>` : ""}
      </div>
      <aside class="b-map" aria-label="Map for chapter ${p.n}" aria-hidden="true"><div class="b-map-head"><p class="kicker">The map · ${esc(p.title)}</p><button type="button" class="round" data-closemap aria-label="Close the map">${icon("x", 15)}</button></div><div class="b-map-stage"></div></aside>
    </section>`;
  }

  // The dust field (dark mode only): slow, faint circles, warm on the left and blue on the right.
  function dust(host) {
    const cv = document.createElement("canvas");
    cv.className = "b-dust"; cv.setAttribute("aria-hidden", "true");
    host.prepend(cv);
    const motes = Array.from({ length: 70 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.8, a: .08 + Math.random() * .22, vx: (Math.random() - .5) * .006, vy: -.004 - Math.random() * .006, ph: i }));
    let raf = 0, visible = false, ctx = null, W = 0, H = 0;
    const size = () => { W = cv.clientWidth; H = cv.clientHeight; if (W && H) ctx = sizeCanvas(cv, W, H); };
    function frame(t) {
      raf = 0;
      if (!visible || !cv.isConnected) return;
      if (document.documentElement.dataset.theme === "dark" && ctx) {
        ctx.clearRect(0, 0, W, H);
        for (const m of motes) {
          m.x = (m.x + m.vx / 60 + 1) % 1; m.y = (m.y + m.vy / 60 + 1) % 1;
          const warm = 1 - m.x, a = m.a * (.7 + .3 * Math.sin(t / 1400 + m.ph));
          ctx.fillStyle = `rgba(${Math.round(120 + 110 * warm)}, ${Math.round(150 + 30 * warm)}, ${Math.round(230 - 120 * warm)}, ${a.toFixed(3)})`;
          ctx.beginPath(); ctx.arc(m.x * W, m.y * H, m.r, 0, Math.PI * 2); ctx.fill();
        }
      } else if (ctx) ctx.clearRect(0, 0, W, H);
      if (!REDUCED) raf = requestAnimationFrame(frame);
    }
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) { size(); raf = requestAnimationFrame(frame); } });
    io.observe(host);
    const stop = onResize(cv, size);
    return () => { io.disconnect(); stop(); cancelAnimationFrame(raf); };
  }

  DIRECTIONS.b = {
    mount(main, d) {
      const hero = d.hero, ring = Ring.svg(d, 2, { size: 460 });
      main.innerHTML = `<section class="b-hero"><div class="wrap">${topline()}
          <div class="b-hero-grid"><div class="b-hero-text"><p class="kicker">${esc(d.title)}</p><h1 class="b-name">${esc(d.short)}</h1><p class="b-tag">${esc(d.story ?? d.tagline)}</p>
            <ol class="b-periods">${d.periods.map((p, i) => `<li style="--tone:${PERIOD_TONE[i + 1]}"><a href="#ch-${i + 1}" data-jump="${i + 1}"><b>${p.n}</b><span>${esc(p.title)}<small>${esc(p.sub)}</small></span><em>${p.entries.length}</em></a></li>`).join("")}</ol></div>
          <div class="b-hero-ring">${ring}</div></div></div></section>
        <section class="b-scene" aria-label="A drawing">${Art.scene(hero.art, "b-scene-art")}<p class="b-scene-cap">${esc(hero.caption)} <span>${esc(refText(hero.ref))}</span></p></section>
        <div class="b-chapters">${d.chapters.map((ch) => chapterHTML(d, ch)).join("")}</div>
        <div class="b-after"></div>`;
      const stops = [];
      const chaptersEl = main.querySelector(".b-chapters");
      stops.push(dust(chaptersEl));
      // Ring and period list jump to their chapter.
      Ring.bind(main.querySelector(".b-hero-ring"), d, (p) => main.querySelector(`#ch-${p}`)?.scrollIntoView({ behavior: "smooth" }));
      main.querySelector(".b-periods").addEventListener("click", (e) => { const a = e.target.closest("[data-jump]"); if (a) { e.preventDefault(); main.querySelector(`#ch-${a.dataset.jump}`)?.scrollIntoView({ behavior: "smooth" }); } });

      // Slides: sideways, and each new scene draws itself again.
      const pos = new Map();
      const slideTo = (ch, k) => {
        const track = ch.querySelector(".b-track"), slides = [...track.children];
        k = Math.max(0, Math.min(slides.length - 1, k));
        if (pos.get(ch) === k) return;
        pos.set(ch, k);
        track.style.setProperty("--x", String(k));
        ch.querySelectorAll(".b-dots button").forEach((b, i) => b.toggleAttribute("aria-current", i === k));
        const art = slides[k].querySelector(".b-art");
        art.innerHTML = Art.scene(slides[k].dataset.art);
        slides.forEach((s, i) => s.toggleAttribute("inert", i !== k));
        if (ch.classList.contains("map-open")) openMap(ch);
      };
      chaptersEl.querySelectorAll(".b-ch").forEach((ch) => { pos.set(ch, 0); [...ch.querySelectorAll(".b-slide")].forEach((s, i) => s.toggleAttribute("inert", i !== 0)); });

      // The map pane: the one globe slides in beside the chapter, and back when the chapter scrolls away.
      function openMap(ch) {
        chaptersEl.querySelectorAll(".b-ch.map-open").forEach((c) => c !== ch && closeMap(c));
        const n = Number(ch.dataset.ch);
        ch.classList.add("map-open"); ch.querySelector(".b-map").setAttribute("aria-hidden", "false");
        Globe.attach(ch.querySelector(".b-map-stage"), { d, view: `p${n}`, period: n });
      }
      function closeMap(ch) { ch.classList.remove("map-open"); ch.querySelector(".b-map").setAttribute("aria-hidden", "true"); }
      const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (!en.isIntersecting) closeMap(en.target); }), { threshold: .15 });
      chaptersEl.querySelectorAll(".b-ch").forEach((c) => io.observe(c));
      stops.push(() => io.disconnect());

      chaptersEl.addEventListener("click", (e) => {
        const ch = e.target.closest(".b-ch"); if (!ch) return;
        const step = e.target.closest("[data-step]"); if (step) { slideTo(ch, pos.get(ch) + Number(step.dataset.step)); return; }
        const go = e.target.closest("[data-go]"); if (go) { slideTo(ch, Number(go.dataset.go)); return; }
        if (e.target.closest("[data-map]")) { ch.classList.contains("map-open") ? closeMap(ch) : openMap(ch); return; }
        if (e.target.closest("[data-closemap]")) { closeMap(ch); return; }
        const o = e.target.closest("[data-open]"); if (o) Sheet.open(entrySheet(d.byKey[o.dataset.open]), PERIOD_TONE[d.byKey[o.dataset.open].period]);
      });
      // Swipe sideways on a chapter.
      let sx = null;
      chaptersEl.addEventListener("pointerdown", (e) => { if (e.target.closest(".b-viewport")) sx = [e.clientX, e.clientY, e.target.closest(".b-ch")]; });
      const onUp = (e) => { if (!sx) return; const dx = e.clientX - sx[0], dy = e.clientY - sx[1]; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) slideTo(sx[2], pos.get(sx[2]) + (dx < 0 ? 1 : -1)); sx = null; };
      addEventListener("pointerup", onUp);
      const onKey = (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const ch = [...chaptersEl.querySelectorAll(".b-ch")].find((c) => { const r = c.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
        if (ch) slideTo(ch, pos.get(ch) + (e.key === "ArrowRight" ? 1 : -1));
      };
      addEventListener("keydown", onKey);
      stops.push(() => { removeEventListener("pointerup", onUp); removeEventListener("keydown", onKey); });

      stops.push(BCabinet.mount(main.querySelector(".b-after"), d));
      return () => stops.forEach((s) => s?.());
    },
  };
})();
