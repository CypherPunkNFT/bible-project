// 01 The five books: the ruler of 187 chapters, then the three layers in their order: what the books say of Moses'
// writing, how later Scripture and Jewish teachers remember it, and the views among those who hold Scripture true.
import { bookOf, R, type Mark, type Ruler as RulerData } from "./model";
import { Head, Layer, Para, RefButton, Stand, Txt, Views } from "./parts";
import { Ruler } from "./Ruler";

type Props = { ruler: RulerData; lit: string | null; onChoose: (mark: Mark) => void };

export function Pentateuch({ ruler, lit, onChoose }: Props) {
  const p = R.pentateuch;
  return <>
    <Head num="01" kicker="The five books" headline={p.headline}><Para text={p.lead} /></Head>
    <Ruler ruler={ruler} lit={lit} onChoose={onChoose} question="Where do the five books speak of their own writing, and where does a later hand show?" />
    <p className="ob-caption">One ruler, 187 chapters. The diamonds stand where a verse says Moses wrote; the circles stand where a reader sees a hand after his; the dashed cuts stand where the documentary hypothesis divides the text (section 02).</p>
    <div className="ob-pair">
      <div>
        <Layer of="book" />
        <ul className="ob-witness">{p.selfWitness.map((w) => <li key={w.verse}><RefButton refKey={w.verse}>{w.verse}</RefButton><span><Txt text={w.says} book={bookOf(w.verse)} /></span></li>)}</ul>
        <Para className="ob-caption" text={p.selfNote} />
      </div>
      <div>
        <Layer of="readers" />
        <ul className="ob-witness">{p.remembered.map((r) => <li key={r.where}><span className="ob-where"><Txt text={r.where} /></span><span><Txt text={r.says} /></span></li>)}</ul>
        <Para className="ob-caption" text={p.rememberedNote} />
      </div>
    </div>
    <Views views={p.views} note="Three views among scholars who hold Scripture true · not ranked" />
    <Para text={p.chicago} />
    <Stand text={p.stand} />
  </>;
}
