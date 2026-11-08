// 04 Priests: the twenty-four divisions in the Berean's order (1 Chronicles 24:7-18), Abijah's lit; Zechariah's week from
// Chronicles to Luke in four records, each tagged by its witnesses; the psalm of the day, only the Sabbath's from Scripture; and
// the high priest.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, tagsOf, TD } from "./model";
import { useOpen } from "./open";
import { Head, Prose, RefButton, Tag, Tags } from "./parts";

const ABIJAH = "Abijah";

export function Priests() {
  const open = useOpen();
  const p = D.priesthood;
  return <>
    <Head num="04" kicker="Priests" title="Twenty-four families." turn="One lot in a lifetime." lead={<Prose text={p.lead} />} />
    <div className="tw-priests">
      <figure className="tw-divisions">
        <figcaption className="tw-kicker">The divisions, in the order the lots fell · <RefButton label="1 Chronicles 24:7–18" /></figcaption>
        <ol>{TD.divisions.map((d) => <li key={d.n} className={d.name === ABIJAH ? "on" : undefined}>
          <b>{d.n}</b><span>{d.name}</span>{d.name === ABIJAH && <small>Zechariah's, <RefButton label="Luke 1:5" /></small>}</li>)}</ol>
      </figure>
      <ol className="tw-week">
        {p.records.map((r, i) => <li key={r.id}>
          <p className="tw-step-n">{String(i + 1).padStart(2, "0")}</p>
          <div>
            <h3><Checked text={r.head} /></h3>
            <Tags kinds={tagsOf(`priest:${r.id}`)} />
            <p className="tw-para"><Prose text={r.evidence} /></p>
            <button type="button" className="tw-open" data-opener={`priest:${r.id}`} aria-haspopup="dialog" onClick={() => open(`priest:${r.id}`)}>What this study infers, and where it stops <span aria-hidden="true">→</span></button>
          </div>
        </li>)}
      </ol>
    </div>
    <figure className="tw-psalms">
      <figcaption className="tw-kicker">The psalm of the day, as the Mishnah lists it</figcaption>
      <ol>{TD.psalms.map((n, i) => {
        const sabbath = i === TD.psalms.length - 1;
        return <li key={n} className={sabbath ? "on" : undefined}>
          <small>{sabbath ? "Sabbath" : `Day ${i + 1}`}</small>
          <b>{sabbath ? <RefButton label="Psalm 92:1" shown="Psalm 92" /> : `Psalm ${n}`}</b>
          <Tag kind={sabbath ? "scripture" : "rabbinic"} />
        </li>;
      })}</ol>
    </figure>
    <div className="tw-high">
      <p className="tw-kicker">The high priest</p>
      <p className="tw-para"><Prose text={p.highPriest} /></p>
    </div>
  </>;
}
