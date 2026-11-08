// 05 Darius the Mede: the question, the chronicle's record, and five answers hung from one name by fine rules: four held by
// scholars who hold the text true, side by side and not ranked; the fifth set apart and named as others' view.
import { R } from "./model";
import { Head, Para, Stand, Txt } from "./parts";

const OTHERS = "literary";

export function Darius() {
  const d = R.darius, held = d.views.filter((v) => v.id !== OTHERS), others = d.views.find((v) => v.id === OTHERS);
  return <>
    <Head num="05" kicker="Darius the Mede" headline={d.headline}><Para text={d.question} book="Daniel" /></Head>
    <figure className="ob-chronicle">
      <p className="ob-kicker">The record outside the Bible</p>
      <blockquote><p><Txt text={d.record} book="Daniel" /></p></blockquote>
    </figure>
    <div className="ob-hang">
      <p className="ob-hang-name" aria-hidden="true">Darius the Mede</p>
      <ol aria-label="Four answers held by scholars who hold the text true, not ranked">{held.map((v, i) => <li key={v.id}>
        <span className="ob-hang-n">{i + 1}</span>
        <h3><Txt text={v.name} /></h3>
        <p className="ob-held"><span>Held by</span> <Txt text={v.held} book="Daniel" /></p>
        <Para text={v.reading} book="Daniel" />
        {v.limit && <p className="ob-limit"><span>Where it stops</span> <Txt text={v.limit} book="Daniel" /></p>}
      </li>)}</ol>
      {others && <div className="ob-hang-others">
        <p className="ob-kicker">Others' view · it denies what the text claims</p>
        <h3><Txt text={others.name} /></h3>
        <p className="ob-held"><span>Held by</span> <Txt text={others.held} book="Daniel" /></p>
        <Para text={others.reading} book="Daniel" />
        {others.limit && <p className="ob-limit"><span>The answer given</span> <Txt text={others.limit} book="Daniel" /></p>}
      </div>}
    </div>
    <Stand text={d.stand} book="Daniel" />
  </>;
}
