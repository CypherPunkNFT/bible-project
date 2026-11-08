// 02 Its world: four temples of the region beside Solomon's, each drawn as its plan type (the record gives no measurements for
// them, so none is drawn to scale); the tent-shrines beside the tabernacle; and the view that the tabernacle is a later picture,
// labelled as others' view, with the evangelical answer.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, linkFor, tagsOf, TD } from "./model";
import { Link } from "react-router-dom";
import { useOpen } from "./open";
import { Head, Prose, Tags, ThreeParts } from "./parts";

/** A plan type in miniature: a long house of three rooms in a line, or a broad room with its niche. Not to scale. */
function TypeMark({ kind }: { kind: "long" | "broad" }) {
  return <svg className="tw-type" viewBox="0 0 120 60" aria-hidden="true">
    {kind === "long"
      ? <><rect x="8" y="16" width="98" height="28" /><path d="M30 16v28M78 16v28" /><rect className="tw-type-room" x="8" y="16" width="22" height="28" /><path d="M106 22h8M106 38h8" /></>
      : <><rect x="34" y="10" width="52" height="16" /><rect className="tw-type-room" x="54" y="4" width="12" height="8" /><path d="M20 26h80v28H20Z" strokeDasharray="3 3" /></>}
  </svg>;
}

export function World() {
  const open = useOpen();
  const p = D.parallels;
  const link = linkFor(D.critical.link);
  return <>
    <Head num="02" kicker="Its world" title="A house like its neighbours." turn="Not a copy." lead={<Prose text={p.lead} />} />
    <ul className="tw-sites">
      {p.sites.map((s) => <li key={s.id}>
        <TypeMark kind={TD.types[s.id] === "broad" ? "broad" : "long"} />
        <p className="tw-site-type">{TD.types[s.id] === "broad" ? "Broad room" : "Long house, rooms in a line"} · type, not to scale</p>
        <h3><Checked text={s.name} /></h3>
        <Tags kinds={tagsOf(`site:${s.id}`)} />
        <p className="tw-site-says"><Prose text={s.inference} /></p>
        <button type="button" className="tw-open" data-opener={`site:${s.id}`} aria-haspopup="dialog" onClick={() => open(`site:${s.id}`)}>Open the record <span aria-hidden="true">→</span></button>
      </li>)}
    </ul>
    <div className="tw-tent">
      <h3>The tent among tent-shrines</h3>
      <ThreeParts evidence={p.tabernacle.evidence} inference={p.tabernacle.inference} limit={p.tabernacle.limit} />
    </div>
    <div className="tw-critical">
      <div>
        <p className="tw-kicker">Others' view, described</p>
        <h3><Checked text={D.critical.head} /></h3>
        <p className="tw-para"><Prose text={D.critical.view} /></p>
      </div>
      <div>
        <p className="tw-kicker">The answer</p>
        <p className="tw-para"><Prose text={D.critical.answer} /></p>
        <p className="tw-para">{link ? <Link className="tw-link" to={link}>{D.critical.link} <span aria-hidden="true">→</span></Link> : D.critical.link}</p>
      </div>
    </div>
  </>;
}
