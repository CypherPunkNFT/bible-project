// The index · the profile: clicking a scholar anywhere grows a large panel out of what was clicked (a shared-element
// transition: the panel starts at the card's box and expands). It holds everything the data has on them, a life bar
// on a 0–2026 line and a small map of where they worked. Prev / next walk the gallery's current order.
window.IX.profile = (() => {
  const { S, esc, tone, get, years, lived, eraParts, mark, siteBadge, faithPill, lifeBar, emit, on, reduced } = IX;
  const EASE = "cubic-bezier(.16, 1, .3, 1)";
  let shell, panel, body, list = [], index = 0, origin = null, maps = {}, lastView = null, viewBoxNow = null;

  function build() {
    shell = document.createElement("div");
    shell.className = "pf";
    shell.innerHTML = `<div class="pf-scrim"></div>
      <div class="pf-panel" role="dialog" aria-modal="true" aria-labelledby="pf-name">
        <div class="pf-bar">
          <button type="button" class="pf-btn" data-go="-1" aria-label="Previous scholar">${icon("arrowLeft", 16)}</button>
          <button type="button" class="pf-btn" data-go="1" aria-label="Next scholar">${icon("arrowRight", 16)}</button>
          <span class="pf-count"></span>
          <button type="button" class="pf-compare">Compare side by side</button>
          <button type="button" class="pf-btn pf-close" aria-label="Close">${icon("x", 16)}</button>
        </div>
        <div class="pf-body"></div>
      </div>`;
    document.body.append(shell);
    panel = shell.querySelector(".pf-panel");
    body = shell.querySelector(".pf-body");
    shell.querySelector(".pf-scrim").addEventListener("click", close);
    shell.querySelector(".pf-close").addEventListener("click", close);
    shell.querySelector(".pf-compare").addEventListener("click", () => { const id = list[index]; close(); emit("compare", id); });
    shell.addEventListener("click", (event) => { const go = event.target.closest("[data-go]"); if (go) step(Number(go.dataset.go)); });
    document.addEventListener("keydown", (event) => {
      if (!shell.classList.contains("pf-open")) return;
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    });
  }

  // ── Content ─────────────────────────────────────────────────────────────────────────────
  const areaBars = (s) => {
    const rows = Object.entries(s.mentions).sort((a, b) => b[1] - a[1]);
    if (!rows.length) return `<p class="pf-empty">Not named in the site's pages yet.</p>`;
    const top = rows[0][1];
    return `<ul class="pf-areas">${rows.map(([area, n]) => `<li><span>${esc(area)}</span><i><b style="width:${Math.max(6, n / top * 100)}%"></b></i></li>`).join("")}</ul>
      <p class="pf-note">Bars compare the site's areas with each other for this scholar, from a rough search of the site's own text.</p>`;
  };
  const extras = (s) => {
    const finds = S.finds.filter((f) => f.by.includes(s.id));
    const stepAt = S.chain.steps.findIndex(([id]) => id === s.id);
    let html = "";
    if (finds.length) html += `<section class="pf-card"><h3>Finds and digs</h3><ul class="pf-finds">${finds.map((f) => `<li><b>${esc(f.name)}</b><span>${f.year} · ${esc(f.where[0])}</span><p>${esc(f.line)}</p></li>`).join("")}</ul></section>`;
    if (stepAt >= 0) html += `<section class="pf-card"><h3>How the Bible reached English</h3><p class="pf-chain">Step <b>${stepAt + 1}</b> of ${S.chain.steps.length}: ${esc(S.chain.steps[stepAt][1])}.</p>
      <ol class="pf-chain-row">${S.chain.steps.map(([id], i) => `<li class="${i === stepAt ? "on" : ""}" title="${esc(get(id).short)}">${esc(get(id).short)}</li>`).join("")}</ol></section>`;
    return html;
  };
  function content(s) {
    const [eraName, eraSpan] = eraParts(s.era);
    const use = s.site ? `<div class="pf-use">${siteBadge(s)}<p>${esc(s.site.note)}</p></div>` : `<p class="pf-empty">Not used on this site yet.</p>`;
    return `<div class="pf-grid" style="--tone: ${tone(s)}">
      <div class="pf-main">
        <header class="pf-head">${mark(s, 88)}<div>
          <p class="kicker">${esc(S.fields[s.field])}</p>
          <h2 id="pf-name">${esc(s.name)}</h2>
          <p class="pf-years">${esc(years(s))} <span>· lived ${esc(lived(s))}</span></p>
          <p class="pf-tags">${faithPill(s)}${siteBadge(s, true)}</p></div></header>
        <p class="pf-line">${esc(s.line)}</p>
        <dl class="pf-facts">
          <div><dt>Born</dt><dd>${s.circa ? "c. " : ""}${s.born}</dd></div><div><dt>Died</dt><dd>${s.circa ? "c. " : ""}${s.died}</dd></div>
          <div><dt>Faith</dt><dd>${esc(S.faiths[s.faith])}</dd></div><div><dt>Era</dt><dd>${esc(eraName)}<small>${esc(eraSpan)}</small></dd></div>
        </dl>
        <section><h3>Key works</h3><ol class="pf-works">${s.works.map(([title, year]) => `<li><b>${esc(title)}</b><span>${year}</span></li>`).join("")}</ol></section>
        <section><h3>How this site uses their work</h3>${use}</section>
        <section><h3>Where the site names them</h3>${areaBars(s)}</section>
      </div>
      <div class="pf-aside">
        <section class="pf-card"><h3>Across two thousand years</h3>${lifeBar(s, { ticks: true, others: true })}
          <p class="pf-note">Their life on a line from the time of Christ to today. Small dots are their works; faint marks are the other scholars.</p></section>
        <section class="pf-card"><h3>Where they mainly worked</h3><div class="pf-map"></div><p class="pf-place">${icon("map", 14)}${esc(s.place[0])}</p></section>
        ${extras(s)}
      </div></div>`;
  }

  // ── Map: two cached SVGs (Mediterranean world, whole world); the view box pans to the scholar ─────────────
  function mapFor(name) {
    if (maps[name]) return maps[name];
    const v = S.views[name];
    const others = Object.entries(v.points).filter(([key]) => !key.startsWith("find:")).map(([, [x, y]]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join("");
    const holder = document.createElement("div");
    holder.innerHTML = `<svg class="pf-svg" viewBox="0 0 ${v.width} ${v.height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="pf-land" d="${v.land}"/><g class="pf-others">${others}</g><g class="pf-me"></g></svg>`;
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
    const v = S.views[name], svg = mapFor(name), [x, y] = v.points[s.id];
    const w = name === "med" ? 620 : 440, h = w * 0.62;
    const box = [Math.max(0, Math.min(v.width - w, x - w / 2)), Math.max(0, Math.min(v.height - h, y - h / 2)), w, h];
    const font = w / 30, finds = S.finds.filter((f) => f.by.includes(s.id) && v.points[`find:${f.id}`]);
    svg.querySelector(".pf-me").innerHTML = finds.map((f) => { const [fx, fy] = v.points[`find:${f.id}`]; return `<rect class="pf-find" x="${fx - 5}" y="${fy - 5}" width="10" height="10" transform="rotate(45 ${fx} ${fy})"/>`; }).join("")
      + `<circle class="pf-halo" cx="${x}" cy="${y}" r="${w / 34}"/><circle class="pf-dot" cx="${x}" cy="${y}" r="${w / 110}"/>`
      + `<text class="pf-label" x="${x + w / 40}" y="${y - w / 52}" style="font-size:${font}px">${esc(s.place[0])}</text>`;
    svg.style.setProperty("--tone", tone(s));
    holder.append(svg);
    tweenViewBox(svg, lastView === name ? viewBoxNow : null, box);
    lastView = name;
  }

  // ── Open, step, close ─────────────────────────────────────────────────────────────────────
  function render() {
    const s = get(list[index]);
    body.innerHTML = content(s);
    drawMap(s, body.querySelector(".pf-map"));
    shell.querySelector(".pf-count").textContent = `${index + 1} of ${list.length}`;
    body.scrollTop = 0;
  }
  function open(id, from, order) {
    if (!shell) build();
    list = order?.includes(id) ? [...order] : S.scholars.map((s) => s.id);
    index = list.indexOf(id);
    const wasOpen = shell.classList.contains("pf-open");
    render();
    if (wasOpen) return;
    origin = from || null;
    shell.classList.add("pf-open");
    document.documentElement.classList.add("pf-lock");
    shell.querySelector(".pf-close").focus({ preventScroll: true });
    if (reduced()) return;
    const end = panel.getBoundingClientRect(), start = from?.getBoundingClientRect();
    if (start && start.width) {
      if (from.classList.contains("ix-card")) from.classList.add("ix-lifted");
      panel.animate([{ transform: `translate(${start.left - end.left}px, ${start.top - end.top}px) scale(${start.width / end.width}, ${start.height / end.height})`, borderRadius: "28px" }, { transform: "none", borderRadius: "" }],
        { duration: 520, easing: EASE });
    } else {
      panel.animate([{ transform: "translateY(24px) scale(.97)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: EASE });
    }
    body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 160, easing: "ease-out", fill: "backwards" });
  }
  function step(delta) {
    if (list.length < 2) return;
    index = (index + delta + list.length) % list.length;
    const card = IX.gallery.cardFor(list[index]);
    if (origin?.classList.contains("ix-card")) { origin.classList.remove("ix-lifted"); origin = card; card.classList.add("ix-lifted"); }
    render();
    if (!reduced()) body.animate([{ opacity: 0, transform: `translateX(${delta * 14}px)` }, { opacity: 1, transform: "none" }], { duration: 300, easing: EASE });
  }
  function close() {
    if (!shell?.classList.contains("pf-open")) return;
    const done = () => {
      shell.classList.remove("pf-open");
      document.documentElement.classList.remove("pf-lock");
      origin?.classList.remove("ix-lifted");
      origin?.querySelector?.(".ix-card-hit")?.focus({ preventScroll: true });
      origin = null;
    };
    const target = origin && !origin.hidden ? origin.getBoundingClientRect() : null;
    if (reduced()) return done();
    shell.classList.add("pf-closing");
    const end = panel.getBoundingClientRect();
    const onScreen = target && target.width && target.bottom > 0 && target.top < innerHeight;
    const frames = onScreen
      ? [{ transform: "none" }, { transform: `translate(${target.left - end.left}px, ${target.top - end.top}px) scale(${target.width / end.width}, ${target.height / end.height})`, borderRadius: "28px", opacity: .4 }]
      : [{ transform: "none", opacity: 1 }, { transform: "translateY(18px) scale(.97)", opacity: 0 }];
    body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" });
    panel.animate(frames, { duration: onScreen ? 380 : 260, easing: onScreen ? EASE : "ease-in" }).onfinish = () => {
      shell.classList.remove("pf-closing");
      body.getAnimations().forEach((a) => a.cancel());
      done();
    };
  }

  on("open", open);
  return { open, close };
})();
