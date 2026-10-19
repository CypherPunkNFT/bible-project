// Shared pieces for the Old maps mock-ups: look-ups over the generated data (data.js), the Atlas page frame (Back to
// Atlas, Open the map, the row of tiles), section headings, the figures bar, the subject "crystals", map thumbnails
// and their credits. The slide-in map viewer lives in viewer.js.
window.Sections = window.Sections || {};
window.OM = (() => {
  const D = window.OLDMAPS;
  const esc = (text) => String(text ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const subjects = D.subjects;
  const subjectByKey = new Map(subjects.map((s) => [s.key, s]));
  const subjectIndex = new Map(subjects.map((s, i) => [s.key, i]));
  const maps = D.maps;
  const mapById = new Map(maps.map((m) => [m.id, m]));
  const fmt = (n) => Number(n).toLocaleString("en-GB");
  const centuryOf = (year) => Math.floor(year / 100) + 1; // as the build counts them: 1500–1599 is "16"
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
  const ORDINAL = { 7: "seventh", 12: "twelfth", 13: "thirteenth", 14: "fourteenth", 15: "fifteenth", 16: "sixteenth", 17: "seventeenth", 18: "eighteenth", 19: "nineteenth", 20: "twentieth" };
  const tone = (key) => `var(${subjectByKey.get(key)?.tone ?? "--accent"})`;
  const dotHas = (dot, key) => (dot[1] >> subjectIndex.get(key)) & 1;

  // Small line icons, one per subject, drawn for these mock-ups (24-unit grid, like the site's lucide icons).
  const SUBJECT_ICONS = {
    "holy-land": '<path d="M2 19l5-8 4 5 3-5 8 8z"/><path d="M2 21h20"/>',
    jerusalem: '<path d="M3 21V11l3-2 3 2V8l3-3 3 3v3l3-2 3 2v10z"/><path d="M10 21v-3a2 2 0 0 1 4 0v3"/>',
    exodus: '<path d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M8 20h8"/>',
    tribes: [0, 1, 2, 3].flatMap((c) => [0, 1, 2].map((r) => `<circle cx="${4.5 + c * 5}" cy="${6 + r * 6}" r="1.4"/>`)).join(""),
    jesus: '<path d="M2.5 12c4-6 11.5-6 15.5 0-4 6-11.5 6-15.5 0z"/><path d="M18 12l3.5-3.5v7z"/>',
    paul: '<path d="M3 16h18l-2.5 4h-13z"/><path d="M12 3v13"/><path d="M12 4l6 9h-6"/><path d="M12 6l-5 7h5"/>',
    churches: '<path d="M12 3v17"/><path d="M5 7v4a7 7 0 0 0 14 0V7"/><path d="M8.5 7v4a3.5 3.5 0 0 0 7 0V7"/><path d="M8 21h8"/>',
    egypt: '<path d="M2 20 12 4l10 16z"/><path d="M12 4l3 16"/>',
    "near-east": '<path d="M3 21h18v-4H3z"/><path d="M5.5 17v-4h13v4"/><path d="M8 13V9h8v4"/><path d="M10.5 9V5h3v4"/>',
    eden: '<path d="M12 21v-7"/><path d="M12 14c-5 0-7.5-3-7.5-6.5a7.5 5.5 0 0 1 15 0C19.5 11 17 14 12 14z"/><path d="M9 21h6"/>',
    temple: '<path d="M3 9l9-5 9 5z"/><path d="M5.5 9v10M9.5 9v10M14.5 9v10M18.5 9v10"/><path d="M3 21h18"/>',
  };
  const subjectIcon = (key, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SUBJECT_ICONS[key] ?? ""}</svg>`;

  // A section heading in the house style: number, kicker, serif title with one italic accent word, one plain line.
  // Section heads sit flush left: the number rides on the label line ("01 · Through time"), not in its own column
  // (owner 2026-10-18, on the manuscripts pages; same here).
  const head = (num, kicker, title, lead) => `<header class="t-head om-head"><div><p class="kicker">${num ? `<span class="om-num">${num}</span><span class="om-dot" aria-hidden="true">·</span>` : ""}${kicker}</p><h2>${title}</h2>${lead ? `<p>${lead}</p>` : ""}</div></header>`;

  // The quiet figures bar: [label, value, note] in one row with thin dividers.
  const figures = (items) => `<dl class="om-figures">${items.map(([label, value, note]) => `<div><dt>${esc(label)}</dt><dd>${value}</dd>${note ? `<small>${esc(note)}</small>` : ""}</div>`).join("")}</dl>`;

  // Today's ground for one "One land" set (the Holy Land by default), in a square frame so it can turn without leaving
  // its box. Coordinates are scaled so the frame's longer side is about 315 units whatever its size (the Holy Land at
  // 100 units a degree, Jerusalem a few streets across), so dots and labels keep one size. The key place is drawn larger.
  function levantSVG({ cls = "om-modern-svg", labels = true, outline = D.levant } = {}) {
    const L = outline, [w, s, e, n] = L.frame, k = Math.cos(((s + n) / 2) * Math.PI / 180);
    const scale = 315 / Math.max((e - w) * k, n - s);
    const px = (lon, lat) => [((lon - w) * k * scale).toFixed(1), ((n - lat) * scale).toFixed(1)];
    const W = (e - w) * k * scale, H = (n - s) * scale, side = Math.max(W, H) * 1.04, ox = (W - side) / 2, oy = (H - side) / 2;
    const lines = L.lines.map((line) => `M${line.map(([lon, lat]) => px(lon, lat).join(" ")).join("L")}`).join("");
    const keyName = L.key ?? "Jerusalem";
    const LEFT = new Set(L.left ?? ["Sidon", "Tyre", "Joppa", "Gaza", "Bethlehem", "Hebron", "Beersheba"]); // label on the west side
    const places = L.places.map((p) => {
      const [x, y] = px(p.lon, p.lat), left = LEFT.has(p.n), key = p.n === keyName;
      const label = labels || key ? `<text x="${left ? -7 : 7}" y="3.5"${left ? ' text-anchor="end" class="is-left"' : ""}>${esc(p.n)}</text>` : "";
      return `<g transform="translate(${x} ${y})" class="${key ? "is-key" : ""}"><circle r="${key ? 5 : 3}"/>${label}</g>`;
    }).join("");
    const waters = (L.waters ?? []).map((wtr) => { const [x, y] = px(wtr.lon, wtr.lat); return `<text class="om-water" x="${x}" y="${y}" text-anchor="middle">${esc(wtr.n)}</text>`; }).join("");
    return `<svg class="${cls}" viewBox="${ox.toFixed(1)} ${oy.toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}" role="img" aria-label="The same ground on today's map">
      <g class="om-modern-turn" style="transform-origin:${(W / 2).toFixed(1)}px ${(H / 2).toFixed(1)}px"><path class="om-coast" d="${lines}"/>${waters}${places}
      <g class="om-north" transform="translate(${(ox + 30).toFixed(1)} ${(oy + 30).toFixed(1)})"><path d="M0 -16L5 4 0 0 -5 4Z"/><text y="16">N</text></g></g></svg>`;
  }

  // The landing every direction opens with: crumbs, the big plain-type title, a lede, a drawing, the figures bar.
  const landing = (section, { kicker, title, lede, figureItems, art = "old-maps" }) => {
    section.classList.add("om-landing");
    section.innerHTML = `<div><p class="om-crumb"><a href="/study">Study</a><span>/</span><a href="/study/atlas">Atlas</a><span>/</span>${kicker}</p>
        <h1>${title}</h1><p class="om-lede">${lede}</p></div>
      <div>${art ? Art.card(art) : ""}</div>${figures(figureItems)}`;
  };

  // One map as a picture with its caption; [data-map] opens the viewer.
  const thumb = (m, { caption = true, cls = "" } = {}) => `<button type="button" class="om-thumb ${cls}" data-map="${m.id}" style="--tone:${tone(m.s[0])}" aria-label="${esc(`${m.y ?? "Undated"}, ${m.t}`)}">
      <span class="om-thumb-img"><img src="${m.th}" width="${m.tw}" height="${m.thh}" alt="" loading="lazy" decoding="async"></span>
      ${caption ? `<span class="om-thumb-cap"><b>${m.y ?? "Undated"}</b><span>${esc(m.t)}</span>${m.m ? `<small>${esc(m.m)}</small>` : ""}</span>` : ""}</button>`;

  // The credit every shown image carries: who to credit, and the licence.
  const creditLine = (m) => `${esc(m.credit)} · ${esc(m.lic)}`;

  // Subject "crystals": large chips with colour, icon and count; tapping one filters. onChange receives the Set of keys.
  function crystals(container, { keys = subjects.map((s) => s.key), count = (s) => s.count, onChange, single = false } = {}) {
    const chosen = new Set();
    container.classList.add("om-crystals");
    container.innerHTML = keys.map((key) => {
      const s = subjectByKey.get(key);
      return `<button type="button" class="om-crystal" data-key="${key}" aria-pressed="false" style="--tone:var(${s.tone})">
        <span class="om-crystal-ico">${subjectIcon(key, 20)}</span><span class="om-crystal-txt"><strong>${esc(s.short)}</strong><small>${fmt(count(s))} maps</small></span></button>`;
    }).join("");
    container.addEventListener("click", (event) => {
      const button = event.target.closest(".om-crystal");
      if (!button) return;
      const key = button.dataset.key;
      if (chosen.has(key)) chosen.delete(key);
      else { if (single) chosen.clear(); chosen.add(key); }
      container.querySelectorAll(".om-crystal").forEach((b) => b.setAttribute("aria-pressed", String(chosen.has(b.dataset.key))));
      container.classList.toggle("has-choice", chosen.size > 0);
      onChange?.(new Set(chosen));
    });
    return chosen;
  }

  // The Atlas destination frame around a direction: Back to Atlas, Open the map and the nine tiles, Old maps current.
  function atlasFrame(main) {
    const shell = document.createElement("div");
    shell.className = "wrap om-page";
    shell.innerHTML = `<div class="places-topline"><a href="/study/atlas">${icon("arrowLeft", 15)}Back to Atlas</a><a href="/study/atlas/map">Open the map ${icon("arrowUp", 13)}</a></div>
      <nav class="om-tiles" aria-label="Explore the collection">${Art.TILES.map((t) => `<a href="${t.href}" style="--tile:var(--${t.color})"${t.id === "old-maps" ? ' aria-current="page"' : ""}>
        <svg class="om-tile-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t.icon}</svg><span>${t.title}</span>${icon("arrowUp", 14)}</a>`).join("")}</nav>`;
    main.append(shell);
    return shell;
  }

  // Clicking any [data-map] inside root opens it in the slide-in viewer.
  function bindOpen(root) {
    root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-map]");
      if (target && mapById.has(target.dataset.map)) Viewer.open(target.dataset.map, target);
    });
  }

  return { D, esc, fmt, subjects, subjectByKey, subjectIndex, maps, mapById, centuryOf, ROMAN, ORDINAL, tone, dotHas, subjectIcon, head, figures, landing, levantSVG, thumb, creditLine, crystals, atlasFrame, bindOpen };
})();
