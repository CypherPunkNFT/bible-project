// The profile drawer: slides in from the right. Name, years, faith, field, place (on a small map), the one-line
// summary, key works, how this site uses their work, where the site names them, and any finds or chain step.
window.Drawer = (() => {
  const { D, byId, AREAS, featuresOf, esc, years, faith, field, tone, mono, weight, namedAreas, listWords } = Sc;
  let root, body, count, current = null, lastFocus = null;

  function build() {
    root = document.createElement("div");
    root.className = "dw";
    root.innerHTML = `<div class="dw-scrim"></div>
      <aside class="dw-panel" role="dialog" aria-modal="true" aria-label="Scholar profile">
        <div class="dw-bar"><button type="button" class="dw-prev" aria-label="Previous scholar">${icon("arrowLeft", 16)}</button>
          <button type="button" class="dw-next" aria-label="Next scholar">${icon("arrowRight", 16)}</button>
          <span class="dw-count"></span><button type="button" class="dw-close" aria-label="Close">${icon("x", 16)}</button></div>
        <div class="dw-body sc-scroll"></div>
      </aside>`;
    document.body.append(root);
    body = root.querySelector(".dw-body");
    count = root.querySelector(".dw-count");
    root.querySelector(".dw-scrim").addEventListener("click", close);
    root.querySelector(".dw-close").addEventListener("click", close);
    root.querySelector(".dw-prev").addEventListener("click", () => step(-1));
    root.querySelector(".dw-next").addEventListener("click", () => step(1));
    addEventListener("keydown", (e) => {
      if (!root.classList.contains("dw-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }

  const step = (delta) => {
    const i = D.scholars.indexOf(current);
    open(D.scholars[(i + delta + D.scholars.length) % D.scholars.length].id);
  };

  function mapHtml(s) {
    // The Mediterranean view (or the world, for those who worked elsewhere); zoomed to fit their finds when they have any.
    const viewName = D.views.med.points[s.id] ? "med" : "world";
    const view = D.views[viewName], [x, y] = view.points[s.id] || [];
    if (x === undefined) return "";
    const finds = D.finds.filter((f) => f.by.includes(s.id) && view.points[`find:${f.id}`]);
    let box = [0, 0, view.width, view.height];
    if (finds.length) {
      const ratio = view.height / view.width, pts = [[x, y], ...finds.map((f) => view.points[`find:${f.id}`])];
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      let w = Math.max(Math.max(...xs) - Math.min(...xs) + 160, 190), h = Math.max(Math.max(...ys) - Math.min(...ys) + 100, w * ratio);
      w = Math.min(view.width, Math.max(w, h / ratio)); h = w * ratio;
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
      box = [Math.min(Math.max(cx - w / 2, 0), view.width - w), Math.min(Math.max(cy - h / 2, 0), view.height - h), w, h];
    }
    const k = box[2] / view.width, r = (n) => (n * k).toFixed(1);
    const right = x > box[0] + box[2] * .7;
    const findMarks = finds.map((f) => {
      const [fx, fy] = view.points[`find:${f.id}`];
      return `<rect class="dw-find" x="${fx - 7 * k}" y="${fy - 7 * k}" width="${r(14)}" height="${r(14)}" rx="${r(3)}" transform="rotate(45 ${fx} ${fy})"/>`;
    }).join("");
    return `<svg class="dw-map" viewBox="${box.map((n) => n.toFixed(1)).join(" ")}" role="img" aria-label="${esc(s.place[0])} on a map">
      <path class="dw-land" d="${view.land}"/>${findMarks}
      <circle class="dw-halo" cx="${x}" cy="${y}" r="${r(26)}"/><circle class="dw-pt" cx="${x}" cy="${y}" r="${r(9)}"/>
      <text class="dw-label" x="${right ? x - 20 * k : x + 20 * k}" y="${y + 9 * k}" text-anchor="${right ? "end" : "start"}" style="font-size: ${r(30)}px; stroke-width: ${r(6)}px">${esc(s.place[0])}</text>
    </svg>${finds.length ? `<p class="dw-map-note"><i></i>${finds.length === 1 ? "A find" : "Finds"} linked to them, listed below</p>` : ""}`;
  }

  function useHtml(s) {
    if (!s.site) return `<p class="dw-empty">This site does not draw on their work yet.</p>`;
    const feats = featuresOf(s);
    const label = s.site.status === "in-use" ? "In use on the site" : "In the library, planned";
    return `<p class="dw-status dw-status-${s.site.status}"><span class="sc-use sc-use-${s.site.status}"></span>${label}</p>
      <p class="dw-note">${esc(s.site.note)}</p>
      ${feats.length ? `<div class="dw-feats">${feats.map((f) => `<span class="sc-chip" style="--tone: var(${f.tone})"><i></i>${esc(f.name)}</span>`).join("")}</div>` : ""}`;
  }

  function namedHtml(s) {
    const areas = namedAreas(s);
    if (!areas.length) return `<p class="dw-empty">Not named in the site's own pages yet.</p>`;
    const toneOf = Object.fromEntries(AREAS);
    return `<p class="dw-lead">Named in ${listWords(areas.map(esc))}. Bars compare them with the most-named scholar in each part of the site.</p>
      <ul class="dw-areas">${areas.map((a) => `<li style="--tone: var(${toneOf[a]})"><span>${esc(a)}</span><b><i style="width: ${Math.max(4, weight(s, a) * 100).toFixed(0)}%"></i></b></li>`).join("")}</ul>`;
  }

  function extrasHtml(s) {
    const finds = D.finds.filter((f) => f.by.includes(s.id));
    const chainAt = D.chain.steps.findIndex(([id]) => id === s.id);
    let html = "";
    if (finds.length) html += `<section><h3>Discoveries</h3><ul class="dw-finds">${finds.map((f) => `<li><b>${esc(f.name)}</b><small>${esc(f.where[0])} · ${esc(f.year)}</small><p>${esc(f.line)}</p></li>`).join("")}</ul></section>`;
    if (chainAt >= 0) {
      html += `<section><h3>How the Bible reached English</h3><p class="dw-lead">${esc(D.chain.steps[chainAt][1])}.</p>
        <ol class="dw-chain">${D.chain.steps.map(([id], i) => { const p = byId.get(id); return `<li${i === chainAt ? ' class="dw-here"' : ""}><button type="button" data-scholar="${id}">${esc(p.short)}</button></li>`; }).join("")}</ol></section>`;
    }
    return html;
  }

  function render(s) {
    const era = D.eras[s.era];
    body.style.setProperty("--tone", `var(${tone(s)})`);
    body.innerHTML = `<div class="dw-top">${mono(s, "dw-mono")}<div><p class="kicker">${esc(field(s))}</p><h2>${esc(s.name)}</h2>
        <p class="dw-years">${esc(years(s))}</p></div></div>
      <dl class="dw-facts"><div><dt>Faith</dt><dd>${esc(faith(s))}</dd></div><div><dt>Field</dt><dd>${esc(field(s))}</dd></div>
        <div><dt>Worked mainly in</dt><dd>${esc(s.place[0])}</dd></div><div><dt>Era</dt><dd>${esc(era)}</dd></div></dl>
      <p class="dw-line">${esc(s.line)}</p>
      <section>${mapHtml(s)}</section>
      <section><h3>Key works</h3><ul class="dw-works">${s.works.map((w) => `<li><span>${esc(w[0])}</span><b>${esc(w[1])}</b></li>`).join("")}</ul></section>
      <section><h3>How this site uses their work</h3>${useHtml(s)}</section>
      <section><h3>Where the site names them</h3>${namedHtml(s)}</section>
      ${extrasHtml(s)}`;
    body.scrollTop = 0;
    count.textContent = `${D.scholars.indexOf(s) + 1} of ${D.scholars.length} · by birth`;
  }

  function open(id) {
    const s = byId.get(id);
    if (!s) { console.error(`Drawer: no scholar with id "${id}"`); return; }
    if (!root) build();
    if (!root.classList.contains("dw-open")) lastFocus = document.activeElement;
    current = s;
    render(s);
    root.classList.add("dw-open");
    root.querySelector(".dw-close").focus({ preventScroll: true });
  }

  function close() {
    if (!root) return;
    root.classList.remove("dw-open");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  return { open, close };
})();
