// The index · shared helpers: tones, labels, the generated typographic marks, life bars and a tiny event bus.
// Every fact comes from window.SCHOLARS (hand-entered, not yet source-checked); nothing here adds to it.
window.IX = (() => {
  const S = window.SCHOLARS;
  const byId = new Map(S.scholars.map((s) => [s.id, s]));
  const TONE = { history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels" };
  const NOW = 2026;
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const tone = (s) => `var(${TONE[s.field]})`;
  const get = (id) => {
    const s = byId.get(id);
    if (!s) throw new Error(`IX.get: no scholar with id "${id}" (expected one of ${byId.size} ids in SCHOLARS.scholars)`);
    return s;
  };

  // "c. 37–c. 100" for circa lives, "354–430" otherwise.
  const years = (s) => (s.circa ? `c. ${s.born}–c. ${s.died}` : `${s.born}–${s.died}`);
  const lived = (s) => `${s.circa ? "about " : ""}${s.died - s.born} years`;
  const surname = (s) => s.short.split(" ").at(-1);
  const weight = (s) => Object.values(s.mentions).reduce((a, n) => a + n, 0);
  const keyWork = (s) => s.works[0];

  // Era labels are long ("The ancient world (to 500)"); split into a short name and its span.
  const eraParts = (key) => {
    const m = S.eras[key].match(/^(?:The )?(.+?) \((.+)\)$/);
    if (!m) return [S.eras[key], ""];
    return [m[1][0].toUpperCase() + m[1].slice(1), m[2]];
  };

  // Monogram: first and last initial of the name before any "of" / "the" ("Origen of Alexandria" → O).
  const initials = (s) => {
    const words = s.name.split(/ (?:of|the) /)[0].split(" ").filter((w) => !/^(von|van|de)$/i.test(w));
    return words.length === 1 ? words[0][0] : words[0][0] + words.at(-1)[0];
  };

  // One shape per field, drawn in a 48 × 48 box.
  const SHAPES = {
    history: (k) => `<circle cx="24" cy="24" r="${22 * k}"/>`,
    texts: (k) => { const r = 21 * k; return `<rect x="${24 - r}" y="${24 - r}" width="${2 * r}" height="${2 * r}" rx="${11 * k}"/>`; },
    places: (k) => `<path d="${[0, 1, 2, 3, 4, 5].map((i) => { const a = Math.PI / 3 * i - Math.PI / 2; return `${i ? "L" : "M"}${(24 + 23 * k * Math.cos(a)).toFixed(2)} ${(24 + 23 * k * Math.sin(a)).toFixed(2)}`; }).join("")}Z" stroke-linejoin="round"/>`,
    reference: (k) => `<rect x="${24 - 16 * k}" y="${24 - 22 * k}" width="${32 * k}" height="${44 * k}" rx="${7 * k}"/>`,
    theology: (k) => { const w = 19 * k, top = 24 - 21 * k, bot = 24 + 21 * k; return `<path d="M${24 - w} ${bot}V${top + w}A${w} ${w} 0 0 1 ${24 + w} ${top + w}V${bot}Z"/>`; },
  };
  const mark = (s, size = 52) => {
    const t = tone(s), ini = initials(s);
    return `<svg class="ix-mark" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true">
      <g style="fill: color-mix(in srgb, ${t} 15%, var(--surface)); stroke: color-mix(in srgb, ${t} 50%, transparent)" stroke-width="1.1">${SHAPES[s.field](1)}</g>
      <g fill="none" style="stroke: color-mix(in srgb, ${t} 22%, transparent)" stroke-width=".8">${SHAPES[s.field](.82)}</g>
      <text x="24" y="25" text-anchor="middle" dominant-baseline="central" style="fill: ${t}; font: ${ini.length > 1 ? 500 : 400} ${ini.length > 1 ? 15.5 : 21}px var(--serif); letter-spacing: -.02em">${esc(ini)}</text></svg>`;
  };
  const shapeIcon = (field, size = 14) => `<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true" style="fill: color-mix(in srgb, var(${TONE[field]}) 22%, transparent); stroke: var(${TONE[field]})" stroke-width="4">${SHAPES[field](.9)}</svg>`;

  const siteBadge = (s, compact) => {
    if (!s.site) return "";
    const used = s.site.status === "in-use";
    return `<span class="ix-badge ${used ? "ix-badge-used" : "ix-badge-held"}">${used ? "<i></i>Used on this site" : compact ? "In the library" : "In the library, planned"}</span>`;
  };
  const faithPill = (s) => `<span class="ix-faith">${esc(S.faiths[s.faith])}</span>`;

  // A life on the 0–2026 axis. Percent positions only, so it scales with its box.
  const pct = (year) => `${(Math.max(0, Math.min(NOW, year)) / NOW * 100).toFixed(3)}%`;
  const lifeBar = (s, { ticks = false, others = false } = {}) => {
    const others_ = others ? S.scholars.filter((o) => o.id !== s.id).map((o) => `<i class="ix-lb-other" style="left:${pct((o.born + o.died) / 2)}"></i>`).join("") : "";
    const tickHtml = ticks ? [0, 500, 1000, 1500, 2000].map((y) => `<span class="ix-lb-tick" style="left:${pct(y)}">${y}</span>`).join("") : "";
    const works = ticks ? s.works.map(([title, y]) => `<i class="ix-lb-work" style="left:${pct(y)}" title="${esc(title)}, ${y}"></i>`).join("") : "";
    return `<div class="ix-lb${ticks ? " ix-lb-big" : ""}" style="--tone:${tone(s)}" role="img" aria-label="Lived ${esc(years(s))}, shown on a line from year 0 to ${NOW}">
      <div class="ix-lb-track">${others_}<b style="left:${pct(s.born)}; width:max(4px, calc(${pct(s.died)} - ${pct(s.born)}))"></b>${works}</div>${tickHtml}</div>`;
  };

  // Bus: "open" (profile), "filter" (gallery changed), "compare" (pick a scholar to compare).
  const handlers = {};
  const on = (name, fn) => { (handlers[name] ||= []).push(fn); };
  const emit = (name, ...args) => (handlers[name] || []).forEach((fn) => {
    try { fn(...args); } catch (error) { console.error(`IX: a "${name}" handler failed`, error); }
  });
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  return { S, NOW, TONE, esc, tone, get, years, lived, surname, weight, keyWork, eraParts, initials, mark, shapeIcon, siteBadge, faithPill, pct, lifeBar, on, emit, reduced };
})();
