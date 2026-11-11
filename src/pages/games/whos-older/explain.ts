// Who's older?: the words of the reveal (design §7). The gap shown is always the smallest the windows allow, every
// date says "about", and a pair with an early-Genesis person prints no years at all, because theirs are not real.
import { plural } from "@/lib/site-format";
import type { Span } from "./pairing";
import type { Character, PoolPair, WhosOlderData } from "./game";

/** "1 year", "660 years", "at least 1,200 years": over 1,000 the gap is rounded down to the hundred. */
export function formatGap(gap: number): string {
  const shown = gap > 1000 ? Math.floor(gap / 100) * 100 : gap;
  return plural(shown, "{n} year", "{n} years");
}

/** A historians' year: -1030 -> "1030 BC", 20 -> "AD 20". */
export const formatYear = (year: number) => (year < 0 ? `${-year} BC` : `AD ${year}`);

/** "born about 1090–1030 BC", "born about 55 BC – AD 20", "born before about 650 BC". */
export function windowText(person: Pick<Character, "lo" | "hi">): string {
  const { lo, hi } = person;
  if (hi === null) return lo === null ? "date unknown" : `born after about ${formatYear(lo)}`;
  if (lo === null) return `born before about ${formatYear(hi)}`;
  if (lo < 0 && hi < 0) return `born about ${-lo}–${formatYear(hi)}`;
  if (lo > 0) return `born about AD ${lo}–${hi}`;
  return `born about ${formatYear(lo)} – ${formatYear(hi)}`;
}

/** A label without its bracketed qualifier, for sentences: "Zechariah (priest)" -> "Zechariah". */
export const shortName = (label: string) => label.replace(/\s*\(.*\)$/, "");

export interface Explanation {
  /** The reason, one sentence. */
  text: string;
  /** The deciding verse span (verse ids), for a hand-kept fact; its words come from the reader's Bible. */
  verse?: Span;
}

export function explain(pair: PoolPair): Explanation {
  const first = shortName(pair.first.label);
  const second = shortName(pair.second.label);
  if (pair.reason.kind === "fact") {
    const { fact } = pair.reason;
    return !fact.derived && fact.refs.length ? { text: fact.why, verse: fact.refs[0] } : { text: fact.why };
  }
  if (!pair.first.shown || !pair.second.shown) return { text: `In the Bible's own order, ${first} lived long before ${second}.` };
  return { text: `Even on the dating systems that bring them closest, ${first} was born at least ${formatGap(pair.reason.gap)} before ${second}.` };
}

/** "Exodus 7:7", "Genesis 25:25–26". */
export function verseLabel(data: Pick<WhosOlderData, "books">, [start, end]: Span): string {
  const name = data.books[String(Math.floor(start / 1_000_000))]?.[1] ?? "?";
  const chapter = Math.floor(start / 1000) % 1000;
  const verses = end > start ? `${start % 1000}–${end % 1000}` : `${start % 1000}`;
  return `${name} ${chapter}:${verses}`;
}

/** The reader with the verse highlighted: /read/bsb/EXO/7?hl=7. */
export function verseHref(data: Pick<WhosOlderData, "books">, [start, end]: Span): string {
  const code = data.books[String(Math.floor(start / 1_000_000))]?.[0] ?? "GEN";
  const chapter = Math.floor(start / 1000) % 1000;
  return `/read/bsb/${code}/${chapter}?hl=${start % 1000}${end > start ? `-${end % 1000}` : ""}`;
}
