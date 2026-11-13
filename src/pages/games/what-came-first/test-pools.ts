// What came first?: every category's pool built at once from the English files, for the tests (the page loads them
// through load.ts, each in the site's language).
import books from "@/data/what-came-first/books.json";
import built from "@/data/what-came-first/built.json";
import died from "@/data/what-came-first/died.json";
import events from "@/data/what-came-first/events.json";
import firsts from "@/data/what-came-first/firsts.json";
import journeys from "@/data/what-came-first/journeys.json";
import ruled from "@/data/what-came-first/ruled.json";
import whosOlder from "@/data/whos-older/whos-older.json";
import type { WhosOlderData } from "../whos-older/game";
import { booksFile, buildFirstsPool, buildPairPool, livedFile, type FirstsFile, type PairFile, type Pools } from "./pool";

const pair = (file: unknown) => file as PairFile;

export function englishPools(): Pools {
  return {
    lived: buildPairPool("lived", livedFile(whosOlder as unknown as WhosOlderData)),
    happened: buildPairPool("happened", pair(events)),
    ruled: buildPairPool("ruled", pair(ruled)),
    built: buildPairPool("built", pair(built)),
    went: buildPairPool("went", pair(journeys)),
    died: buildPairPool("died", pair(died)),
    books: buildPairPool("books", booksFile(books as Parameters<typeof booksFile>[0])),
    firsts: buildFirstsPool(firsts as unknown as FirstsFile),
  };
}
