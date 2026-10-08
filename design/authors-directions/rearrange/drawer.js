// One person's profile, sliding in from the right: who they were, where they lived, what they are known for,
// what the library holds of theirs, the Bible books it covers, and the people they are documented as knowing.
window.Drawer = (() => {
  const GENRE_TONE = { sermon: "--prophets", treatise: "--history", commentary: "--poetry", letter: "--acts", "systematic-theology": "--gospels",
    "collected-works": "--epistles", article: "--revelation" };
  const genreName = (g) => g.replace(/-/g, " ");
  let root, body, order = [...R.people], currentId = null, lastFocus = null;

  // The smallest pre-drawn map that holds every place they lived, cropped close around those places.
  function placeMap(p) {
    for (const [name, minW] of [["europe", 260], ["america", 260], ["atlantic", 300], ["world", 1000]]) {
      const view = AUTHORS.views[name], pts = p.places.map((_, i) => view.places[`${p.id}#${i}`]);
      if (pts.some((pt) => !pt)) continue;
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const spanX = Math.max(...xs) - Math.min(...xs), spanY = Math.max(...ys) - Math.min(...ys);
      const w = Math.min(view.width, Math.max(minW, spanX * 1.5 + 60, (spanY * 1.4 + 60) * 2)), h = Math.min(view.height, w / 2);
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
      const x = Math.max(0, Math.min(view.width - w, cx - w / 2)), y = Math.max(0, Math.min(view.height - h, cy - h / 2));
      const k = w / 400, route = pts.filter((q, i) => i === 0 || q[0] !== pts[i - 1][0] || q[1] !== pts[i - 1][1]);
      const seen = new Set(), placedLabels = [], labels = p.places.map((pl, i) => {
        if (seen.has(pl[0])) return "";
        seen.add(pl[0]);
        // Try the right side, then the left; a label that would collide is dropped (the life strip still names it).
        const [px, py] = pts[i], tw = pl[0].length * 6.4 * k, th = 13 * k;
        for (const right of px < x + w * 0.72 ? [true, false] : [false, true]) {
          const bx = right ? px + 9 * k : px - 9 * k - tw, box = [bx, py - th / 2, bx + tw, py + th / 2];
          if (placedLabels.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) continue;
          placedLabels.push(box);
          return `<text x="${px + (right ? 9 : -9) * k}" y="${py + 4 * k}" text-anchor="${right ? "start" : "end"}" style="font-size:${11 * k}px">${R.esc(pl[0])}</text>`;
        }
        return "";
      }).join("");
      return `<svg class="pmap" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" role="img" aria-label="Map of the places ${R.esc(p.short)} lived">
        <path class="land" d="${view.land}"/>
        ${route.length > 1 ? `<polyline class="route" pathLength="1" points="${route.map((q) => q.join(",")).join(" ")}" style="stroke-width:${2 * k}px"/>` : ""}
        ${pts.map((q, i) => `<circle class="pt${i === 0 && p.birthplaceKnown !== false ? " birth" : ""}" data-place="${i}" cx="${q[0]}" cy="${q[1]}" r="${(i === 0 ? 5 : 4) * k}"/>`).join("")}
        <g class="pl">${labels}</g></svg>
        <p class="small-note">${p.birthplaceKnown === false ? `Birthplace not recorded; the map starts at the earliest place known, ${R.esc(p.places[0][0])}.` : "Filled dot: birthplace. The line follows each move in order."}</p>`;
    }
    return "";
  }

  function lifeStrip(p) {
    const end = lifeEnd(p), span = Math.max(1, end - p.born);
    const segs = p.places.map((pl, i) => {
      const from = Math.max(p.born, pl[3]), to = Math.min(end, p.places[i + 1]?.[3] ?? end);
      return { name: pl[0], from, to, i };
    }).filter((s) => s.to > s.from || s.i === p.places.length - 1);
    // When the first place is only the earliest known one, the years before it are left unnamed.
    if (p.birthplaceKnown === false && p.places[0][3] > p.born) segs.unshift({ name: "Not recorded", from: p.born, to: p.places[0][3], i: -1 });
    return `<div class="strip-life">${segs.map((s) => `<button type="button" data-place="${s.i}" style="flex:${Math.max(1, s.to - s.from)} 1 0" title="${R.esc(s.name)}, from ${s.from}">
        <i></i><span>${R.esc(s.name)}</span><small>${s.from}</small></button>`).join("")}</div>
      <div class="strip-ends"><span>Born ${p.circa ? "c. " : ""}${p.born}</span><span>${p.died ? `Died ${p.died} · about ${span} years` : "Living"}</span></div>`;
  }

  function genreBar(p) {
    const entries = Object.entries(p.genres).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return `<p class="empty">Nothing by ${R.esc(p.short)} is catalogued in the library yet.</p>`;
    return `<div class="gbar">${entries.map(([g, n]) => `<i style="flex:${n} 1 0;background:var(${GENRE_TONE[g] ?? "--muted"})" title="${genreName(g)}: ${formatNumber(n)}"></i>`).join("")}</div>
      <ul class="glegend">${entries.map(([g, n]) => `<li><i style="background:var(${GENRE_TONE[g] ?? "--muted"})"></i>${genreName(g)} <b>${formatNumber(n)}</b></li>`).join("")}</ul>`;
  }

  function bookStrip(p) {
    const max = Math.max(...p.books);
    if (!max) return `<p class="empty">None of ${R.esc(p.short)}'s works in the library is tied to a main Bible passage yet.</p>`;
    const top = p.books.map((n, i) => [n, AUTHORS.books[i]]).filter(([n]) => n).sort((a, b) => b[0] - a[0]);
    const bars = AUTHORS.books.map((b, i) => { const n = p.books[i];
      return `<i title="${b.name}: ${n}" style="--h:${n ? 0.14 + 0.86 * Math.sqrt(n / max) : 0.05};background:var(--${b.section});opacity:${n ? 1 : 0.35}"></i>`; }).join("");
    return `<div class="books66" role="img" aria-label="Works by Bible book">${bars}</div>
      <div class="books-ends"><span>Old Testament</span><span>New Testament</span></div>
      <p class="small-note">${top.length} of 66 books. Most often: ${top.slice(0, 3).map(([n, b]) => `${b.name} (${formatNumber(n)})`).join(", ")}. Bar height uses a square-root scale.</p>`;
  }

  function fromLibrary(p) {
    const items = p.notable.length ? p.notable.map((w) => ({ t: w.t, s: genreName(w.g) })) : p.sermons.map((s) => ({ t: s.t, s: s.r }));
    if (!items.length) return "";
    return `<section><h3>From the library</h3><ul class="worklist">${items.slice(0, 5).map((w) => `<li><span>${R.esc(w.t)}</span><small>${R.esc(w.s)}</small></li>`).join("")}</ul></section>`;
  }

  function render(p) {
    const fam = familyOf(p), links = R.linksOf(p.id), sermons = p.genres.sermon ?? 0;
    return `<div class="dw-inner" style="--tone:${R.tone(p)}">
      <header class="dw-top">${R.lifeRing(p, 76)}
        <div><p class="kicker">${R.esc(fam.label)}</p><h2>${R.esc(p.name)}</h2><p class="years">${lifeLabel(p)}${p.died ? "" : " · living"}</p></div></header>
      <p class="dw-line">${R.esc(p.line)}</p>
      <p class="ring-note">The ring runs from 1500 to today; the coloured arc is ${R.esc(p.short)}'s lifetime.</p>
      <dl class="dw-figs"><div><dt>Works in the library</dt><dd>${formatNumber(p.works)}</dd></div><div><dt>Sermons</dt><dd>${formatNumber(sermons)}</dd></div>
        <div><dt>Places</dt><dd>${new Set(p.places.map((x) => x[0])).size}</dd></div><div><dt>Links</dt><dd>${links.length}</dd></div></dl>
      <section><h3>Where ${R.esc(p.short)} lived</h3>${placeMap(p)}${lifeStrip(p)}</section>
      <section><h3>Best known for</h3><ul class="known">${p.known.map((k) => `<li><b>${k.y}</b><span>${R.esc(k.t)}</span>
        ${k.inLibrary ? `<em class="in">In the library</em>` : `<em class="out">Not in the library yet</em>`}</li>`).join("")}</ul></section>
      <section><h3>What the library holds</h3>${genreBar(p)}</section>
      <section><h3>Their works, Bible book by book</h3><p class="small-note">Works in the library whose main text is in each of the 66 books.</p>${bookStrip(p)}</section>
      ${fromLibrary(p)}
      <section><h3>Who they knew</h3>${links.length ? `<ul class="dw-links">${links.map((l) => `<li><button type="button" data-open="${l.other.id}" style="--tone:${R.tone(l.other)}">
        ${R.mono(l.other)}<span><b>${R.esc(l.other.name)}</b><small>${R.esc(l.note)}</small></span>${icon("arrowRight", 15)}</button></li>`).join("")}</ul>`
        : `<p class="empty">No documented links to the other 46 yet.</p>`}</section>
    </div>`;
  }

  function show(id) {
    const p = personById(id);
    if (!p) return;
    const wasOpen = root.classList.contains("open");
    currentId = id;
    const swap = () => {
      body.innerHTML = render(p);
      body.scrollTop = 0;
      root.querySelector(".dw-count").textContent = `${order.indexOf(p) + 1} of ${order.length}`;
    };
    if (wasOpen && !R.reduced) {
      body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" }).onfinish = () => {
        swap();
        body.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
      };
    } else swap();
    if (!wasOpen) {
      lastFocus = document.activeElement;
      root.classList.add("open");
      root.setAttribute("aria-hidden", "false");
      root.querySelector(".dw-close").focus({ preventScroll: true });
    }
    R.light(id);
  }

  function close() {
    root.classList.remove("open");
    root.setAttribute("aria-hidden", "true");
    R.light(null);
    lastFocus?.focus?.({ preventScroll: true });
  }

  function mount() {
    document.body.insertAdjacentHTML("beforeend", `<div class="drawer" aria-hidden="true" role="dialog" aria-label="Profile">
      <div class="scrim" data-close></div>
      <aside class="panel">
        <div class="dw-bar"><button type="button" class="dw-nav" data-step="-1" aria-label="Previous person">${icon("arrowLeft", 16)}</button>
          <span class="dw-count"></span><button type="button" class="dw-nav" data-step="1" aria-label="Next person">${icon("arrowRight", 16)}</button>
          <button type="button" class="dw-close" data-close aria-label="Close profile">${icon("x", 18)}</button></div>
        <div class="dw-body"></div>
      </aside></div>`);
    root = document.querySelector(".drawer");
    body = root.querySelector(".dw-body");
    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) return close();
      const step = e.target.closest("[data-step]");
      if (step) { const i = order.findIndex((p) => p.id === currentId); return show(order[(i + Number(step.dataset.step) + order.length) % order.length].id); }
      const jump = e.target.closest("[data-open]");
      if (jump) return show(jump.dataset.open);
    });
    // The life strip and the map point at each other.
    root.addEventListener("pointerover", (e) => {
      const seg = e.target.closest("[data-place]");
      root.querySelectorAll(".lit-place").forEach((x) => x.classList.remove("lit-place"));
      if (seg) root.querySelectorAll(`[data-place="${seg.dataset.place}"]`).forEach((x) => x.classList.add("lit-place"));
    });
    addEventListener("keydown", (e) => {
      if (!root.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") root.querySelector(`[data-step="${e.key === "ArrowRight" ? 1 : -1}"]`).click();
    });
    R.bus.addEventListener("open", (e) => show(e.detail));
  }

  return { mount, show, close };
})();
