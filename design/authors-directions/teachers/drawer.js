// The shared profile drawer for the Teachers page (ported from D · Rearrange). Any section opens it with
// window.Teachers.openProfile(personId): who they were, where they lived, what they are known for (each work the library
// can open is a "Read" link), what the library holds, the Bible books it covers, and the people they are documented as knowing.
window.Teachers = window.Teachers || {};
(() => {
  const people = AUTHORS.people;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GENRE_TONE = { sermon: "--prophets", treatise: "--history", commentary: "--poetry", letter: "--acts", "systematic-theology": "--gospels",
    "collected-works": "--epistles", article: "--revelation" };
  const genreName = (g) => g.replace(/-/g, " ");
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const tokens = (person) => person.name.split(/\s+/).filter(Boolean);
  const initials = (person) => { const t = tokens(person); return (t[0][0] + t[t.length - 1][0]).toUpperCase(); };
  const tone = (person) => `var(${familyOf(person).tone})`;
  const linksOf = (id) => AUTHORS.links.filter((l) => l.from === id || l.to === id)
    .map((l) => ({ other: personById(l.from === id ? l.to : l.from), note: l.note }));
  const readLink = (url, label = "Read") => `<a class="drw-read" href="${esc(url)}" target="_blank" rel="noopener">${label}${icon("arrowUp", 13)}</a>`;
  let root, body, currentId = null, lastFocus = null;

  // A ring standing for 1500 to today with the person's own lifetime drawn in their family colour.
  function lifeRing(person, size = 64) {
    const r = 26, c = 32, start = 1500, span = THIS_YEAR - start;
    const angle = (year) => -Math.PI / 2 + ((year - start) / span) * Math.PI * 2;
    const point = (year) => [c + r * Math.cos(angle(year)), c + r * Math.sin(angle(year))];
    const [x1, y1] = point(person.born), [x2, y2] = point(lifeEnd(person));
    const large = (lifeEnd(person) - person.born) / span > 0.5 ? 1 : 0;
    return `<svg class="drw-ring" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="${r}" style="fill:none;stroke:var(--line);stroke-width:3"/>
      <path d="M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" style="fill:none;stroke:var(--tone);stroke-width:5;stroke-linecap:round"/>
      <text x="32" y="37.5" text-anchor="middle" style="fill:var(--ink);font: 600 15px var(--serif)">${initials(person)}</text></svg>`;
  }

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
          return `<text x="${px + (right ? 9 : -9) * k}" y="${py + 4 * k}" text-anchor="${right ? "start" : "end"}" style="font-size:${11 * k}px">${esc(pl[0])}</text>`;
        }
        return "";
      }).join("");
      return `<svg class="drw-map" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" role="img" aria-label="Map of the places ${esc(p.short)} lived">
        <path class="drw-land" d="${view.land}"/>
        ${route.length > 1 ? `<polyline class="drw-route" pathLength="1" points="${route.map((q) => q.join(",")).join(" ")}" style="stroke-width:${2 * k}px"/>` : ""}
        ${pts.map((q, i) => `<circle class="drw-pt${i === 0 && p.birthplaceKnown !== false ? " drw-birth" : ""}" data-place="${i}" cx="${q[0]}" cy="${q[1]}" r="${(i === 0 ? 5 : 4) * k}"/>`).join("")}
        <g class="drw-labels">${labels}</g></svg>
        <p class="drw-note">${p.birthplaceKnown === false ? `Birthplace not recorded; the map starts at the earliest place known, ${esc(p.places[0][0])}.` : "Filled dot: birthplace. The line follows each move in order."}</p>`;
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
    return `<div class="drw-strip">${segs.map((s) => `<button type="button" data-place="${s.i}" style="flex:${Math.max(1, s.to - s.from)} 1 0" title="${esc(s.name)}, from ${s.from}">
        <i></i><span>${esc(s.name)}</span><small>${s.from}</small></button>`).join("")}</div>
      <div class="drw-strip-ends"><span>Born ${p.circa ? "c. " : ""}${p.born}</span><span>${p.died ? `Died ${p.died} · about ${span} years` : "Living"}</span></div>`;
  }

  function knownWorks(p) {
    return `<ul class="drw-known">${p.known.map((k) => `<li><b>${k.y}</b><span>${k.u ? `<a href="${esc(k.u)}" target="_blank" rel="noopener">${esc(k.t)}</a>` : esc(k.t)}</span>
      <span class="drw-tags">${k.inLibrary ? `<em class="drw-in">In the library</em>` : `<em class="drw-out">Not in the library yet</em>`}${k.u ? readLink(k.u) : ""}</span></li>`).join("")}</ul>`;
  }

  function genreBar(p) {
    const entries = Object.entries(p.genres).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return `<p class="drw-empty">Nothing by ${esc(p.short)} is catalogued in the library yet.</p>`;
    return `<div class="drw-gbar">${entries.map(([g, n]) => `<i style="flex:${n} 1 0;background:var(${GENRE_TONE[g] ?? "--muted"})" title="${genreName(g)}: ${formatNumber(n)}"></i>`).join("")}</div>
      <ul class="drw-glegend">${entries.map(([g, n]) => `<li><i style="background:var(${GENRE_TONE[g] ?? "--muted"})"></i>${genreName(g)} <b>${formatNumber(n)}</b></li>`).join("")}</ul>`;
  }

  function bookStrip(p) {
    const max = Math.max(...p.books);
    if (!max) return `<p class="drw-empty">None of ${esc(p.short)}'s works in the library is tied to a main Bible passage yet.</p>`;
    const top = p.books.map((n, i) => [n, AUTHORS.books[i]]).filter(([n]) => n).sort((a, b) => b[0] - a[0]);
    const bars = AUTHORS.books.map((b, i) => { const n = p.books[i];
      return `<i title="${b.name}: ${n}" style="--h:${n ? 0.14 + 0.86 * Math.sqrt(n / max) : 0.05};background:var(--${b.section});opacity:${n ? 1 : 0.35}"></i>`; }).join("");
    return `<div class="drw-books" role="img" aria-label="Works by Bible book">${bars}</div>
      <div class="drw-books-ends"><span>Old Testament</span><span>New Testament</span></div>
      <p class="drw-note">${top.length} of 66 books. Most often: ${top.slice(0, 3).map(([n, b]) => `${b.name} (${formatNumber(n)})`).join(", ")}. Bar height uses a square-root scale.</p>`;
  }

  // A few titles from the library. A title the library can open (matched against works with a reading address) is a link.
  function fromLibrary(p) {
    const urlOf = new Map([...p.passages, ...p.sermons, ...p.known].filter((w) => w.u).map((w) => [w.t, w.u]));
    const items = p.notable.length ? p.notable.map((w) => ({ t: w.t, s: genreName(w.g), u: urlOf.get(w.t) ?? null }))
      : p.sermons.map((s) => ({ t: s.t, s: s.r, u: s.u }));
    // Works on a Bible passage, spread across the Bible (they all carry an address to read them).
    const withUrl = p.passages.filter((w) => w.u), picks = [];
    const want = Math.min(4, withUrl.length);
    for (let i = 0; i < want; i++) picks.push(withUrl[Math.floor((i + 0.5) * withUrl.length / want)]);
    const row = (w) => `<li>${w.u ? `<a href="${esc(w.u)}" target="_blank" rel="noopener"><span>${esc(w.t)}</span><small>${esc(w.s)}</small>${icon("arrowUp", 14)}</a>`
      : `<div><span>${esc(w.t)}</span><small>${esc(w.s)}</small></div>`}</li>`;
    let html = "";
    if (items.length) html += `<section><h3>From the library</h3><ul class="drw-worklist">${items.slice(0, 5).map(row).join("")}</ul></section>`;
    if (picks.length && p.notable.length) html += `<section><h3>Read them on a passage</h3><ul class="drw-worklist">${picks.map((w) => row({ t: w.t, s: `${w.r} · ${genreName(w.g)}`, u: w.u })).join("")}</ul></section>`;
    return html;
  }

  function render(p) {
    const fam = familyOf(p), links = linksOf(p.id), sermons = p.genres.sermon ?? 0;
    return `<div class="drw-inner" style="--tone:${tone(p)}">
      <header class="drw-top">${lifeRing(p, 76)}
        <div><p class="kicker">${esc(fam.label)}</p><h2>${esc(p.name)}</h2><p class="drw-years">${lifeLabel(p)}${p.died ? "" : " · living"}</p></div></header>
      <p class="drw-line">${esc(p.line)}</p>
      <p class="drw-ring-note">The ring runs from 1500 to today; the coloured arc is ${esc(p.short)}'s lifetime.</p>
      <dl class="drw-figs"><div><dt>Works in the library</dt><dd>${formatNumber(p.works)}</dd></div><div><dt>Sermons</dt><dd>${formatNumber(sermons)}</dd></div>
        <div><dt>Places</dt><dd>${new Set(p.places.map((x) => x[0])).size}</dd></div><div><dt>Links</dt><dd>${links.length}</dd></div></dl>
      <section><h3>Where ${esc(p.short)} lived</h3>${placeMap(p)}${lifeStrip(p)}</section>
      <section><h3>Best known for</h3>${knownWorks(p)}</section>
      <section><h3>What the library holds</h3>${genreBar(p)}</section>
      <section><h3>Their works, Bible book by book</h3><p class="drw-note drw-lead">Works in the library whose main text is in each of the 66 books.</p>${bookStrip(p)}</section>
      ${fromLibrary(p)}
      <section><h3>Who they knew</h3>${links.length ? `<ul class="drw-links">${links.map((l) => `<li><button type="button" data-open="${l.other.id}" style="--tone:${tone(l.other)}">
        <span class="drw-mono">${initials(l.other)}</span><span class="drw-who"><b>${esc(l.other.name)}</b><small>${esc(l.note)}</small></span>${icon("arrowRight", 15)}</button></li>`).join("")}</ul>`
        : `<p class="drw-empty">No documented links to the other ${people.length - 1} yet.</p>`}</section>
    </div>`;
  }

  function show(id) {
    const p = personById(id);
    if (!p) { console.error(`Teachers.openProfile: no teacher with id "${id}"`); return; }
    if (!root) mount();
    const wasOpen = root.classList.contains("drw-open");
    currentId = id;
    const swap = () => {
      body.innerHTML = render(p);
      body.scrollTop = 0;
      root.querySelector(".drw-count").textContent = `${people.indexOf(p) + 1} of ${people.length}`;
    };
    if (wasOpen && !reduced) {
      body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" }).onfinish = () => {
        swap();
        body.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
      };
    } else swap();
    if (!wasOpen) {
      lastFocus = document.activeElement;
      root.classList.add("drw-open");
      root.setAttribute("aria-hidden", "false");
      root.querySelector(".drw-close").focus({ preventScroll: true });
    }
  }

  function close() {
    if (!root) return;
    root.classList.remove("drw-open");
    root.setAttribute("aria-hidden", "true");
    lastFocus?.focus?.({ preventScroll: true });
  }

  function mount() {
    document.body.insertAdjacentHTML("beforeend", `<div class="drw" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Teacher profile">
      <div class="drw-scrim" data-close></div>
      <aside class="drw-panel">
        <div class="drw-bar"><button type="button" data-step="-1" aria-label="Previous teacher">${icon("arrowLeft", 16)}</button>
          <span class="drw-count"></span><button type="button" data-step="1" aria-label="Next teacher">${icon("arrowRight", 16)}</button>
          <button type="button" class="drw-close" data-close aria-label="Close profile">${icon("x", 18)}</button></div>
        <div class="drw-body"></div>
      </aside></div>`);
    root = document.body.lastElementChild;
    body = root.querySelector(".drw-body");
    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) return close();
      const step = e.target.closest("[data-step]");
      if (step) { const i = people.findIndex((p) => p.id === currentId); return show(people[(i + Number(step.dataset.step) + people.length) % people.length].id); }
      const jump = e.target.closest("[data-open]");
      if (jump) return show(jump.dataset.open);
    });
    // The life strip and the map point at each other.
    root.addEventListener("pointerover", (e) => {
      const seg = e.target.closest("[data-place]");
      root.querySelectorAll(".drw-lit").forEach((x) => x.classList.remove("drw-lit"));
      if (seg) root.querySelectorAll(`[data-place="${seg.dataset.place}"]`).forEach((x) => x.classList.add("drw-lit"));
    });
    addEventListener("keydown", (e) => {
      if (!root.classList.contains("drw-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") root.querySelector(`[data-step="${e.key === "ArrowRight" ? 1 : -1}"]`).click();
    });
  }

  Teachers.openProfile = (personId) => show(personId);
  Teachers.closeProfile = close;
})();
