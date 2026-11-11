// 07 Where it stops: the words to keep apart, how far the page reaches and what it leaves to other studies, the neighbours
// (linked only where the site has the page, under the site's own title), the reading trail and the sources with what was read
// of each, the pictures not yet shown, the closing question and the way back to Academic studies.
import { Link } from "react-router-dom";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { D, readingTag, XS } from "./model";
import { Head, Prose } from "./parts";

function Neighbours() {
  const cited = new Map(D.neighbours.map((n) => [n.study, n.cited]));
  return <ul className="xs-neighbours">{XS.neighbours.map((n) => <li key={n.study}>
    {n.route ? <Link to={n.route}>{n.siteTitle} <span aria-hidden="true">→</span></Link> : <span className="xs-unbuilt">{n.siteTitle || <Checked text={n.study} />}</span>}
    {n.siteTitle && n.siteTitle !== n.study.replace(/ \(\d+\)$/, "") && <small>{`named in the research as “${n.study}”`}</small>}
    {!n.route && <small>no page yet</small>}
    <p><Prose text={cited.get(n.study) ?? ""} /></p>
  </li>)}</ul>;
}

export function Closing() {
  return <>
    <Head num="07" kicker="Where it stops" title="A selection." turn="The text stays." />
    <div className="xs-close">
      <div>
        <h3>Words to keep apart</h3>
        <dl className="xs-words">{D.confusedWords.map((w) => <div key={w.word}><dt><Checked text={w.word} /></dt><dd><Prose text={w.note} /></dd></div>)}</dl>
        <h3>How far this page reaches</h3>
        <ul className="xs-reach">{D.reach.map((r) => <li key={r}><Prose text={r} /></li>)}</ul>
        <h3>Left to other studies</h3>
        <ul className="xs-reach">{D.boundaries.out.map((o) => <li key={o}><Prose text={o} /></li>)}</ul>
      </div>
      <div>
        <h3>Neighbours</h3>
        <Neighbours />
        <h3>Reading trail</h3>
        <ul className="xs-trail">{D.readingTrail.map((t) => <li key={t.work}><Checked text={t.work} /><small><Checked text={t.answers} /></small><small className="xs-tagline"><Checked text={t.read} /></small></li>)}</ul>
        <h3>Sources named in the research</h3>
        <ul className="xs-sources">{D.sources.map((s) => <li key={s.id}><Checked text={s.title} /> <span className="xs-tagline">· {readingTag(s.status)}</span></li>)}</ul>
        <p className="xs-caption">{D.sources.every((s) => s.status === "located") && <>Every source is located, not read: each view given to a named scholar is still to be checked against that scholar's own pages. </>}The research gives no web address for these works, so none is linked. <Checked text={D.picturesNote} /> No picture is shown until its licence is settled.</p>
      </div>
    </div>
    <div className="xs-closing">
      <p>Whose date is this: the text's, the ground's, or someone's joining of the two?</p>
      <Link to={XS.links.academic}>Back to Academic studies <span aria-hidden="true">→</span></Link>
    </div>
  </>;
}
