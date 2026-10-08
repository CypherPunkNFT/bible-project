// F · In his hands. The objects Scripture names in Moses' life as a specimen cabinet (data/objects.json, every passage
// quoted from the KJV text files): drawn exhibits, a full view, a "through time" line, and the one object with a size.
(() => {
  let O = null;
  const load = async () => { if (O) return O; const res = await fetch("data/objects.json"); if (!res.ok) throw new Error(`objects.json: expected 200, got ${res.status}`); O = await res.json(); return O; };
  const CUBIT = 0.45, FIGURE = 1.7; // metres: a common convention for the cubit; the figure is for scale only
  const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
  const bookName = (id) => O.books[parts(id).book]?.name ?? M.books[parts(id).book]?.name;
  const no = (o) => `Nº ${String(o.no).padStart(2, "0")}`;
  const lastSeen = (o) => o.time[o.time.length - 1];
  const CAPTION = "Line drawing by this site, to show the parts the verses name. It is not a picture of the real object.";
  const fmtM = (m) => `${m.toFixed(2)} m`;
  const cubits = (n) => (n === 2.5 ? "2½" : n === 1.5 ? "1½" : String(n));

  const vitrine = (o, i) => `<button type="button" class="fo-case" data-open="${o.id}" style="--k:${i}">
      <span class="fo-case-light" aria-hidden="true"></span>
      <span class="fo-case-art">${objectArt(o.id)}</span>
      <span class="fo-case-label"><span class="fo-no">${no(o)}</span><b>${esc(o.name)}</b><span class="fo-span">${esc(refText(o.first.ref))}${parts(lastSeen(o)).book !== parts(o.first.ref[0]).book ? ` <i>→</i> ${esc(bookName(lastSeen(o)))}` : ""}</span>${o.dims ? '<span class="fo-measured">Measured in Scripture</span>' : ""}</span></button>`;

  // Through time: one lane per object across the books where any of them is named (others are left out).
  const segments = () => {
    const nums = Object.keys(O.books).map(Number).sort((a, b) => a - b), weight = (n) => (n >= 2 && n <= 5 ? 3.2 : 1), total = nums.reduce((s, n) => s + weight(n), 0);
    let x = 0; const seg = {};
    for (const n of nums) { seg[n] = { x0: x / total, w: weight(n) / total, ...O.books[n] }; x += weight(n); }
    return seg;
  };
  const tx = (seg, id) => { const p = parts(id), s = seg[p.book]; return s.x0 + s.w * ((p.ch - .5) / s.chapters); };
  const timeline = () => {
    const seg = segments(), pc = (v) => `${(v * 100).toFixed(2)}%`;
    return `<div class="fo-time" data-time>
      <div class="fo-time-books">${Object.entries(seg).map(([n, s]) => `<span style="left:${pc(s.x0)};width:${pc(s.w)}" class="${Number(n) >= 2 && Number(n) <= 5 ? "is-life" : ""}" title="${esc(s.name)}"><b>${esc(s.code.charAt(0) + s.code.slice(1).toLowerCase())}</b></span>`).join("")}</div>
      ${O.objects.map((o) => { const a = tx(seg, o.time[0]), b = tx(seg, lastSeen(o)); return `<button type="button" class="fo-lane" data-open="${o.id}"><span class="fo-lane-name"><i>${no(o)}</i>${esc(o.name)}</span>
        <span class="fo-lane-track"><span class="fo-lane-line" style="left:${pc(a)};width:${pc(Math.max(b - a, .002))}"></span>${o.time.map((t) => `<span class="fo-pt ${t === o.first.ref[0] ? "is-first" : ""}" style="left:${pc(tx(seg, t))}" data-t="${tx(seg, t).toFixed(4)}" title="${esc(refText([t]))}"></span>`).join("")}</span></button>`; }).join("")}
      <i class="fo-time-head" aria-hidden="true"></i></div>`;
  };

  // The one object Scripture measures: the ark of the covenant (Exodus 25:10), drawn to scale beside a standing figure.
  const scale = (units = "cubits") => {
    const o = O.objects.find((x) => x.dims), d = o.dims, px = 120, ground = 250; // 120 px per metre
    const L = d.length * CUBIT * px, B = d.breadth * CUBIT * px, H = d.height * CUBIT * px;
    const lab = (n) => (units === "cubits" ? `${cubits(n)} cubits` : `≈ ${fmtM(n * CUBIT)}`);
    const x0 = 250, x1 = x0 + L + 40;
    return `<svg class="fo-scale" viewBox="0 0 640 300" role="img" aria-label="The ark of the covenant to scale beside a standing figure">
      <line class="fo-ground" x1="20" y1="${ground}" x2="620" y2="${ground}"/>
      ${scaleFigure(100, ground, FIGURE * px)}<text class="fo-dim" x="100" y="${ground + 22}" text-anchor="middle">figure ${fmtM(FIGURE)}</text>
      <rect class="fo-box" x="${x0}" y="${ground - H}" width="${L}" height="${H}"/><line class="fo-crown" x1="${x0}" y1="${ground - H + 8}" x2="${x0 + L}" y2="${ground - H + 8}"/>
      <line class="fo-stave" x1="${x0 - 30}" y1="${ground - 18}" x2="${x0 + L + 30}" y2="${ground - 18}"/>
      <path class="fo-dimline" d="M${x0} ${ground - H - 18}H${x0 + L}M${x0} ${ground - H - 24}v12M${x0 + L} ${ground - H - 24}v12"/><text class="fo-dim" x="${x0 + L / 2}" y="${ground - H - 26}" text-anchor="middle">length ${lab(d.length)}</text>
      <path class="fo-dimline" d="M${x0 - 48} ${ground - H}V${ground}M${x0 - 54} ${ground - H}h12M${x0 - 54} ${ground}h12"/><text class="fo-dim" x="${x0 - 56}" y="${ground - H / 2 + 4}" text-anchor="end">height</text><text class="fo-dim" x="${x0 - 56}" y="${ground - H / 2 + 19}" text-anchor="end">${lab(d.height)}</text>
      <rect class="fo-box" x="${x1 + 60}" y="${ground - H}" width="${B}" height="${H}"/><line class="fo-crown" x1="${x1 + 60}" y1="${ground - H + 8}" x2="${x1 + 60 + B}" y2="${ground - H + 8}"/>
      <circle class="fo-stave-end" cx="${x1 + 60 + 10}" cy="${ground - 18}" r="5"/><circle class="fo-stave-end" cx="${x1 + 60 + B - 10}" cy="${ground - 18}" r="5"/>
      <path class="fo-dimline" d="M${x1 + 60} ${ground - H - 18}H${x1 + 60 + B}M${x1 + 60} ${ground - H - 24}v12M${x1 + 60 + B} ${ground - H - 24}v12"/><text class="fo-dim" x="${x1 + 60 + B / 2}" y="${ground - H - 26}" text-anchor="middle">breadth ${lab(d.breadth)}</text>
      <text class="fo-view" x="${x0 + L / 2}" y="${ground + 22}" text-anchor="middle">side</text><text class="fo-view" x="${x1 + 60 + B / 2}" y="${ground + 22}" text-anchor="middle">end</text>
    </svg>`;
  };

  const sheet = (o) => `<div class="fo-sheet-in">
      <header class="fo-sheet-top"><span class="fo-no">${no(o)} <em>of ${O.objects.length}</em></span>
        <div class="fo-sheet-nav"><button type="button" data-step="-1" aria-label="Previous exhibit">${icon("chevronLeft", 18)}</button><button type="button" data-step="1" aria-label="Next exhibit">${icon("chevronRight", 18)}</button>
        <button type="button" class="fo-close" data-close aria-label="Close the exhibit">${icon("x", 18)}</button></div></header>
      <div class="fo-sheet-grid">
        <figure class="fo-big"><div class="fo-big-art">${objectArt(o.id, "is-big")}</div><figcaption>${esc(CAPTION)}${o.id === "book" ? " Scripture says “a book”; it is drawn here as a scroll." : ""}</figcaption>
          ${o.dims ? `<div class="fo-big-scale"><div class="fo-units" role="group" aria-label="Units"><button type="button" data-units="cubits" aria-pressed="true">Cubits</button><button type="button" data-units="metres" aria-pressed="false">Metres</button></div><div class="fo-scale-host">${scale()}</div>
            <p class="fo-note">Exodus 25:10 gives the size in cubits. Metres take a cubit as about 45 cm, a common convention; estimates differ. The figure is 1.70 m tall, for scale only.</p></div>` : ""}</figure>
        <div class="fo-text"><span class="fo-kick">${esc(refText(o.first.ref))} · the KJV says “${esc(o.words)}”</span><h2>${esc(o.name)}</h2>
          ${kjv(o.first, "fo-first")}
          ${o.sections.map((s) => ({ ...s, quotes: s.quotes.filter((q) => q.ref[0] !== o.first.ref[0] || q.ref[1] !== o.first.ref[1]) })).filter((s) => s.quotes.length).map((s) => `<section class="fo-part"><h3>${esc(s.h)}</h3>${s.quotes.map((q) => `<blockquote class="fo-q"><p>${esc(q.text)}</p><footer>${refLink(q.ref)} · KJV</footer></blockquote>`).join("")}</section>`).join("")}
          <section class="fo-part fo-next"><h3>Where it went next</h3>${claim({ text: o.next, refs: [] })}</section>
          <section class="fo-part"><h3>Named in</h3><div class="fo-named">${o.time.map((t) => `<a class="ref" href="${refHref([t])}">${esc(refText([t]))}</a>`).join("")}</div></section></div>
      </div></div>`;

  DIRECTIONS.objects = {
    name: "In his hands", swatch: "#9a8a68",
    mount(main) {
      main.innerHTML = `<div class="wrap fo-wait">${topline()}<p>Opening the cabinet…</p></div>`;
      let alive = true, current = -1;
      const off = [];
      load().then(() => { if (alive) draw(); }).catch((error) => { console.error("objects: could not load data/objects.json", error); main.innerHTML = `<p class="wrap">Could not load the objects: ${esc(error.message)}</p>`; });
      function draw() {
        const measured = O.objects.filter((o) => o.dims).length, last = O.objects.reduce((m, o) => Math.max(m, lastSeen(o)), 0);
        main.innerHTML = `
          <section class="fo-room"><div class="wrap">${topline()}
            <header class="fo-hero"><div><span class="fo-kick">The cabinet · Moses</span><h1>In his hands</h1></div>
              <div class="fo-hero-side"><p>Eleven things Scripture names in Moses' life, from a basket of bulrushes to the book of the law. Open a case to read every verse about it, and where it went next.</p>
                <dl class="fo-stats"><div><dt>Objects</dt><dd>${O.objects.length}</dd></div><div><dt>With a size in Scripture</dt><dd>${measured}</dd></div><div><dt>First</dt><dd>${esc(refText(O.objects[0].first.ref))}</dd></div><div><dt>Last named</dt><dd>${esc(refText([last]))}</dd></div></dl></div></header>
            <div class="fo-cab">${O.objects.map(vitrine).join("")}
              <div class="fo-case fo-about"><span class="fo-kick">About the cabinet</span><p>${esc(CAPTION)}</p><p>Each case is in the order the object comes into Moses' story. Every word in an exhibit is quoted from the King James Version, except the headings and one plain line on where it went next, marked as written by this site.</p>${chip("scripture")}</div></div>
          </div></section>
          <section class="wrap fo-sec"><div class="fo-sec-head"><span class="fo-kick">Through time</span><h2>When each one enters, and leaves, the story</h2>
            <p>Every verse that names the object, across the books of the Bible in order. Books with none are left out; Exodus to Deuteronomy, the books of his life, are drawn wider.</p></div>
            <div class="fo-time-wrap">${timeline()}</div></section>
          <section class="wrap fo-sec"><div class="fo-sec-head"><span class="fo-kick">Compare sizes</span><h2>Only one is measured</h2>
            <p>Scripture gives the size of just one of these objects: the ark of the covenant, in cubits. The other ten have no measurements in the text, so they are not drawn to scale.</p></div>
            <div class="fo-size"><div class="fo-size-main"><div class="fo-units" role="group" aria-label="Units"><button type="button" data-units="cubits" aria-pressed="true">Cubits</button><button type="button" data-units="metres" aria-pressed="false">Metres</button></div>
              <div class="fo-scale-host">${scale()}</div>${kjv(O.objects.find((o) => o.dims).dims.verse, "fo-dims-verse")}
              <p class="fo-note">Metres take a cubit as about 45 cm, a common convention; estimates differ. The figure is 1.70 m tall, for scale only.</p></div>
              <ul class="fo-unmeasured">${O.objects.filter((o) => !o.dims).map((o) => `<li><button type="button" data-open="${o.id}">${objectArt(o.id, "is-mini")}<span><b>${esc(o.name)}</b><small>No size given</small></span></button></li>`).join("")}</ul></div></section>
          <div class="fo-sheet" data-sheet role="dialog" aria-modal="true" aria-label="Exhibit" hidden></div>`;
        wire();
      }
      function wire() {
        const cases = [...main.querySelectorAll(".fo-cab .fo-case:not(.fo-about)")], sheetEl = main.querySelector("[data-sheet]");
        const pts = [...main.querySelectorAll(".fo-pt")], lines = [...main.querySelectorAll(".fo-lane-line")], head = main.querySelector(".fo-time-head");
        // The cabinet lights up: each case rises, its drawing plots itself; then the time line draws left to right.
        const lightUp = () => Clock.run({ label: "The cabinet lights up: cases rise, drawings plot, the time line draws", duration: 4200,
          frame: (p) => {
            cases.forEach((c, i) => { const q = span(p, i * .045, i * .045 + .42); c.style.setProperty("--in", easeOut(span(q, 0, .35)).toFixed(3)); c.querySelector(".o-art").style.setProperty("--draw", (q * 1.35).toFixed(3)); });
            const t = easeInOut(span(p, .45, 1));
            head.style.left = `calc(var(--nw) + (100% - var(--nw)) * ${t.toFixed(4)})`; head.style.opacity = t > 0 && t < 1 ? "1" : "0";
            pts.forEach((x) => x.classList.toggle("is-on", Number(x.dataset.t) <= t + 1e-4));
            lines.forEach((l) => { const a = parseFloat(l.style.left) / 100, w = parseFloat(l.style.width) / 100; l.style.setProperty("--grow", clamp01((t - a) / Math.max(w, .001)).toFixed(3)); });
          },
          moving: (p) => [p < .6 && "cases rising", p < .7 && "drawings plotting", p > .45 && p < 1 && "time line"].filter(Boolean) });
        const open = (i) => {
          current = (i + O.objects.length) % O.objects.length;
          const o = O.objects[current];
          sheetEl.innerHTML = sheet(o);
          sheetEl.setAttribute("aria-label", o.name);
          if (sheetEl.hidden) { sheetEl.hidden = false; requestAnimationFrame(() => sheetEl.classList.add("is-open")); document.documentElement.classList.add("fo-locked"); }
          sheetEl.scrollTop = 0;
          const art = sheetEl.querySelector(".o-art");
          Clock.run({ label: `${no(o)} · ${o.name}: the drawing plots itself`, duration: 2400, frame: (p) => art.style.setProperty("--draw", (easeOut(p) * 1.35).toFixed(3)), moving: (p) => (p < 1 ? ["drawing plotting"] : []) });
        };
        const close = () => { sheetEl.classList.remove("is-open"); document.documentElement.classList.remove("fo-locked"); current = -1; setTimeout(() => { if (current < 0) sheetEl.hidden = true; }, 600); };
        const onClick = (e) => {
          const op = e.target.closest("[data-open]");
          if (op) { open(O.objects.findIndex((o) => o.id === op.dataset.open)); return; }
          if (e.target.closest("[data-close]") || e.target === sheetEl) { close(); return; }
          const st = e.target.closest("[data-step]");
          if (st && current >= 0) { open(current + Number(st.dataset.step)); return; }
          const u = e.target.closest("[data-units]");
          if (u) { const box = u.closest(".fo-size-main, .fo-big-scale"); box.querySelectorAll("[data-units]").forEach((b) => b.setAttribute("aria-pressed", String(b === u))); box.querySelector(".fo-scale-host").innerHTML = scale(u.dataset.units); }
        };
        const onKey = (e) => { if (current < 0) return; if (e.key === "Escape") close(); else if (e.key === "ArrowRight") open(current + 1); else if (e.key === "ArrowLeft") open(current - 1); };
        main.addEventListener("click", onClick); addEventListener("keydown", onKey);
        off.push(() => { main.removeEventListener("click", onClick); removeEventListener("keydown", onKey); document.documentElement.classList.remove("fo-locked"); });
        lightUp();
      }
      return () => { alive = false; off.forEach((f) => f()); };
    },
  };
})();
