// Does an internal address lead to a real page? Checked against the route table (src/App.tsx and the nested routes)
// and the ids the inventory wrote to design/review/instances.json ("valid"). Returns null when fine, else the reason.

const STATIC = new Set([
  "/", "/library", "/bible", "/read", "/search", "/search/meaning", "/versions", "/sources", "/study", "/atlas", "/charts",
  "/charts/references", "/charts/structure", "/charts/words-of-jesus", "/charts/versions",
  "/testimonies", "/testimonies/join", "/testimonies/access", "/testimonies/design", "/topics", "/topics/superlist", "/review",
  "/study/references", "/study/structure", "/study/gospels", "/study/versions", "/study/miracles", "/study/names",
  "/study/people", "/study/prophets", "/study/rulers", "/study/apostles", "/study/harmony", "/study/letters",
  "/study/atlas", "/study/atlas/map", "/study/atlas/journeys", "/study/atlas/cities", "/study/atlas/cities/find",
  "/study/atlas/cities/motion", "/study/atlas/gospels", "/study/atlas/early-church", "/study/atlas/catholic-orthodox",
  "/study/atlas/reformation", "/study/atlas/missions",
  "/apologetics", "/apologetics/questions", "/apologetics/paths", "/apologetics/worldviews", "/apologetics/debates",
  "/apologetics/practice", "/apologetics/texts", "/apologetics/sources", "/apologetics/saved", "/apologetics/reformed",
  "/mock/genealogy-curves", "/mock/genealogy-circle", "/mock/genealogy-circle-2",
]);

export function linkChecker(valid) {
  const people = new Set(valid.people);
  const special = Object.fromEntries(Object.entries(valid.special).map(([k, ids]) => [k, new Set(ids)]));
  const topics = new Set([...valid.topics, ...valid.aliases]);
  const categories = new Set(valid.categories);
  const places = new Set(valid.places);
  const books = new Set(Object.values(valid.reader).flatMap((b) => Object.keys(b)));
  const ap = Object.fromEntries(Object.entries(valid.apologetics).map(([k, ids]) => [k, new Set(ids)]));

  return function check(address) {
    const url = new URL(address, "http://site");
    const path = url.pathname.replace(/\/$/, "") || "/";
    const query = url.searchParams;
    if (path === "/study/atlas/map" && query.get("place") && !places.has(query.get("place"))) return `no atlas place "${query.get("place")}"`;
    if (STATIC.has(path)) return null;
    let m;
    if ((m = /^\/people\/([^/]+)(?:\/([^/]+))?$/.exec(path))) {
      if (!people.has(m[1])) return `no person "${m[1]}"`;
      if (m[2] && !special[m[2]]) return `no kind of person page called "${m[2]}"`;
      if (m[2] && !special[m[2]].has(m[1])) return `${m[1]} has no ${m[2] === "rule" ? "ruler" : m[2] === "mission" ? "mission" : "prophet"} page (the link only falls back to the person page)`;
      return null;
    }
    if ((m = /^\/study\/people\/([^/]+)$/.exec(path))) return people.has(m[1]) ? null : `no person "${m[1]}"`;
    if ((m = /^\/read\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(path))) {
      if (!valid.reader[m[1]]) return `no Bible version "${m[1]}"`;
      if (!books.has(m[2])) return `no book "${m[2]}"`;
      return /^\d+$/.test(m[3]) ? null : `chapter "${m[3]}" is not a number`;
    }
    if ((m = /^\/topics\/c\/([^/]+)$/.exec(path))) return categories.has(m[1]) ? null : `no topic card "${m[1]}"`;
    if ((m = /^\/topics\/([^/]+)$/.exec(path))) return topics.has(decodeURIComponent(m[1])) ? null : `no topic "${m[1]}"`;
    if ((m = /^\/study\/letters\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/.exec(path))) {
      if (!valid.letters[m[1]]) return `no Letters page "${m[1]}"`;
      return !m[2] || valid.letters[m[1]].includes(m[2]) ? null : `no section "${m[2]}" on the Letters page "${m[1]}"`;
    }
    if (/^\/study\/places(\/|$)/.test(path)) return null; // old addresses, forwarded to the Atlas
    if ((m = /^\/apologetics\/(topics|study|paths|worldviews|debates)\/([^/]+)$/.exec(path))) {
      const set = ap[m[1] === "study" ? "study" : m[1]];
      return set?.has(m[2]) ? null : `no apologetics ${m[1] === "study" ? "study" : m[1].replace(/s$/, "")} "${m[2]}"`;
    }
    return "this address is not a page on the site";
  };
}
