// Hymns card · six directions: helpers the six drawings share. Every number comes from the collection the Hymns page
// is built from (../hymn-directions/shared/collection-data.js) and Amazing Grace's own page data (data.js).
window.HC = (() => {
  const H = window.HYMNS, AG = window.HYMN;
  if (!H || !AG) throw new Error(`hymns card: the hymn data did not load (HYMNS ${Boolean(H)}, HYMN ${Boolean(AG)}); expected ../hymn-directions/shared/*.js`);
  const bookOf = (h) => Math.floor(h.v / 1e6);
  const chapterOf = (h) => Math.floor(h.v / 1000) % 1000;
  const fmt = (n) => n.toLocaleString("en-GB");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const letters = (text) => text.toLowerCase().replace(/[^a-z]/g, "");
  /** A first line as printed, without the editor's brackets and trailing stops. */
  const clean = (text) => text.replace(/^[\s"“‘'[(]+/, "").replace(/[\s,;:.\]]+$/, "");
  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /** The metre a hymn is marked with, folded to its common name; "" when the source gives none. */
  function metreOf(mark) {
    const m = mark.replace(/\s/g, "");
    if (/^(8,6,8,6|C\.M\.|CommonMetre)$/.test(m)) return "CM";
    if (/^(8,8,8,8|L\.M\.)$/.test(m)) return "LM";
    if (/^(6,6,8,6|S\.M\.)$/.test(m)) return "SM";
    if (m === "7,7,7,7") return "7s";
    return m ? "other" : "";
  }
  function metreCounts() {
    const counts = { CM: 0, LM: 0, SM: 0, "7s": 0, other: 0 };
    for (const h of H.hymns) { const k = metreOf(h.m); if (k) counts[k] += 1; }
    return { counts, marked: Object.values(counts).reduce((a, b) => a + b, 0) };
  }
  /** Hymns written on each of the 150 psalms. */
  function psalmCounts() {
    const counts = Array(150).fill(0);
    for (const h of H.hymns) if (h.v && bookOf(h) === 19) counts[chapterOf(h) - 1] += 1;
    return counts;
  }
  /** The 66 books with their reading-chart section and the hymns written on each. */
  function bookCounts() {
    const counts = Array(66).fill(0);
    for (const h of H.hymns) if (h.v) counts[bookOf(h) - 1] += 1;
    return H.books.map((b, i) => ({ name: b.name, section: b.section, n: counts[i] }));
  }
  /** The hymn whose first line begins with `prefix` (spelling-insensitive), optionally on a given psalm. */
  function findHymn(prefix, psalm) {
    const want = letters(prefix);
    const onPsalm = (h) => !psalm || (h.v && bookOf(h) === 19 && chapterOf(h) === psalm);
    const hymn = H.hymns.find((h) => onPsalm(h) && letters(h.t).startsWith(want));
    if (!hymn) console.warn(`hymns card: no hymn begins "${prefix}"${psalm ? ` on Psalm ${psalm}` : ""}`);
    return hymn;
  }
  const BOOK_OF_GROUP = { psalms: "The Psalms of David Imitated", hss: "Hymns and Spiritual Songs", divine: "Divine Songs", newton: "Olney Hymns", cowper: "Olney Hymns" };

  return { H, AG, fmt, reduced, sleep, clean, esc, metreCounts, psalmCounts, bookCounts, findHymn, BOOK_OF_GROUP };
})();

/** The six directions register here: { id, label, idea, art(), start(root) }. */
window.CARD_ART = [];
