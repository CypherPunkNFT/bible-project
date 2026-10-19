// Shared pieces for the "How the canon took shape" mock-ups: text helpers, look-ups into data.js (window.CN), the
// source links every claim carries, the section heading, and the tones each kind of evidence is drawn in.
window.Sections = window.Sections || {};
(() => {
  const esc = (text) => String(text ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const D = CN.dossier;
  const records = D.records;
  const byId = new Map(records.map((r) => [r.id, r]));
  const sourceById = new Map(D.sources.map((s) => [s.id, s]));
  const pictureFor = new Map(CN.pictured.filter((p) => p.record).map((p) => [p.record, p]));
  const name = (id) => CN.names[id] ?? id;

  // The source links under every claim, opening in a new tab, exactly as the live page lists them.
  function cite(ids) {
    return `<div class="cn-cite">${ids.map((id) => {
      const s = sourceById.get(id);
      if (!s) { console.error(`canon mock-up: source "${id}" is not in the research file's sources`); return ""; }
      return `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}<span aria-hidden="true"> ↗</span></a>`;
    }).join("")}</div>`;
  }
  // A section heading in the house style, flush left: number and label on one small line, serif title, one plain line.
  const head = (num, kicker, h2, lead) => `<header class="t-head ms-head"><div><p class="kicker">${num ? `<span class="ms-num">${num}</span><span class="ms-dot" aria-hidden="true">·</span>` : ""}${kicker}</p><h2>${h2}</h2>${lead ? `<p>${lead}</p>` : ""}</div></header>`;

  // Each record's own kind, as written, sorted into one of four lanes (data.js "lanes"); the lane sets the tone.
  const LANE_TONE = { carried: "--history", used: "--gospels", listed: "--prophets", decided: "--revelation" };
  const laneOf = new Map(CN.lanes.flatMap((lane) => lane.ids.map((id) => [id, lane])));
  const tone = (id) => `var(${LANE_TONE[laneOf.get(id)?.key] ?? "--accent"})`;
  const ERA_SPANS = ["Before & around the turn of the era", "2nd–3rd centuries", "4th century", "Late antiquity–Reformation"];

  // A picture's address: the data URI from the manuscripts mock-up's images.js (the preview serves no .jpg), else the JPEG.
  const imgSrc = (q) => window.MS_IMG?.[q] ?? `../manuscripts-directions/assets/${q}.jpg`;
  const pictureWhat = (p) => p.file.replace(/\.(jpe?g|png|gif)$/i, "");
  const credit = (p) => `${esc(p.credit)} · ${esc(p.licence)} · <a href="${esc(p.page)}" target="_blank" rel="noopener">Wikimedia Commons</a>`;

  // Small line glyphs for the kinds of witness in the cabinet and on the map.
  const GLYPHS = {
    carried: '<path d="M12 6.5c-2-1.6-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><path d="M12 6.5V20"/>',
    used: '<path d="M6 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6"/><ellipse cx="6" cy="12" rx="2" ry="7"/><path d="M10 9h6M10 12h6M10 15h4"/>',
    listed: '<path d="M7 4h10l2 2v14H5V6z"/><path d="M9 9h6M9 12h6M9 15h4"/><circle cx="7.6" cy="9" r=".4"/>',
    decided: '<path d="M12 3v3M5 8h14M7 8l-3 7h6zM17 8l-3 7h6zM9 21h6M12 6v15"/>',
  };
  const glyph = (id, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[laneOf.get(id)?.key] ?? GLYPHS.listed}</svg>`;

  // The live page's note under its timeline, shown under whichever view of the records a direction uses.
  const bridge = () => `<aside class="cn-bridge"><span class="kicker">What changed over time?</span><p>Use, copying and explicit boundaries overlapped. A council could regulate an inherited collection; a bishop could distinguish books for instruction from books in his canon. <strong>No single meeting in this record selected a Bible for every tradition.</strong></p><p class="cn-caption">Compare Athanasius, the African Code and Trent above. Greek biblical collections also require attention to the particular manuscript: “the Septuagint” should not be treated as one surviving ancient volume with a universal contents page.</p>${cite(["carthage", "sinaiticus"])}</aside>`;

  Object.assign(window, { esc, cite, head, CNX: { D, records, byId, name, pictureFor, tone, laneOf, ERA_SPANS, imgSrc, pictureWhat, credit, glyph, bridge } });
})();
