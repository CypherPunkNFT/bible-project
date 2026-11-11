// 03 The alphabet poems: the eleven, as a list; the chosen one as a column of the twenty-two letters, each slot holding the
// Hebrew word its line begins with, computed by the build from the Leningrad text, a gap drawn as a gap. Lamentations 1, 2
// and 4 stand side by side so the order of ayin and pe can be seen. Then Lamentations 5, which keeps the number and drops the
// order, and the poem at the edge of the list.
import { Link } from "react-router-dom";
import { plural } from "@/lib/site-format";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { bereanVerse, D, owns, P, readerHref, type Column } from "./model";
import { Head, Prose, ThreeParts } from "./parts";

const ALPHABET = "אבגדהוזחטיכלמנסעפצקרשת";

function verseSpan(column: Column, verse: number): string {
  const first = bereanVerse(column, verse);
  return column.per > 1 ? `${first}–${first + column.per - 1}` : String(first);
}

function LetterColumn({ column, narrow }: { column: Column; narrow: boolean }) {
  return <div className="hpn-column">
    <p className="hpn-column-name">{column.label}</p>
    <ol>{column.letters.map((slot) => <li key={slot.letter} className={slot.verse === null ? "hpn-gap" : slot.second ? "hpn-second" : ""}>
      <span className="hpn-glyph" aria-hidden="true">{slot.letter}</span>
      <span className="hpn-letter-name">{slot.name}</span>
      {slot.verse === null ? <span className="hpn-slot-note">no line</span> : <>
        {!narrow && slot.word && <span className="hpn-he hpn-slot-word" lang="he" dir="rtl">{slot.word}</span>}
        <Link className="hpn-slot-verse" to={readerHref(column.code, column.chapter, bereanVerse(column, slot.verse))}
          aria-label={`${column.label}:${verseSpan(column, slot.verse)}${slot.second ? ", in the verse's second word" : ""}, in the Berean reader`}>
          {narrow ? "" : "v. "}{verseSpan(column, slot.verse)}{slot.second ? " ²" : ""}
        </Link>
      </>}
    </li>)}</ol>
    {column.repeats.map((r) => <p key={r.verse} className="hpn-slot-extra">{`Verse ${bereanVerse(column, r.verse)} begins with ${nameOf(r.letter)} again.`}</p>)}
    {column.extra && <p className="hpn-slot-extra">{`Verse ${bereanVerse(column, column.extra.verse)} closes the poem with an extra ${nameOf(column.extra.letter)}, outside the alphabet.`}</p>}
  </div>;
}

const NAMES = ["alef", "bet", "gimel", "dalet", "he", "waw", "zayin", "het", "tet", "yod", "kaf", "lamed", "mem", "nun", "samekh", "ayin", "pe", "tsade", "qof", "resh", "shin", "tav"];
const nameOf = (letter: string) => NAMES[ALPHABET.indexOf(letter)] ?? letter;

export function Letters({ poem, onChange }: { poem: number; onChange: (values: Record<string, string | null>) => void }) {
  const { acrostics } = D;
  const chosen = acrostics.poems[poem];
  const columns = P.acrostics.columns.filter((c) => c.poem === poem);
  const notDrawn = owns(P.acrostics.notDrawn, String(poem)) ? P.acrostics.notDrawn[String(poem)] : null;
  return <>
    <Head num="03" kicker="The alphabet poems" headline={acrostics.headline} lead={acrostics.lead} />
    <div className="hpn-letters">
      <ol className="hpn-poems" aria-label="The eleven alphabet poems">{acrostics.poems.map((p, i) => <li key={p.ref}>
        <button type="button" className="hpn-poem" aria-pressed={i === poem} onClick={() => onChange({ poem: String(i + 1) })}>
          <b>{String(i + 1).padStart(2, "0")}</b><span>{p.ref}</span><small><Checked text={p.shape} /></small>
        </button>
      </li>)}</ol>
      <div className="hpn-poem-body" aria-live="polite">
        <h3 className="hpn-sub">{chosen.ref}</h3>
        <p className="hpn-para"><Prose text={chosen.note} /></p>
        {columns.length > 0 && <div className={`hpn-columns${columns.length > 1 ? " hpn-columns-many" : ""}`}>
          {columns.map((c) => <LetterColumn key={c.label} column={c} narrow={columns.length > 1} />)}
        </div>}
        {columns.length > 0 && <p className="hpn-caption">
          <span>{columns[0].unit === "half" ? "Each slot is the first word of its half-line in the Leningrad text, read by the build."
            : plural(columns[0].per, "Each slot is the first word of its verse in the Leningrad text, read by the build.", "Each slot is the first word of its group of {n} verses in the Leningrad text, read by the build.")}</span>
          {" "}<span>A ² marks a letter found in the verse's second word. Verse numbers are the Berean's, and each opens the Berean reader.</span>
        </p>}
        {notDrawn && <p className="hpn-caption">{notDrawn}</p>}
      </div>
    </div>
    <div className="hpn-two">
      <div>
        <h3 className="hpn-sub">Lamentations 5</h3>
        <ol className="hpn-lam5" aria-label="The first letter of each of the twenty-two verses of Lamentations 5">
          {P.acrostics.lamentations5.map((v) => <li key={v.verse}><span className="hpn-glyph" aria-hidden="true">{v.letter}</span><small>{v.verse} · {nameOf(v.letter)}</small></li>)}
        </ol>
        <p className="hpn-para"><Prose text={acrostics.lamentations5} /></p>
      </div>
      <div>
        <h3 className="hpn-sub">At the edge: <Prose text={acrostics.edge.ref} /></h3>
        <p className="hpn-para"><Prose text={acrostics.edge.note} /></p>
      </div>
    </div>
    <ThreeParts evidence={acrostics.evidence} inference={acrostics.inference} limit={acrostics.limit} />
  </>;
}
