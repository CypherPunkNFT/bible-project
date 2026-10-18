// Shared pieces for the Manuscripts mock-ups: the kinds and lanes, text helpers, look-ups into data.js (window.MS),
// and the record sheet that slides in from the right when any manuscript is opened.
window.Sections = window.Sections || {};
(() => {
  const esc = (text) => String(text ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const plural = (n, word, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;
  const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

  // One entry per kind of witness: label, the site colour it is drawn in, a glyph, and a plain line.
  const KINDS = [
    { key: "papyrus", label: "Papyri", one: "papyrus", tone: "--history", glyph: "fragment", group: "Greek New Testament", line: "Greek New Testament on papyrus" },
    { key: "majuscule", label: "Majuscules", one: "majuscule", tone: "--prophets", glyph: "codex", group: "Greek New Testament", line: "Greek New Testament in capital letters, on parchment" },
    { key: "minuscule", label: "Minuscules", one: "minuscule", tone: "--gospels", glyph: "hand", group: "Greek New Testament", line: "Greek New Testament in a joined, small hand" },
    { key: "lectionary", label: "Lectionaries", one: "lectionary", tone: "--acts", glyph: "lectern", group: "Greek New Testament", line: "Readings arranged for the church year" },
    { key: "lxx", label: "Greek Old Testament", one: "Greek Old Testament manuscript", tone: "--epistles", glyph: "codex", group: "Greek Old Testament", line: "Septuagint manuscripts, by their Rahlfs number" },
    { key: "dss", label: "Judaean Desert scrolls", one: "scroll", tone: "--poetry", glyph: "scroll", group: "Hebrew Bible", line: "From Qumran, Masada and the caves nearby" },
    { key: "hebrew", label: "Hebrew Bible", one: "Hebrew manuscript", tone: "--revelation", glyph: "codex", group: "Hebrew Bible", line: "The Masoretic codices and the Nash Papyrus" },
    { key: "latin", label: "Latin", one: "Latin manuscript", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Old Latin and Vulgate" },
    { key: "syriac", label: "Syriac", one: "Syriac manuscript", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Old Syriac and Peshitta gospels" },
    { key: "coptic", label: "Coptic", one: "Coptic manuscript", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Egypt's own language, in Greek letters" },
    { key: "gothic", label: "Gothic", one: "Gothic manuscript", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Wulfila's translation" },
    { key: "armenian", label: "Armenian", one: "Armenian manuscript", tone: "--accent", glyph: "tongue", group: "Early translations", line: "" },
    { key: "georgian", label: "Georgian", one: "Georgian manuscript", tone: "--accent", glyph: "tongue", group: "Early translations", line: "" },
    { key: "geez", label: "Ge'ez", one: "Ge'ez manuscript", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Ethiopia's ancient language" },
    { key: "arabic", label: "Arabic", one: "Arabic manuscript", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Christian and Judaeo-Arabic translations" },
    { key: "slavonic", label: "Church Slavonic", one: "Slavonic manuscript", tone: "--accent", glyph: "tongue", group: "Early translations", line: "Gospels, Psalters and Apostols of the Slavs" },
    { key: "samaritan", label: "Samaritan", one: "Samaritan manuscript", tone: "--revelation", glyph: "codex", group: "Hebrew Bible", line: "The Samaritan Pentateuch" },
  ];
  const KIND = Object.fromEntries(KINDS.map((k) => [k.key, k]));

  const GLYPHS = {
    fragment: '<path d="M6 4.5 15.5 3l3 4-1 5 2 3.5-2.5 5-9 .5L5 17l1.5-4L4 9z"/><path d="M8.5 8h7M8 11h8M9 14h6"/>',
    codex: '<path d="M12 6.5c-2-1.6-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><path d="M12 6.5V20"/>',
    hand: '<path d="M4 8c2-1.5 3 1.5 5 0s3 1.5 5 0 3 1.5 6 0M4 12c2-1.5 3 1.5 5 0s3 1.5 5 0 3 1.5 6 0M4 16c2-1.5 3 1.5 5 0s3 1.5 4 0"/>',
    lectern: '<path d="M5 9.5 12 6l7 3.5M7 8.5V20M17 8.5V20M9 13h6M10 16h4"/>',
    scroll: '<path d="M6 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6"/><ellipse cx="6" cy="12" rx="2" ry="7"/><path d="M10 9h6M10 12h6M10 15h4"/>',
    tongue: '<path d="M4 6h9M8.5 4v2M6 6c.5 3 2.5 5.5 6 7M11 6c-.5 3-2.5 5.5-6 7"/><path d="m13 20 3.5-8 3.5 8M14.2 17.5h4.6"/>',
    building: '<path d="M4 20h16M5 20V10M19 20V10M3.5 10 12 4.5 20.5 10M9 20v-6h6v6"/>',
  };
  const glyph = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[name]}</svg>`;

  const M = window.MS;
  const books = M.books;
  const holderById = new Map(M.holders.map((h) => [h.id, h]));
  const byId = new Map(M.records.map((r) => [r.i, r]));
  const mid = (r) => (r.e + r.l) / 2;
  const yearText = (y) => (y < 0 ? `${-y + 1} BC` : y < 400 ? `AD ${y}` : String(y));
  const sigla = (r) => r.g && r.g !== r.n && !r.n.endsWith(` ${r.g}`) && !r.n.endsWith(` ${r.g.replace(/^P/, "")}`) ? r.g : "";
  const title = (r) => r.n;

  // The books a record holds, as a short phrase: whole groups by their names, single books by theirs.
  function booksText(r) {
    if (!r.b?.length) return "";
    const set = new Set(r.b), named = [];
    const whole = (list) => list.every((b) => set.has(b));
    const OT = [...Array(39).keys()], NT = [...Array(27).keys()].map((i) => i + 39);
    if (whole(OT)) { named.push("the whole Old Testament"); OT.forEach((b) => set.delete(b)); }
    if (whole(NT)) { named.push("the whole New Testament"); NT.forEach((b) => set.delete(b)); }
    for (const [key, label] of [["gospels", "the four Gospels"], ["paul", "Paul's letters and Hebrews"], ["catholic", "the general letters"]]) {
      if (whole(M.groups[key])) { named.push(label); M.groups[key].forEach((b) => set.delete(b)); }
    }
    const rest = [...set].sort((a, b) => a - b).map((b) => books[b].name);
    const all = [...named, ...rest];
    return all.length > 6 ? `${all.slice(0, 5).join(", ")} and ${all.length - 5} more` : all.length > 1 ? `${all.slice(0, -1).join(", ")} and ${all.at(-1)}` : all[0];
  }
  const holderText = (r) => (r.h?.length ? r.h.map((id) => holderById.get(id)).map((h) => `${h.name}, ${h.city}`).join("; ") : r.hr || "");

  // A picture's address: the data URI from assets/images.js on the local preview, else the JPEG beside it.
  const imgSrc = (key) => window.MS_IMG?.[key] ?? `assets/${key}.jpg`;
  // A section heading in the house style: number, kicker, serif title with one italic accent (<em>), one plain line.
  const head = (num, kicker, h2, lead) => `<header class="t-head"><span class="t-num">${num}</span><div><p class="kicker">${kicker}</p><h2>${h2}</h2>${lead ? `<p>${lead}</p>` : ""}</div></header>`;
  // Records sorted oldest first; undated ones last, by name.
  const byDate = (a, b) => ("e" in a ? 0 : 1) - ("e" in b ? 0 : 1) || (("e" in a) ? mid(a) - mid(b) : 0) || a.n.localeCompare(b.n, "en", { numeric: true });

  Object.assign(window, { esc, plural, ordinal, imgSrc, KINDS, KIND, glyph, head, MSX: { byId, holderById, mid, yearText, sigla, title, booksText, holderText, books, byDate } });
})();
