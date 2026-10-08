// "Two thousand years" (Scholars, direction B): what every section shares — the data, the colour each faith is
// painted in, year formats, the order of the five fields and the four eras. Sections register as Yrs.sections.<key>.
window.Yrs = (() => {
  const D = window.SCHOLARS;
  if (!D || !Array.isArray(D.scholars)) throw new Error("Two thousand years: window.SCHOLARS missing (expected ../shared/scholars-data.js to load first)");
  const TODAY = new Date().getFullYear();
  const scholars = D.scholars;
  const byId = new Map(scholars.map((s) => [s.id, s]));

  // Colour on this page always means faith; the lane (or the label beside it) always means field.
  const FAITH_TONE = { jewish: "--prophets", roman: "--history", early: "--poetry", catholic: "--gospels", protestant: "--epistles", unrecorded: "--muted" };
  const FAITH_ORDER = ["jewish", "roman", "early", "catholic", "protestant", "unrecorded"].filter((f) => D.faiths[f]);

  // Fields in the order each first appears in time, so the lanes read like a staircase from the ancient world to today.
  const FIELD_ORDER = Object.keys(D.fields).map((f) => [f, Math.min(...scholars.filter((s) => s.field === f).map((s) => s.born))])
    .filter(([, first]) => Number.isFinite(first)).sort((a, b) => a[1] - b[1]).map(([f]) => f);

  const ERAS = [
    { key: "ancient", from: 0, to: 500, short: "Ancient" },
    { key: "medieval", from: 500, to: 1500, short: "Middle Ages" },
    { key: "early-modern", from: 1500, to: 1800, short: "Reformation" },
    { key: "modern", from: 1800, to: TODAY, short: "Modern" },
  ].map((e) => ({ ...e, label: D.eras[e.key] || e.short }));

  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const tone = (s) => `var(${FAITH_TONE[s.faith] || "--muted"})`;
  const years = (s) => `${s.circa ? "c. " : ""}${s.born}–${s.died}`;
  const faith = (s) => D.faiths[s.faith] || D.faiths.unrecorded;
  const field = (s) => D.fields[s.field] || s.field;
  const fmt = (n) => n.toLocaleString("en-US");
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const aliveIn = (s, from, to) => s.born <= to && s.died >= from;
  const sameTime = (s) => scholars.filter((o) => o !== s && aliveIn(o, s.born, s.died));

  // A scholar's name as a button that opens their profile; used by every section.
  const nameButton = (s, label = s.name, cls = "") =>
    `<button type="button" class="yr-who ${cls}" data-open="${esc(s.id)}" style="--tone:${tone(s)}">${esc(label)}</button>`;

  // One delegated listener: any element with data-open="<scholar id>" opens that profile.
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-open]");
    if (!target || !window.YrsDrawer) return;
    const id = target.getAttribute("data-open");
    if (!byId.has(id)) { console.error(`Two thousand years: no scholar with id "${id}" (from a data-open attribute)`); return; }
    YrsDrawer.open(id);
  });

  return { D, TODAY, scholars, byId, FAITH_TONE, FAITH_ORDER, FIELD_ORDER, ERAS, esc, tone, years, faith, field, fmt, reduced, aliveIn, sameTime, nameButton, sections: {} };
})();
