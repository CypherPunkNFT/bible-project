// Section 06: how far the evidence reaches, what the page leaves to its neighbours, the words to keep apart, the reading trail with what
// was read of each work, the pictures' credits, and the question the reader carries away.
import { Link } from "react-router-dom";
import { D, ext } from "./model";
import { Head } from "./parts";

const NEARBY: [string, string][] = [
  ["/study/israel-among-the-empires", "Israel among the empires"], ["/study/from-discovery-to-history", "From discovery to history"],
  ["/study/how-hebrew-works", "How Hebrew works"], ["/study/the-farming-year", "The farming year"],
];

export function Closing() {
  return <>
    <Head num="06" kicker="Where it stops" title={<>Likeness, firmly.<em> Lineage, not proven.</em></>}
      lead="What this study read, what it left out, and where to go next." />
    <div className="eg-close">
      <div><p className="eg-kicker">Words to keep apart</p>
        <dl className="eg-confused">{D.confusedWords.map((w) => <div key={w.word}><dt>{w.word}</dt><dd>{w.note}</dd></div>)}</dl></div>
      <div><p className="eg-kicker">How far the evidence reaches</p>
        <ul className="eg-reach">{D.reach.map((line) => <li key={line}>{line}</li>)}</ul>
        <p className="eg-kicker eg-kicker-gap">Not here</p>
        <ul className="eg-reach">{D.boundaries.out.map((line) => <li key={line}>{line}</li>)}</ul></div>
    </div>
    <p className="eg-kicker eg-trail-head">Nearby on this site</p>
    <nav className="eg-nearby" aria-label="Nearby on this site">{NEARBY.map(([href, label]) => <Link key={href} to={href}>{label}</Link>)}</nav>
    <p className="eg-kicker eg-trail-head">Reading trail, and what was read</p>
    <ul className="eg-sources">{D.sources.map((s) => <li key={s.id}>
      <p className="eg-source-title"><a href={s.url} {...ext}>{s.title}<span aria-hidden="true"> ↗</span></a><small>{s.kind}</small></p>
      <p className="eg-source-q">{s.answers}</p><p>{s.read}</p>
    </li>)}</ul>
    <p className="eg-kicker eg-trail-head">Pictures</p>
    <ul className="eg-credits">{D.pictures.map((p) => <li key={p.id}><a href={p.href} {...ext}>{p.credit}</a>. <a href={p.licenceUrl} {...ext}>{p.licence}</a>. Retrieved {p.retrieved}.</li>)}</ul>
    <div className="eg-final">
      <p>“{D.question}”</p>
      <small>Carry that into the next time you hear that the Bible got something from Egypt, or the next time you hear that it did not.</small>
      <nav aria-label="Next from here">
        <Link to="/study/israel-among-the-empires">Egypt and Judah's kings: Israel among the empires →</Link>
        <Link to="/study/how-hebrew-works">Hebrew's own workings: How Hebrew works →</Link>
        <Link to="/study/academic?area=culture">Back to Academic studies →</Link>
      </nav>
    </div>
  </>;
}
