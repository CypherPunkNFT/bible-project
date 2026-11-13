// What came first?: the reason under each answer (design §9.3). Each category writes its own whole sentences, one
// template string each with only names and numbers inside, so the translation check never meets a sentence built from
// pieces. The gap is always the smallest the windows allow; an early-Genesis item prints no years. A verse that settles
// the order is quoted in the reader's Bible by the reveal (src/components/Verse.tsx, through src/lib/verses.ts).
import { formatNumber } from "@/lib/site-format";
import { formatGap, shortName } from "../whos-older/explain";
import type { PairCategory, Span } from "./order";
import type { PairPool, PoolPair } from "./pool";

export interface Explanation {
  text: string;
  /** The verse that settles it, quoted from the reader's Bible. */
  verse?: Span;
}

function windowsSentence(category: PairCategory, first: string, second: string, gap: string): string {
  switch (category) {
    case "lived": return `Even on the dating systems that bring them closest, ${first} was born at least ${gap} before ${second}.`;
    case "happened": return `Even on the dating systems that bring them closest, “${first}” came at least ${gap} before “${second}”.`;
    case "ruled": return `Even on the dating systems that bring them closest, ${first} began to reign at least ${gap} before ${second}.`;
    case "built": return `Even on the dating systems that bring them closest, ${first} was built at least ${gap} before ${second}.`;
    case "died": return `Even on the dating systems that bring them closest, ${first} died at least ${gap} before ${second}.`;
    default: return `${first} came at least ${gap} before ${second}.`;
  }
}

function earlySentence(category: PairCategory, first: string, second: string): string {
  switch (category) {
    case "lived": return `In the Bible's own order, ${first} lived long before ${second}.`;
    case "happened": return `In the Bible's own order, “${first}” came before “${second}”.`;
    case "ruled": return `In the Bible's own order, ${first} began to reign before ${second}.`;
    case "built": return `In the Bible's own order, ${first} was built before ${second}.`;
    case "died": return `In the Bible's own order, ${first} died before ${second}.`;
    default: return `In the Bible's own order, ${first} came before ${second}.`;
  }
}

export function explainPair(pool: PairPool, pair: PoolPair): Explanation {
  const { first, second, reason } = pair;
  const a = pool.key === "happened" ? first.label : shortName(first.label);
  const b = pool.key === "happened" ? second.label : shortName(second.label);
  if (reason.kind === "fact") {
    const { fact } = reason;
    return !fact.derived && fact.refs.length ? { text: fact.why, verse: fact.refs[0] } : { text: fact.why };
  }
  if (reason.kind === "position") {
    if (pool.key === "books") {
      return { text: `${a} is book ${formatNumber(first.position!)} of ${formatNumber(66)}; ${b} is book ${formatNumber(second.position!)}.` };
    }
    const traveller = pool.journeys.get(first.group ?? "")?.traveller ?? "";
    return { text: `${traveller} reached ${a} before ${b}.`, verse: first.refs?.[0] };
  }
  if (!first.shown || !second.shown) return { text: earlySentence(pool.key, a, b) };
  return { text: windowsSentence(pool.key, a, b, formatGap(reason.gap)) };
}
