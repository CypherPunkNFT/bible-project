// The hero (the instrument: twelve strings, one per psalm whose title names a moment) and the duet (the record on the
// left, his voice on the right, joined by strings that sound as each moment reaches the middle of the screen).
(() => {
  const psalmOrder = () => {
    const order = D.movements.flatMap((m) => m.moments.map((x) => x.id));
    return [...D.psalms].sort((a, b) => order.indexOf(a.links[0]) - order.indexOf(b.links[0]) || b.links.length - a.links.length);
  };
  const titleOf = (p) => {
    const i = p.title.indexOf(p.because);
    const echo = new Set(p.echo);
    if (i < 0) return echoMark(p.title, echo);
    return `${echoMark(p.title.slice(0, i), echo)}<b class="because">${echoMark(p.because, echo)}</b>${echoMark(p.title.slice(i + p.because.length), echo)}`;
  };
  const momentRefs = (m) => m.claim?.refs ?? m.refs ?? m.verses?.map((v) => v.ref) ?? [];

  // ── Hero ──────────────────────────────────────────────────────────────────────────────────────────────────────────
  function hero() {
    const a = D.about, ps = psalmOrder();
    const row = (p) => {
      const m = D.momentById[p.links[0]];
      const echo = new Set(p.echo), hits = (v) => (echoMark(v.text, echo).match(/class="echo"/g) ?? []).length;
      const best = (m.verses ?? []).reduce((a, v) => (!a || hits(v) > hits(a) ? v : a), null);
      const ref = best?.ref ?? momentRefs(m)[0];
      return `<button type="button" class="hs${p.loose ? " is-loose" : ""}" data-psalm="${p.n}" aria-label="Psalm ${p.n}: ${esc(p.because)}. Sound its string and go to the moment.">
        <span class="hs-l"><b>${esc(refText(ref, true).split("–")[0])}</b><span>${esc(m.label)}${p.links.length > 1 ? ` <em>+${p.links.length - 1}</em>` : ""}</span></span>
        <i class="hs-a"></i><span class="hs-mid">${esc(p.because)}</span><i class="hs-b"></i>
        <span class="hs-r"><b>Psalm ${p.n}</b></span></button>`;
    };
    return `<section class="hero" id="top">
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="wrap">
        <div class="topline"><a href="/study/people?view=rulers">${icon("arrowLeft", 15)}Back to Rulers through time</a>
          <nav class="pill" aria-label="Page"><a href="/people/david-rut-4-17">The person</a><a href="#top" aria-current="page">${icon("crown", 15)}The reign</a></nav></div>
        <p class="kicker hero-k">${esc(a.title)} <span>·</span> ${esc(a.house)} <span>·</span> Tribe of ${esc(a.tribe)}</p>
        <h1 class="name" aria-label="David"><span class="n-rec" aria-hidden="true">Da</span><span class="n-voc" aria-hidden="true">vid</span></h1>
        <div class="epi">
          <p class="epi-rec"><small>The record</small>the anointed of the God of Jacob,</p>
          <i class="epi-axis" aria-hidden="true"></i>
          <p class="epi-voc"><small>His voice</small>and the sweet psalmist of Israel</p>
        </div>
        <p class="epi-ref">“${esc(D.epigraph.text)}” <a class="ref" href="${refHref(D.epigraph.ref)}">${esc(refText(D.epigraph.ref))}</a> · KJV</p>
        <div class="harp" id="harp">
          <div class="harp-head"><span>Where the record tells it</span><span>${icon("strings", 16)}Twelve strings</span><span>Where he sings it</span></div>
          ${ps.map(row).join("")}
        </div>
        <p class="harp-note">${icon("info", 16)}<span>Twelve psalms carry a title that names a moment in his life. Each string runs from that moment to its psalm. <b>The link comes from the psalm's own title</b>, and where those titles came from is debated. Touch a string to sound it and go to the moment.</span></p>
      </div>
    </section>`;
  }

  // ── The duet ──────────────────────────────────────────────────────────────────────────────────────────────────────
  function momentBlock(m, linked) {
    const [ico, kindName] = KIND[m.kind] ?? KIND.other;
    const echo = new Set(linked.flatMap((p) => p.echo));
    const refs = momentRefs(m);
    const body = linked.length
      ? `${m.claim ? `<p class="mo-text">${esc(m.claim.text)}</p>` : ""}${(m.verses ?? []).map((v) => kjvLine(v, echo, "kjv-rec")).join("")}`
      : `${m.claim ? `<p class="mo-text">${esc(m.claim.text)}</p>` : (m.verses ?? []).map((v) => kjvLine(v, null, "kjv-rec")).join("")}`;
    return `<article class="mo ${linked.length ? "is-linked" : "is-rest"}" id="m-${m.id}" data-kind="${m.kind}">
      <div class="mo-ico" title="${esc(kindName)}">${icon(ico, linked.length ? 26 : 20, 1.5)}</div>
      <div class="mo-body">
        <div class="mo-tags">${bookTags(refs)}${m.place ? `<span class="mo-place">${icon("pin", 12)}${esc(m.place)}</span>` : ""}${m.year ? `<span class="mo-year">Year ${m.year} of the reign</span>` : ""}</div>
        <h4>${esc(m.label)}</h4>
        ${body}
        <footer>${chip(m.claim ? (m.claim.layer ?? "story") : "scripture")}<span class="refs">${refList(refs, true)}</span>
          ${linked.length ? `<span class="mo-sung">${icon("lyre", 14)}${linked.map((p) => `Psalm ${p.n}`).join(" · ")}</span>` : ""}</footer>
      </div>
      <i class="mo-dot" aria-hidden="true"></i>
    </article>`;
  }
  function psalmCard(p) {
    const lines = p.lines;
    const span = [lines[0].ref[0], lines[0].ref[0]];
    return `<article class="ps${p.loose ? " is-loose" : ""}" id="ps-${p.n}" data-psalm="${p.n}" tabindex="-1">
      <i class="ps-dot" aria-hidden="true"></i>
      <header><span class="ps-n" aria-hidden="true">${p.n}</span><div><small>Psalm ${p.n} · its title</small><p class="ps-title">${titleOf(p)}</p></div></header>
      <p class="ps-line">${esc(lines[0].text)}</p>
      ${p.note ? `<p class="ps-note">${icon(p.loose ? "split" : "info", 16)}<span>${esc(p.note)}</span></p>` : ""}
      <footer>${chip("title")}<a class="ref" href="${refHref(span)}">${esc(refText(span))}</a> · KJV<a class="read" href="/read/kjv/PSA/${p.n}">${icon("open", 14)}Read Psalm ${p.n}</a></footer>
    </article>`;
  }
  const legend = () => {
    const line = (dash, loose) => `<svg viewBox="0 0 120 14" class="lg-svg" aria-hidden="true"><defs><linearGradient id="lg-${dash}${loose}" x1="0" x2="1"><stop offset="0" class="stop-a"/><stop offset="1" class="stop-b"/></linearGradient></defs>
      ${loose ? '<path d="M114 7 C 90 7, 80 7, 52 7" stroke="var(--voc)" stroke-dasharray="2 5" fill="none" stroke-width="1.6"/><circle cx="114" cy="7" r="4" fill="var(--voc)"/>'
        : `<path d="M6 7 C 40 2, 80 12, 114 7" stroke="url(#lg-${dash}${loose})" ${dash ? 'stroke-dasharray="9 4"' : ""} fill="none" stroke-width="1.8"/><circle cx="6" cy="7" r="4" fill="var(--rec)"/><circle cx="114" cy="7" r="4" fill="var(--voc)"/>`}</svg>`;
    return `<aside class="duet-legend glass" aria-label="How to read the strings"><p class="kicker">How to read it</p><ul>
      <li>${line(0, 0)}<span><b>A string</b>: the psalm's title names this moment.</span></li>
      <li>${line(1, 0)}<span><b>Long dashes</b>: the title fits two moments, so the string touches both.</span></li>
      <li>${line(0, 1)}<span><b>Left untied</b>: the title names a place, not a moment.</span></li>
      <li><span class="lg-echo"><mark class="echo">watched</mark> <mark class="echo">the house</mark></span><span><b>Echo words</b>: words the title shares with the passage light up when the string sounds.</span></li>
      <li class="lg-rest"><span class="lg-gap"></span><span><b>A rest</b>: the record waits while he sings, so the strings stay level.</span></li></ul></aside>`;
  };
  function duet() {
    const byFirst = (id) => D.psalms.filter((p) => p.links[0] === id);
    const linkedTo = (id) => D.psalms.filter((p) => p.links.includes(id));
    const blocks = D.movements.map((mv) => `<div class="mv" id="mv-${mv.id}">
        <header class="mv-head"><span class="mv-n">${mv.n}</span><div><h3>${esc(mv.title)}</h3><p>${esc(mv.sub)} <span>${esc(mv.span)}</span></p></div></header>
        <div class="mv-rec">${mv.moments.map((m) => momentBlock(m, linkedTo(m.id))).join("")}</div>
        <div class="mv-voc">${mv.moments.flatMap((m) => byFirst(m.id)).map(psalmCard).join("")}</div>
      </div>`).join("");
    const linkedCount = new Set(D.psalms.flatMap((p) => p.links)).size;
    const total = D.movements.reduce((n, m) => n + m.moments.length, 0);
    return `<section class="duet-sec" id="duet">
      <div class="wrap">
        <div class="duet-top"><div class="sec-intro">
          <p class="kicker">${icon("strings", 16)}Two voices</p>
          <h2>The record tells his life. <em>His songs answer it.</em></h2>
          <p class="lead">His life and reign moment by moment, in the order Samuel, Kings and Chronicles tell it: ${total} moments. Where a psalm's title names the moment, a string runs across to it. It sounds as the moment reaches the middle of your screen. ${linkedCount} moments have a psalm; the rest are the record alone.</p>
          <div class="duet-tools"><button type="button" class="tool" id="sound-all">${icon("play", 15)}Sound every string</button>
            <button type="button" class="tool" id="only-linked" aria-pressed="false">${icon("strings", 15)}Only the moments he sang</button></div>
        </div>${legend()}</div>
      </div>
      <div class="duet-bar"><div class="wrap"><span class="db-rec">${icon("scroll", 16)}The record <small>Samuel · Kings · Chronicles</small></span>
        <span class="db-count"><b id="sung-n">0</b>/12 sounded</span>
        <span class="db-voc"><small>Psalms whose title names the moment</small>His voice ${icon("lyre", 16)}</span></div></div>
      <div class="wrap"><div class="duet" id="duet-host"><i class="d-spine" aria-hidden="true"></i>${blocks}</div></div>
    </section>`;
  }

  // ── Behaviour ─────────────────────────────────────────────────────────────────────────────────────────────────────
  let harpLayer, duetLayer;
  const sounded = new Set();
  function markSounded(p) {
    sounded.add(p.n);
    const n = document.getElementById("sung-n");
    if (n) n.textContent = String(sounded.size);
  }
  function soundPsalm(p, { scroll = false } = {}) {
    const ids = [...p.links.map((l) => `d-${p.n}-${l}`), `h-${p.n}`];
    const card = document.getElementById(`ps-${p.n}`);
    const moments = p.links.map((l) => document.getElementById(`m-${l}`));
    const els = [card, ...moments].filter(Boolean);
    markSounded(p);
    Strings.pluck(ids, `Psalm ${p.n} sounds against ${p.links.map((l) => D.momentById[l].label).join(" and ")}`, {
      onStart: () => els.forEach((e) => e.classList.add("is-sounding", "is-sounded")),
      onSettle: () => els.forEach((e) => e.classList.remove("is-sounding")),
    });
    if (scroll && moments[0]) moments[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Desktop: each psalm card sits level with its moment, pushed down only if the card above is in the way.
  // Phone: each card follows its moment in the one column.
  let mode = "";
  function place() {
    const wide = matchMedia("(min-width: 900px)").matches;
    const next = wide ? "wide" : "narrow";
    if (next !== mode) {
      mode = next;
      const lastAfter = {};
      for (const p of D.psalms) {
        const card = document.getElementById(`ps-${p.n}`);
        const mv = D.momentById[p.links[0]].movement;
        if (wide) document.querySelector(`#mv-${mv} .mv-voc`).append(card);
        else { const anchor = lastAfter[p.links[0]] ?? document.getElementById(`m-${p.links[0]}`); anchor.after(card); lastAfter[p.links[0]] = card; }
      }
    }
    document.querySelectorAll(".mo").forEach((m) => { m.style.marginBottom = ""; });
    if (wide) {
      // Each card sits level with its moment. When the voice is still singing as the next moment he sang arrives,
      // the record waits: a rest opens under the moment before it, so the strings stay level.
      for (const col of document.querySelectorAll(".mv-voc")) {
        let floor = 0, lastMoment = null;
        const top0 = col.getBoundingClientRect().top;
        for (const card of col.children) {
          const p = D.psalms.find((x) => `ps-${x.n}` === card.id);
          const m = document.getElementById(`m-${p.links[0]}`);
          let want = m.getBoundingClientRect().top - top0 - 6;
          const prev = m.previousElementSibling;
          if (want < floor && prev && m !== lastMoment) {
            prev.style.marginBottom = `${floor - want}px`;
            want = m.getBoundingClientRect().top - top0 - 6;
          }
          const y = Math.max(want, floor);
          card.style.top = `${y}px`;
          floor = y + card.offsetHeight + 18;
          lastMoment = m;
        }
        col.style.minHeight = `${floor}px`;
      }
    } else document.querySelectorAll(".ps").forEach((c) => { c.style.top = ""; });
    duetLayer?.layout();
  }

  function onScroll() {
    const mid = innerHeight * 0.5;
    for (const p of D.psalms) {
      const m = document.getElementById(`m-${p.links[0]}`);
      if (!m || m.offsetParent === null) continue;
      const r = m.getBoundingClientRect();
      const inBand = r.top < mid + 40 && r.bottom > mid - 40;
      if (inBand && !p._in) soundPsalm(p);
      p._in = inBand;
    }
  }

  function glissando() {
    const ps = psalmOrder();
    const strings = ps.map((p) => Strings.get(`h-${p.n}`)).filter(Boolean);
    const total = 4600;
    const drawSpan = (i) => [0.02 + i * 0.022, 0.3 + i * 0.022];
    const pluckAt = (i) => 0.42 + i * 0.038;
    Strings.run({
      label: "The twelve strings: drawn, then sounded in order", duration: total, strings,
      frame: (p) => strings.forEach((st, i) => {
        st.drawn = easeOut(span(p, ...drawSpan(i)));
        const t = (p - pluckAt(i)) * total;
        st.g.classList.toggle("is-sounding", t > 0 && Strings.envAt(st, t) > 0.4);
        Strings.drawAt(st, { t: t > 0 ? t : Infinity, drawn: st.drawn });
      }),
      moving: (p) => strings.flatMap((st, i) => {
        const d = span(p, ...drawSpan(i)), t = (p - pluckAt(i)) * total;
        if (d > 0 && d < 1) return [`${st.label} drawing (${Math.round(d * 100)}%)`];
        if (t > 0 && Strings.envAt(st, t) > 0.3) return [`${st.label} swinging ${Strings.envAt(st, t).toFixed(1)} px`];
        return [];
      }),
    });
  }

  window.Duet = {
    hero, duet,
    mount() {
      harpLayer = new Strings.Layer(document.getElementById("harp"), "harp-strings");
      for (const p of psalmOrder()) {
        const row = document.querySelector(`.hs[data-psalm="${p.n}"]`);
        harpLayer.add(row.querySelector(p.loose ? ".hs-b" : ".hs-a"), row.querySelector(p.loose ? ".hs-a" : ".hs-b"), { id: `h-${p.n}`, orient: "h", label: `Psalm ${p.n}`, loose: p.loose, reach: 0.7, cls: p.loose ? "loose" : "", drawn: 0, amp: 9, freq: 6 + (p.n % 5) });
      }
      const host = document.getElementById("duet-host");
      duetLayer = new Strings.Layer(host, "duet-strings");
      place();
      for (const p of D.psalms) {
        const dot = document.querySelector(`#ps-${p.n} .ps-dot`);
        for (const l of p.links) { const mo = document.querySelector(`#m-${l} .mo-dot`); duetLayer.add(p.loose ? dot : mo, p.loose ? mo : dot, { id: `d-${p.n}-${l}`, label: `Psalm ${p.n} ↔ ${D.momentById[l].label}`, loose: p.loose, reach: 0.5, maxLen: 120, cls: `${p.loose ? "loose" : ""} ${p.links.length > 1 ? "fork" : ""}`, freq: 7 + (p.n % 4) }); }
      }
      document.getElementById("harp").addEventListener("click", (e) => {
        const b = e.target.closest(".hs");
        if (b) soundPsalm(D.psalms.find((p) => String(p.n) === b.dataset.psalm), { scroll: true });
      });
      document.getElementById("harp").addEventListener("pointerover", (e) => {
        const b = e.target.closest(".hs");
        if (!b || b.dataset.hot === "1") return;
        document.querySelectorAll(".hs[data-hot]").forEach((x) => delete x.dataset.hot);
        b.dataset.hot = "1";
        const st = Strings.get(`h-${b.dataset.psalm}`);
        if (st && st.drawn >= 1) Strings.pluck([st.id], `Psalm ${b.dataset.psalm}: its hero string`, { duration: 1800 });
      });
      host.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        const card = e.target.closest(".ps");
        const mo = e.target.closest(".mo.is-linked");
        const p = card ? D.psalms.find((x) => `ps-${x.n}` === card.id) : mo ? D.psalms.find((x) => x.links.includes(mo.id.slice(2))) : null;
        if (p) soundPsalm(p);
      });
      document.getElementById("sound-all").addEventListener("click", () => {
        const ids = psalmOrder().flatMap((p) => p.links.map((l) => `d-${p.n}-${l}`));
        D.psalms.forEach(markSounded);
        document.querySelectorAll(".ps, .mo.is-linked").forEach((e) => e.classList.add("is-sounded"));
        Strings.pluck(ids, "Every duet string, one after another", { duration: 2200, stagger: 160 });
      });
      document.getElementById("only-linked").addEventListener("click", (e) => {
        const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
        e.currentTarget.setAttribute("aria-pressed", String(on));
        host.classList.toggle("only-linked", on);
        requestAnimationFrame(place);
      });
      let raf = 0;
      addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; onScroll(); }); }, { passive: true });
      addEventListener("resize", () => requestAnimationFrame(place));
      new ResizeObserver(() => requestAnimationFrame(place)).observe(host);
      document.fonts?.ready.then(() => { place(); harpLayer.layout(); });
      glissando();
    },
  };
})();
