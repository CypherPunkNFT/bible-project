// What came first?: loading every category's data, each in the site's language (design §8.5). The files are built ahead
// of time (scripts/build-what-came-first.ts; Who lived first reads Who's older?'s own file) and each arrives as its own
// chunk, all in parallel. They are all loaded when the page opens: a new player opens on Mixed, which needs every one,
// and a saved run can then be checked at once. A translated copy keeps the English labels beside its own for the
// clash rule, so every language asks the same pairs (Who's older?'s withEnglishLabels, generalised to items).
import type { WhosOlderData } from "../whos-older/game";
import { withEnglishLabels } from "../whos-older/pairing";
import { inSiteLanguage } from "../translated-data";
import type { PairCategory } from "./order";
import { booksFile, buildFirstsPool, buildPairPool, livedFile, type FirstsFile, type PairFile, type Pools, type ShownItem } from "./pool";

type Loaded = PairFile & { stamp: string };

/** The shown copy with each item's English label beside it (by id), so the clash rule reads English in every language. */
function withEnglishItems<D extends { items: ShownItem[] }>(shown: D, english: D): D {
  if (shown === english) return shown;
  const labels = new Map(english.items.map((item) => [item.id, item.label]));
  return { ...shown, items: shown.items.map((item) => ({ ...item, english: labels.get(item.id) ?? item.label })) };
}

async function translated<D extends Loaded>(file: string, english: D): Promise<D> {
  return withEnglishItems(await inSiteLanguage(`what-came-first/${file}`, english), english);
}

const LOADERS: Record<PairCategory, () => Promise<PairFile>> = {
  lived: () => import("@/data/whos-older/whos-older.json").then(async (m) => {
    const english = m.default as unknown as WhosOlderData;
    return livedFile(withEnglishLabels(await inSiteLanguage("whos-older/whos-older.json", english), english));
  }),
  happened: () => import("@/data/what-came-first/events.json").then((m) => translated("events.json", m.default as unknown as Loaded)),
  ruled: () => import("@/data/what-came-first/ruled.json").then((m) => translated("ruled.json", m.default as unknown as Loaded)),
  built: () => import("@/data/what-came-first/built.json").then((m) => translated("built.json", m.default as unknown as Loaded)),
  went: () => import("@/data/what-came-first/journeys.json").then((m) => translated("journeys.json", m.default as unknown as Loaded)),
  died: () => import("@/data/what-came-first/died.json").then((m) => translated("died.json", m.default as unknown as Loaded)),
  books: () => import("@/data/what-came-first/books.json").then((m) => booksFile(m.default as unknown as Parameters<typeof booksFile>[0])),
};

const loadFirsts = () => import("@/data/what-came-first/firsts.json").then(async (m) => {
  const english = m.default as unknown as FirstsFile;
  return inSiteLanguage("what-came-first/firsts.json", english);
});

/** Every category's pool. Rejects if any file fails to load, so the page can offer to try again. */
export async function loadPools(): Promise<Pools> {
  const keys = Object.keys(LOADERS) as PairCategory[];
  const [firsts, ...files] = await Promise.all([loadFirsts(), ...keys.map((key) => LOADERS[key]())]);
  const pools: Pools = { firsts: buildFirstsPool(firsts) };
  keys.forEach((key, i) => { pools[key] = buildPairPool(key, files[i]) as never; });
  return pools;
}
