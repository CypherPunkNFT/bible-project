// 06 AD 70: the fire, then the two ancient accounts of Titus's council side by side and not chosen between, the spoils in Rome and
// the city below, what Scripture foretold, and the site's word that the fall is never a charge against the Jewish people.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, linkFor, tagsOf, TD } from "./model";
import { Link } from "react-router-dom";
import { useOpen } from "./open";
import { Head, Prose, Tag, Tags } from "./parts";

export function Fall() {
  const open = useOpen();
  const f = D.fall;
  const titus = f.records.find((r) => r.id === "titus");
  const others = f.records.filter((r) => r.id !== "titus");
  const history = linkFor("New Testament history: from Herod to the fall of Jerusalem");
  return <>
    <Head num="06" kicker="AD 70" title="One fire." turn="Two accounts." lead={<Prose text={f.lead} />} />
    {titus && <div className="tw-accounts">
      <h3><Checked text={titus.head} /></h3>
      <div className="tw-accounts-pair">
        {TD.accounts.map((a) => <blockquote key={a.who}><Tag kind={a.who === "Josephus" ? "josephus" : "other"} /><p><Prose text={a.text} /></p></blockquote>)}
      </div>
      <dl className="tw-three tw-three-2">
        <div><dt>What this study infers</dt><dd><Prose text={titus.inference} /></dd></div>
        <div><dt>Where it stops</dt><dd><Prose text={titus.limit} /></dd></div>
      </dl>
    </div>}
    <ul className="tw-fall">
      {others.map((r) => <li key={r.id}>
        <h3><Checked text={r.head} /></h3>
        <Tags kinds={tagsOf(`fall:${r.id}`)} />
        <p className="tw-para"><Prose text={r.evidence} /></p>
        <button type="button" className="tw-open" data-opener={`fall:${r.id}`} aria-haspopup="dialog" onClick={() => open(`fall:${r.id}`)}>The whole record <span aria-hidden="true">→</span></button>
      </li>)}
    </ul>
    <div className="tw-foretold">
      <p className="tw-para"><Prose text={f.scripture} />{history && <> <Link className="tw-link" to={history}>New Testament history <span aria-hidden="true">→</span></Link></>}</p>
    </div>
    <aside className="tw-care" aria-label="A word of care">
      <p className="tw-kicker">A word of care</p>
      <p><Prose text={f.care} /></p>
    </aside>
  </>;
}
