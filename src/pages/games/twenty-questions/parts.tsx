// Bible twenty questions: small pieces both modes share. The turn dots (design §11.2), the person's summary and link
// (§8 step 5), and a verse note whose words load from the reader's Bible (§10.2, §11.7).
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { formatNumber } from "@/lib/site-format";
import { verseReference } from "@/lib/verses";
import type { TqPerson } from "./engine";
import { personHref } from "./shared";

/** One slot per turn: a question (round) or a guess (gold diamond), so colour is never the only signal. */
export function Dots({ kinds, limit }: { kinds: readonly ("q" | "g")[]; limit: number }) {
  const now = Math.min(kinds.length + 1, limit);
  return <div className="tq-dots">
    <ol aria-hidden="true">
      {Array.from({ length: limit }, (_, i) => <li key={i} className={kinds[i] === "g" ? "is-guess" : kinds[i] ? "is-used" : ""} />)}
    </ol>
    <p className="tq-turn">{`Turn ${formatNumber(now)} of ${formatNumber(limit)}`}</p>
  </div>;
}

export function PersonSummary({ person, onLeave }: { person: TqPerson; onLeave?: () => void }) {
  return <div className="tq-person">
    <p className="tq-person-name">{person.label}</p>
    {person.b && <p className="tq-person-brief">{person.b}</p>}
    {person.s && person.s !== person.b && <p className="tq-person-story">{person.s}</p>}
    <Link className="tq-link" to={personHref(person)} onClick={onLeave}>{`Read about ${person.label}`}</Link>
  </div>;
}

/** The verse behind one note: its reference, then its words from the reader's Bible when they load. */
export function VerseNote({ verse }: { verse: number }) {
  const catalog = useCatalog();
  return <blockquote className="tq-verse">
    <p><Verse id={verse} /></p>
    <footer>{verseReference(catalog, verse)}</footer>
  </blockquote>;
}
