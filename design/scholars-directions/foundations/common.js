// Shared helpers for the Foundations direction: lookups, labels, tones and the small pieces every section draws
// (monograms, faith chips, section headings). Sections register as Sections.<key> = { mount(sectionElement) }.
window.Sections = window.Sections || {};
window.Sc = (() => {
  const D = window.SCHOLARS;
  if (!D || !Array.isArray(D.scholars)) throw new Error("Foundations: window.SCHOLARS is missing (expected ../shared/scholars-data.js to load first)");
  const byId = new Map(D.scholars.map((s) => [s.id, s]));
  const FIELD_TONE = { history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels" };
  // Site areas in `mentions`, each with the tone used wherever that area is drawn.
  const AREAS = [["Letters study", "--epistles"], ["Apologetics", "--revelation"], ["Topics", "--poetry"], ["People pages", "--history"], ["Rulers", "--prophets"]];

  // The live features, read from each in-use scholar's own site note (no hand-made mapping).
  const FEATURES = [
    { id: "topics", name: "Topics", tone: "--poetry", test: /Topics/ },
    { id: "miracles", name: "Miracles", tone: "--acts", test: /miracles/i },
    { id: "harmony", name: "Gospel harmony", tone: "--gospels", test: /Gospel harmony/ },
    { id: "letters", name: "Letters study", tone: "--epistles", test: /Letters study/ },
  ];
  const featuresOf = (s) => (s.site?.status === "in-use" ? FEATURES.filter((f) => f.test.test(s.site.note)) : []);
  for (const s of D.scholars) {
    if (s.site?.status === "in-use" && featuresOf(s).length === 0) console.error(`Foundations: ${s.id} is in use but its note names no known feature: "${s.site.note}"`);
  }

  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const years = (s) => `${s.circa ? "c. " : ""}${s.born}–${s.died}`;
  const faith = (s) => D.faiths[s.faith] || D.faiths.unrecorded;
  const field = (s) => D.fields[s.field];
  const tone = (s) => FIELD_TONE[s.field] || "--accent";
  // Initials from the name before any "of …"/"the …": Flavius Josephus → FJ, Origen of Alexandria → O, A. T. Robertson → AR.
  const monogram = (s) => {
    const words = s.name.split(/ (?:of|the) /)[0].split(/\s+/).filter((w) => /^[A-Z]/.test(w));
    return words.length > 1 ? words[0][0] + words.at(-1)[0] : words[0][0];
  };
  const mono = (s, cls = "") => `<span class="sc-mono ${cls}" style="--tone: var(${tone(s)})" aria-hidden="true">${esc(monogram(s))}</span>`;
  const workText = (w) => `${esc(w[0])} <span class="sc-yr">(${esc(w[1])})</span>`;
  const status = (s) => (s.site ? s.site.status : null);

  // Relative weight of each mention: the scholar's count against the most-named scholar in that area (0–1).
  const areaMax = Object.fromEntries(AREAS.map(([a]) => [a, Math.max(...D.scholars.map((s) => s.mentions[a] || 0))]));
  const weight = (s, area) => (s.mentions[area] ? s.mentions[area] / areaMax[area] : 0);
  const namedAreas = (s) => AREAS.map(([a]) => a).filter((a) => s.mentions[a]).sort((a, b) => weight(s, b) - weight(s, a));

  const head = (num, kicker, title, line) => `<header class="sc-head"><p class="kicker"><span class="sc-num">${num}</span>${kicker}</p>
    <h2>${title}</h2>${line ? `<p class="sc-line">${line}</p>` : ""}</header>`;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const listWords = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

  // Delegated clicks: any element with data-scholar opens that profile.
  document.addEventListener("click", (event) => {
    const hit = event.target.closest("[data-scholar]");
    if (hit && window.Drawer) Drawer.open(hit.dataset.scholar);
  });

  return { D, byId, AREAS, FEATURES, featuresOf, esc, years, faith, field, tone, monogram, mono, workText, status, weight, namedAreas, head, reduced, listWords };
})();
