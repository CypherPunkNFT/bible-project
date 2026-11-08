// 03 Isaiah: the ruler of 66 chapters with chapter 40 and chapter 56 cut where a second and third writer are proposed;
// the book's own lines on foretelling; the evidence, one column, from the Qumran scroll to the case for later hands; three
// views with who holds them; the site's stand.
import { ISAIAH_BARE, R, type Mark, type Ruler as RulerData } from "./model";
import { Head, Layer, Para, RefButton, Stand, ThreeParts, Txt, Views } from "./parts";
import { Ruler } from "./Ruler";

type Props = { ruler: RulerData; lit: string | null; onChoose: (mark: Mark) => void };

const LAYER_OF: Record<string, "readers" | "theory"> = { scroll: "readers", sirach: "readers", nt: "readers", case: "theory" };

export function Isaiah({ ruler, lit, onChoose }: Props) {
  const i = R.isaiah;
  return <>
    <Head num="03" kicker="Isaiah" headline={i.headline}><Para text={i.lead} book="Isaiah" /></Head>
    <Ruler ruler={ruler} lit={lit} onChoose={onChoose} question="Where does the book claim to foretell, and where do theories cut it?" />
    <Layer of="book" />
    <ul className="ob-lines">{i.lines.map((line) => <li key={line.verse}>
      <p className="ob-line-quote">“<Txt text={line.quote} />”</p>
      <p><RefButton refKey={line.verse}>{line.verse}</RefButton> · Berean Standard Bible. <Txt text={line.note} book="Isaiah" /></p>
    </li>)}</ul>
    <ol className="ob-column">{i.evidence.map((e) => <li key={e.id}>
      <Layer of={LAYER_OF[e.id] ?? "readers"} />
      <h3><Txt text={e.head} /></h3>
      <ThreeParts evidence={e.evidence} inference={e.inference} limit={e.limit} book={ISAIAH_BARE(e.id)} />
    </li>)}</ol>
    <Views views={i.views} book="Isaiah" note="Three views, with who holds them" />
    <Stand text={i.stand} book="Isaiah" />
    <Para className="ob-caption" text={i.note} book="Isaiah" />
  </>;
}
