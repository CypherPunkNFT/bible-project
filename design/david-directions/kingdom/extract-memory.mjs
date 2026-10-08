// data/memory.json for "the long memory": every verse that names David (the person file's refs, from STEP Bible's
// TIPNR list) placed across the 66 books, with its KJV text. A few echoes are labelled with words quoted from the
// verse itself (checked here; the build fails if a phrase is not in the verse).
const ECHOES = [
  [11015005, "did that which was right in the eyes of the LORD"],
  [19089003, "I have sworn unto David my servant"],
  [23009007, "upon the throne of David"],
  [24023005, "unto David a righteous Branch"],
  [26034023, "my servant David"],
  [40001001, "the son of David"],
  [42001032, "the throne of his father David"],
  [44013022, "a man after mine own heart"],
  [66022016, "the root and the offspring of David"],
];

export function memoryData({ person, catalog, chapters, verse, fail }) {
  const books = {};
  for (const b of catalog.books) {
    if (b.num < 1 || b.num > 66) continue;
    const chs = chapters(b.num);
    books[b.num] = { code: b.code, name: b.name, section: b.section, chapters: Object.keys(chs).length };
  }
  const count = (b, c) => chapters(b)[String(c)]?.v.length ?? fail(`chapter ${b}/${c} missing`);
  const points = [...new Set(person.refs)].sort((a, b) => a - b).map((id) => {
    const b = Math.floor(id / 1e6), c = Math.floor((id % 1e6) / 1e3), v = id % 1e3;
    if (!books[b]) fail(`verse ${id} lies outside the 66 books`);
    return { id, b, c, v, n: count(b, c), text: verse(id) };
  });
  const echoes = ECHOES.map(([id, phrase]) => {
    const p = points.find((x) => x.id === id) ?? fail(`echo ${id} does not name David in the person file`);
    if (!p.text.toLowerCase().includes(phrase.toLowerCase())) fail(`echo ${id}: "${phrase}" is not in the verse`);
    return { id, phrase };
  });
  return {
    credit: "Verse list: TIPNR (Translators Individualised Proper Names with all References) by STEP Bible (STEPBible.org, based on work at Tyndale House Cambridge), CC BY 4.0. Verse text: King James Version.",
    books, points, echoes,
  };
}
