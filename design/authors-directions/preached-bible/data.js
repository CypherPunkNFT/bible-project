// Look-ups for the preached-Bible page, all computed from window.AUTHORS: every chapter in canon order with who took
// it as a main text, sermon titles by chapter, the people with passage data, and small formatting helpers.
window.PB = (() => {
  const { books, people, chapters } = AUTHORS;
  const SPURGEON = "author-charles-spurgeon";
  const sum = (obj) => Object.values(obj).reduce((n, v) => n + v, 0);
  const SECTION_LABEL = { history: "History", poetry: "Poetry & Wisdom", prophets: "Prophets", gospels: "Gospels & Acts", epistles: "Epistles", revelation: "Revelation" };

  // One entry per chapter, Genesis 1 to Revelation 22.
  const cells = [];
  books.forEach((book, b) => book.chapters.forEach((verses, c) => {
    const key = `${b + 1}:${c + 1}`;
    const counts = chapters[key] ?? {};
    cells.push({ i: cells.length, b, c: c + 1, key, verses, counts, total: sum(counts), voices: Object.keys(counts).length });
  }));
  const cellByKey = new Map(cells.map((cell) => [cell.key, cell]));

  // Sermon titles (Spurgeon: all with a text; everyone else: the sample of up to 60) filed under their chapter.
  const keyOfVerse = (v) => `${Math.floor(v / 1e6)}:${Math.floor(v / 1e3) % 1000}`;
  const titles = new Map();
  for (const person of people) for (const sermon of person.sermons) {
    const key = keyOfVerse(sermon.v);
    if (!titles.has(key)) titles.set(key, []);
    titles.get(key).push({ person, sermon });
  }
  for (const list of titles.values()) list.sort((a, b) => a.sermon.v - b.sermon.v);

  // People who have at least one work with a main Bible text, most chapters first.
  const preachers = people.map((person) => {
    const lit = cells.filter((cell) => cell.counts[person.id]);
    return { person, chapters: lit.length, works: lit.reduce((n, cell) => n + cell.counts[person.id], 0) };
  }).filter((p) => p.chapters).sort((a, b) => b.chapters - a.chapters);

  const totalWorks = cells.reduce((n, cell) => n + cell.total, 0);
  const litCount = cells.filter((cell) => cell.total).length;

  // How many works a view counts on one chapter: everyone, everyone but Spurgeon, or one person.
  function valueOf(cell, view) {
    if (view === "all") return cell.total;
    if (view === "others") return cell.total - (cell.counts[SPURGEON] ?? 0);
    return cell.counts[view] ?? 0;
  }

  const bookName = (b) => books[b].name;
  const chapterName = (cell) => `${books[cell.b].name === "Psalms" ? "Psalm" : books[cell.b].name} ${cell.c}`;
  const readHref = (cell, verse) => `/read/kjv/${books[cell.b].code}/${cell.c}${verse ? `?hl=${verse}` : ""}`;
  const verseOf = (v) => v % 1000;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formatDate = (iso) => {
    if (!iso) return "undated";
    const [y, m, d] = iso.split("-").map(Number);
    return d ? `${d} ${MONTHS[m - 1]} ${y}` : m ? `${MONTHS[m - 1]} ${y}` : String(y);
  };
  const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const toneOf = (person) => familyOf(person).tone;
  const plural = (n, word, many = `${word}s`) => `${formatNumber(n)} ${n === 1 ? word : many}`;

  // Canvas colour helpers: the theme's hex tokens as [r, g, b], and a linear mix.
  function rgbOf(token) {
    const value = Frame.color(token);
    const hex = value.replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error(`colour ${token} is "${value}", expected a 6-digit hex colour`);
    return [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16));
  }
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (rgb) => `rgb(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0})`;
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  return { SPURGEON, SECTION_LABEL, cells, cellByKey, titles, preachers, totalWorks, litCount, valueOf, keyOfVerse,
    bookName, chapterName, readHref, verseOf, formatDate, escapeHtml, toneOf, plural, rgbOf, mix, css, reducedMotion, ease };
})();
