// The shared scholar profile (ported from "The index"). Any section opens it with
//   window.Scholars.openProfile(id, originElement)
// It grows out of originElement (the clicked card or mark) and shrinks back into it on close; without an origin it rises
// from the centre. It holds everything the data has on the person: age, faith label, badges, born / died / faith / era,
// works, how the site uses them, where the site names them (relative bars), a 0–2026 life bar, a small map, finds and
// their step in the chain. Prev / next follow the catalogue's current order (it announces that order on
// window "scholars:filter"); Esc closes, arrow keys step. Every fact comes from window.SCHOLARS.
window.Scholars = window.Scholars || {};
(() => {
  const S = window.SCHOLARS;
  const byId = new Map(S.scholars.map((s) => [s.id, s]));
  const TONE = { history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels" };
  const NOW = 2026;
  const EASE = "cubic-bezier(.16, 1, .3, 1)";
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const tone = (s) => `var(${TONE[s.field]})`;
  const get = (id) => {
    const s = byId.get(id);
    if (!s) throw new Error(`Scholars profile: no scholar with id "${id}" (expected one of ${byId.size} ids in SCHOLARS.scholars)`);
    return s;
  };
  const years = (s) => (s.circa ? `c. ${s.born}–c. ${s.died}` : `${s.born}–${s.died}`);
  const lived = (s) => `${s.circa ? "about " : ""}${s.died - s.born} years`;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const eraParts = (key) => {
    const m = S.eras[key].match(/^(?:The )?(.+?) \((.+)\)$/);
    return m ? [m[1][0].toUpperCase() + m[1].slice(1), m[2]] : [S.eras[key], ""];
  };
  const initials = (s) => {
    const words = s.name.split(/ (?:of|the) /)[0].split(" ").filter((w) => !/^(von|van|de)$/i.test(w));
    return words.length === 1 ? words[0][0] : words[0][0] + words.at(-1)[0];
  };
  // One shape per field in a 48 × 48 box: circle history, rounded square languages & texts, hexagon archaeology & places,
  // tall card reference works, arch theology.
  const SHAPES = {
    history: (k) => `<circle cx="24" cy="24" r="${22 * k}"/>`,
    texts: (k) => { const r = 21 * k; return `<rect x="${24 - r}" y="${24 - r}" width="${2 * r}" height="${2 * r}" rx="${11 * k}"/>`; },
    places: (k) => `<path d="${[0, 1, 2, 3, 4, 5].map((i) => { const a = Math.PI / 3 * i - Math.PI / 2; return `${i ? "L" : "M"}${(24 + 23 * k * Math.cos(a)).toFixed(2)} ${(24 + 23 * k * Math.sin(a)).toFixed(2)}`; }).join("")}Z" stroke-linejoin="round"/>`,
    reference: (k) => `<rect x="${24 - 16 * k}" y="${24 - 22 * k}" width="${32 * k}" height="${44 * k}" rx="${7 * k}"/>`,
    theology: (k) => { const w = 19 * k, top = 24 - 21 * k, bot = 24 + 21 * k; return `<path d="M${24 - w} ${bot}V${top + w}A${w} ${w} 0 0 1 ${24 + w} ${top + w}V${bot}Z"/>`; },
  };
  const mark = (s, size) => {
    const t = tone(s), ini = initials(s);
    return `<svg class="prf-mark" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true">
      <g style="fill: color-mix(in srgb, ${t} 15%, var(--surface)); stroke: color-mix(in srgb, ${t} 50%, transparent)" stroke-width="1.1">${SHAPES[s.field](1)}</g>
      <g fill="none" style="stroke: color-mix(in srgb, ${t} 22%, transparent)" stroke-width=".8">${SHAPES[s.field](.82)}</g>
      <text x="24" y="25" text-anchor="middle" dominant-baseline="central" style="fill: ${t}; font: ${ini.length > 1 ? 500 : 400} ${ini.length > 1 ? 15.5 : 21}px var(--serif); letter-spacing: -.02em">${esc(ini)}</text></svg>`;
  };
  const siteBadge = (s, compact) => {
    if (!s.site) return "";
    const used = s.site.status === "in-use";
    return `<span class="prf-badge ${used ? "prf-badge-used" : "prf-badge-held"}">${used ? "<i></i>Used on this site" : compact ? "In the library" : "In the library, planned"}</span>`;
  };
  const faithPill = (s) => `<span class="prf-faith">${esc(S.faiths[s.faith])}</span>`;
  const pct = (year) => `${(Math.max(0, Math.min(NOW, year)) / NOW * 100).toFixed(3)}%`;
  // Their life on a line from year 0 to today: works as dots, faint marks for every other scholar.
  const lifeBar = (s) => {
    const others = S.scholars.filter((o) => o.id !== s.id).map((o) => `<i class="prf-lb-other" style="left:${pct((o.born + o.died) / 2)}"></i>`).join("");
    const ticks = [0, 500, 1000, 1500, 2000].map((y) => `<span class="prf-lb-tick" style="left:${pct(y)}">${y}</span>`).join("");
    const works = s.works.map(([title, y]) => `<i class="prf-lb-work" style="left:${pct(y)}" title="${esc(title)}, ${y}"></i>`).join("");
    return `<div class="prf-lb" role="img" aria-label="Lived ${esc(years(s))}, shown on a line from year 0 to ${NOW}">
      <div class="prf-lb-track">${others}<b style="left:${pct(s.born)}; width:max(4px, calc(${pct(s.died)} - ${pct(s.born)}))"></b>${works}</div>${ticks}</div>`;
  };

  let shell, panel, body, list = [], index = 0, origin = null, maps = {}, lastView = null, viewBoxNow = null;
  let catalogueOrder = null;
  window.addEventListener("scholars:filter", (event) => { catalogueOrder = event.detail?.visible || null; });

  function build() {
    shell = document.createElement("div");
    shell.className = "prf";
    shell.innerHTML = `<div class="prf-scrim"></div>
      <div class="prf-panel" role="dialog" aria-modal="true" aria-labelledby="prf-name">
        <div class="prf-bar">
          <button type="button" class="prf-btn" data-go="-1" aria-label="Previous scholar">${icon("arrowLeft", 16)}</button>
          <button type="button" class="prf-btn" data-go="1" aria-label="Next scholar">${icon("arrowRight", 16)}</button>
          <span class="prf-count"></span>
          <button type="button" class="prf-btn prf-close" aria-label="Close">${icon("x", 16)}</button>
        </div>
        <div class="prf-body"></div>
      </div>`;
    document.body.append(shell);
    panel = shell.querySelector(".prf-panel");
    body = shell.querySelector(".prf-body");
    shell.querySelector(".prf-scrim").addEventListener("click", close);
    shell.querySelector(".prf-close").addEventListener("click", close);
    shell.addEventListener("click", (event) => { const go = event.target.closest("[data-go]"); if (go) step(Number(go.dataset.go)); });
    document.addEventListener("keydown", (event) => {
      if (!shell.classList.contains("prf-open")) return;
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    });
  }

  // ── Content ─────────────────────────────────────────────────────────────────────────────
  const areaBars = (s) => {
    const rows = Object.entries(s.mentions).sort((a, b) => b[1] - a[1]);
    if (!rows.length) return `<p class="prf-empty">Not named in the site's pages yet.</p>`;
    const top = rows[0][1];
    return `<ul class="prf-areas">${rows.map(([area, n]) => `<li><span>${esc(area)}</span><i><b style="width:${Math.max(6, n / top * 100)}%"></b></i></li>`).join("")}</ul>
      <p class="prf-note">Bars compare the site's areas with each other for this scholar, from a rough search of the site's own text.</p>`;
  };
  const extras = (s) => {
    const finds = S.finds.filter((f) => f.by.includes(s.id));
    const stepAt = S.chain.steps.findIndex(([id]) => id === s.id);
    let html = "";
    if (finds.length) html += `<section class="prf-card"><h3>Finds and digs</h3><ul class="prf-finds">${finds.map((f) => `<li><b>${esc(f.name)}</b><span>${f.year} · ${esc(f.where[0])}</span><p>${esc(f.line)}</p></li>`).join("")}</ul></section>`;
    if (stepAt >= 0) html += `<section class="prf-card"><h3>How the Bible reached English</h3><p class="prf-chain">Step <b>${stepAt + 1}</b> of ${S.chain.steps.length}: ${esc(S.chain.steps[stepAt][1])}.</p>
      <ol class="prf-chain-row">${S.chain.steps.map(([id], i) => `<li class="${i === stepAt ? "prf-on" : ""}">${esc(get(id).short)}</li>`).join("")}</ol></section>`;
    return html;
  };
  function content(s) {
    const [eraName, eraSpan] = eraParts(s.era);
    const use = s.site ? `<div class="prf-use">${siteBadge(s)}<p>${esc(s.site.note)}</p></div>` : `<p class="prf-empty">Not used on this site yet.</p>`;
    return `<div class="prf-grid" style="--tone: ${tone(s)}">
      <div class="prf-main">
        <header class="prf-head">${mark(s, 88)}<div>
          <p class="kicker">${esc(S.fields[s.field])}</p>
          <h2 id="prf-name">${esc(s.name)}</h2>
          <p class="prf-years">${esc(years(s))} <span>· lived ${esc(lived(s))}</span></p>
          <p class="prf-tags">${faithPill(s)}${siteBadge(s, true)}</p></div></header>
        <p class="prf-line">${esc(s.line)}</p>
        <dl class="prf-facts">
          <div><dt>Born</dt><dd>${s.circa ? "c. " : ""}${s.born}</dd></div><div><dt>Died</dt><dd>${s.circa ? "c. " : ""}${s.died}</dd></div>
          <div><dt>Faith</dt><dd>${esc(S.faiths[s.faith])}</dd></div><div><dt>Era</dt><dd>${esc(eraName)}<small>${esc(eraSpan)}</small></dd></div>
        </dl>
        <section><h3>Key works</h3><ol class="prf-works">${s.works.map(([title, year]) => `<li><b>${esc(title)}</b><span>${year}</span></li>`).join("")}</ol></section>
        <section><h3>How this site uses their work</h3>${use}</section>
        <section><h3>Where the site names them</h3>${areaBars(s)}</section>
      </div>
      <div class="prf-aside">
        <section class="prf-card"><h3>Across two thousand years</h3>${lifeBar(s)}
          <p class="prf-note">Their life on a line from the time of Christ to today. Small dots are their works; faint marks are the other scholars.</p></section>
        <section class="prf-card"><h3>Where they mainly worked</h3><div class="prf-map"></div><p class="prf-place">${icon("map", 14)}${esc(s.place[0])}</p></section>
        ${extras(s)}
      </div></div>`;
  }

  // ── Map: two cached SVGs (Mediterranean world, whole world); the view box glides to the scholar ─────────
  function mapFor(name) {
    if (maps[name]) return maps[name];
    const v = S.views[name];
    const others = Object.entries(v.points).filter(([key]) => !key.startsWith("find:")).map(([, [x, y]]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join("");
    const holder = document.createElement("div");
    holder.innerHTML = `<svg class="prf-svg" viewBox="0 0 ${v.width} ${v.height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="prf-land" fill-rule="evenodd" d="${v.land}"/><g class="prf-others">${others}</g><g class="prf-me"></g></svg>`;
    maps[name] = holder.firstElementChild;
    return maps[name];
  }
  const tweenViewBox = (svg, from, to) => {
    if (!from || reduced()) { svg.setAttribute("viewBox", to.join(" ")); viewBoxNow = to; return; }
    const start = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - start) / 520), k = 1 - Math.pow(1 - t, 3);
      viewBoxNow = from.map((a, i) => a + (to[i] - a) * k);
      svg.setAttribute("viewBox", viewBoxNow.join(" "));
      if (t < 1 && svg.isConnected) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  function drawMap(s, holder) {
    const name = S.views.med.points[s.id] ? "med" : "world";
    const v = S.views[name];
    if (!v.points[s.id]) { holder.hidden = true; return; }
    const svg = mapFor(name), [x, y] = v.points[s.id];
    const w = name === "med" ? 620 : 440, h = w * 0.62;
    const box = [Math.max(0, Math.min(v.width - w, x - w / 2)), Math.max(0, Math.min(v.height - h, y - h / 2)), w, h];
    const font = w / 30, finds = S.finds.filter((f) => f.by.includes(s.id) && v.points[`find:${f.id}`]);
    svg.querySelector(".prf-me").innerHTML = finds.map((f) => { const [fx, fy] = v.points[`find:${f.id}`]; return `<rect class="prf-find" x="${fx - 5}" y="${fy - 5}" width="10" height="10" transform="rotate(45 ${fx} ${fy})"/>`; }).join("")
      + `<circle class="prf-halo" cx="${x}" cy="${y}" r="${w / 34}"/><circle class="prf-dot" cx="${x}" cy="${y}" r="${w / 110}"/>`
      + `<text class="prf-label" x="${x + w / 40}" y="${y - w / 52}" style="font-size:${font}px">${esc(s.place[0])}</text>`;
    svg.style.setProperty("--tone", tone(s));
    holder.append(svg);
    tweenViewBox(svg, lastView === name ? viewBoxNow : null, box);
    lastView = name;
  }

  // ── Open, step, close ─────────────────────────────────────────────────────────────────────
  // A catalogue card hides while the panel stands in for it; any other origin stays where it is.
  const isCard = (el) => el?.classList?.contains("cat-card");
  function render() {
    const s = get(list[index]);
    body.innerHTML = content(s);
    drawMap(s, body.querySelector(".prf-map"));
    shell.querySelector(".prf-count").textContent = `${index + 1} of ${list.length}`;
    body.scrollTop = 0;
  }
  function open(id, from) {
    get(id);
    if (!shell) build();
    list = catalogueOrder?.includes(id) ? [...catalogueOrder] : [...S.scholars].sort((a, b) => a.born - b.born).map((s) => s.id);
    index = list.indexOf(id);
    const wasOpen = shell.classList.contains("prf-open");
    render();
    if (wasOpen) return;
    origin = from || null;
    shell.classList.add("prf-open");
    document.documentElement.classList.add("prf-lock");
    shell.querySelector(".prf-close").focus({ preventScroll: true });
    if (reduced()) return;
    const end = panel.getBoundingClientRect(), start = from?.getBoundingClientRect?.();
    if (start && start.width) {
      if (isCard(from)) from.classList.add("prf-lifted");
      panel.animate([{ transform: `translate(${start.left - end.left}px, ${start.top - end.top}px) scale(${start.width / end.width}, ${start.height / end.height})`, borderRadius: "28px", opacity: isCard(from) ? 1 : .2 },
        { transform: "none", borderRadius: "", opacity: 1 }], { duration: 520, easing: EASE });
    } else {
      panel.animate([{ transform: "translateY(24px) scale(.97)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: EASE });
    }
    body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 160, easing: "ease-out", fill: "backwards" });
  }
  function step(delta) {
    if (list.length < 2) return;
    index = (index + delta + list.length) % list.length;
    if (isCard(origin)) {
      origin.classList.remove("prf-lifted");
      const card = document.querySelector(`.cat-card[data-id="${CSS.escape(list[index])}"]`);
      origin = card;
      card?.classList.add("prf-lifted");
    } else origin = null; // the panel now shows someone else, so it should not shrink back into the first mark
    render();
    if (!reduced()) body.animate([{ opacity: 0, transform: `translateX(${delta * 14}px)` }, { opacity: 1, transform: "none" }], { duration: 300, easing: EASE });
  }
  function close() {
    if (!shell?.classList.contains("prf-open")) return;
    const done = () => {
      shell.classList.remove("prf-open");
      document.documentElement.classList.remove("prf-lock");
      origin?.classList?.remove("prf-lifted");
      const focusable = origin?.querySelector?.(".cat-card-hit") || origin;
      if (focusable?.focus) focusable.focus({ preventScroll: true });
      origin = null;
    };
    if (reduced()) return done();
    const target = origin && !origin.hidden && origin.isConnected ? origin.getBoundingClientRect() : null;
    shell.classList.add("prf-closing");
    const end = panel.getBoundingClientRect();
    const onScreen = target && target.width && target.bottom > 0 && target.top < innerHeight;
    const frames = onScreen
      ? [{ transform: "none" }, { transform: `translate(${target.left - end.left}px, ${target.top - end.top}px) scale(${target.width / end.width}, ${target.height / end.height})`, borderRadius: "28px", opacity: .4 }]
      : [{ transform: "none", opacity: 1 }, { transform: "translateY(18px) scale(.97)", opacity: 0 }];
    body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" });
    panel.animate(frames, { duration: onScreen ? 380 : 260, easing: onScreen ? EASE : "ease-in" }).onfinish = () => {
      shell.classList.remove("prf-closing");
      body.getAnimations().forEach((a) => a.cancel());
      done();
    };
  }

  window.Scholars.openProfile = (id, originElement) => {
    try { open(id, originElement); } catch (error) { console.error(`Scholars profile: could not open "${id}"`, error); }
  };
})();
