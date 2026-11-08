// 04 Daniel: the ruler of twelve chapters with the Aramaic run beneath it and the first-person visions above; the verses
// that name kingdoms; four pieces of evidence; the two dates, each with its case and the answer given to it; the stand.
import { DANIEL_BARE, R, type Mark, type Ruler as RulerData } from "./model";
import { Head, Layer, Para, Stand, ThreeParts, Txt, VerseQuote } from "./parts";
import { Ruler } from "./Ruler";

type Props = { ruler: RulerData; lit: string | null; onChoose: (mark: Mark) => void };

export function Daniel({ ruler, lit, onChoose }: Props) {
  const d = R.daniel;
  return <>
    <Head num="04" kicker="Daniel" headline={d.headline}><Para text={d.lead} book="Daniel" /></Head>
    <Ruler ruler={ruler} lit={lit} onChoose={onChoose} question="Where does Daniel speak in his own voice, and where do the arguments over its date press?" />
    <Layer of="book" />
    <div className="ob-named">{d.named.map((n) => <VerseQuote key={n.verse} refKey={n.verse} />)}</div>
    <Para className="ob-caption" text={d.namedNote} book="Daniel" />
    <Layer of="readers" />
    <ol className="ob-grid">{d.evidence.map((e) => <li key={e.id}>
      <h3><Txt text={e.head} /></h3>
      <ThreeParts evidence={e.evidence} inference={e.inference} limit={e.limit} book={DANIEL_BARE(e.id)} />
    </li>)}</ol>
    <div className="ob-dates">{d.views.map((v, i) => <article key={v.id} className={`ob-date-view ob-date-${v.id}`}>
      <p className="ob-kicker">{i === 0 ? "The date the book gives itself" : "The date others reconstruct"}</p>
      <h3><Txt text={v.name} /></h3>
      <p className="ob-held"><span>Held by</span> <Txt text={v.held} book="Daniel" /></p>
      <dl className="ob-three ob-two">
        <div><dt>The case for it</dt><dd><Txt text={v.forIt} book="Daniel" /></dd></div>
        <div><dt>The answer given</dt><dd><Txt text={v.against} book="Daniel" /></dd></div>
      </dl>
    </article>)}</div>
    <Stand text={d.stand} book="Daniel" />
    <Para className="ob-caption" text={d.limit} book="Daniel" />
  </>;
}
