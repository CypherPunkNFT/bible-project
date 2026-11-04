// Section 05: three-letter roots. The words of one family are stacked on a shared grid, so three threads run down the root's letters and
// what was added around them stands out. The same stack shows why a root is not a meaning.
import { Link } from "react-router-dom";
import { D, featuredById, findRoot, H, rootPlaces, type Featured } from "./model";
import { Cite, He, Head, Mixed, ThreeParts, VerseLink } from "./parts";

function Row({ item, onOpen }: { item: Featured; onOpen: (key: string) => void }) {
  const data = H.featured[item.id];
  const places = rootPlaces(data.he, item.root!);
  return <li>
    <button type="button" className="hw-rootrow" data-open={`word:${item.id}`} onClick={() => onOpen(`word:${item.id}`)}>
      <span className="hw-threadgrid" lang="he" dir="rtl" aria-label={data.he}>{places.map((piece, i) => <span key={i} className={i % 2 ? "hw-thread" : "hw-added"} aria-hidden="true">{piece}</span>)}</span>
      <span className="hw-rootword"><b>{item.word}</b><small><He>{data.he}</He> {item.sound}</small></span>
    </button>
    <span className="hw-verse-ref"><VerseLink label={data.label} /></span>
  </li>;
}

function Stack({ group, label, onOpen }: { group: string; label: string; onOpen: (key: string) => void }) {
  const items = D.featured.filter((f) => f.group === group && f.root && featuredById.get(f.id));
  return <ul className="hw-stack" aria-label={label}>{items.map((item) => <Row key={item.id} item={item} onOpen={onOpen} />)}</ul>;
}

export function Roots({ rootValue, onRoot, onOpen }: { rootValue: string | null; onRoot: (id: string) => void; onOpen: (key: string) => void }) {
  const root = findRoot(rootValue);
  return <>
    <Head letter="ה" num="05" kicker="Three-letter roots" title={<>Three letters.<em> A family, not a definition.</em></>}
      lead="Most Hebrew words are built on three consonants. Choose a family and follow the three threads down: everything off the threads was added." />
    <ul className="hw-lenses" aria-label="Choose a family of words">
      {D.roots.map((r) => <li key={r.id}><button type="button" aria-pressed={r.id === root.id} onClick={() => onRoot(r.id)}><He>{r.letters}</He> {r.gloss}</button></li>)}
    </ul>
    <p className="hw-lens-line" aria-live="polite"><Mixed text={root.line} /></p>
    <Stack group={root.id} label={root.gloss} onOpen={onOpen} />
    <div className="hw-claim">
      <p className="hw-claim-text">{D.claims.root.claim}</p>
      <p className="hw-para"><Mixed text={D.claims.root.line} /></p>
      <Stack group="lhm" label="The three letters of bread and of fighting" onOpen={onOpen} />
      <p className="hw-note">How a word's setting fixes its sense is for a planned title, Words in their passages. For mistakes made with a dictionary number instead, see <Link to="/study/strongs-numbers">Strong's numbers</Link>.</p>
    </div>
    <ThreeParts {...D.records.roots} />
    <Cite ids={["gkc", "stepTahot"]} />
  </>;
}
