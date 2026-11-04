// Section 07: how far the evidence reaches, what the page leaves to its neighbours, the words to keep apart, the reading trail with what was read
// of each work, the pictures' credits, and the question the reader carries away.
import { Link } from "react-router-dom";
import { D, ext } from "./model";
import { Head } from "./parts";

const NEARBY: [string, string][] = [
  ["/study/how-the-church-has-read-the-bible", "How the church has read the Bible"], ["/study/atlas/early-church", "The early church: an outline"], ["/study/atlas/reformation", "The Reformation: an outline"],
  ["/study/atlas/catholic-orthodox", "Christian traditions: an outline"], ["/study/creeds", "Catechisms & Creeds"], ["/teachers/scholars/aquinas", "Thomas Aquinas"], ["/teachers/scholars", "All the scholars"],
];

export function Closing() {
  return <>
    <Head num="07" kicker="Where it stops" title={<>A selection, stated.<em> The question stays.</em></>}
      lead="What this study read, what it left out, and where to go next." />
    <div className="mv-close">
      <div><p className="mv-kicker">Words to keep apart</p>
        <dl className="mv-confused">{D.confusedWords.map((w) => <div key={w.word}><dt>{w.word}</dt><dd>{w.note}</dd></div>)}</dl></div>
      <div><p className="mv-kicker">How far the evidence reaches</p>
        <ul className="mv-reach">{D.reach.map((line) => <li key={line}>{line}</li>)}</ul>
        <p className="mv-kicker mv-kicker-gap">Not here</p>
        <ul className="mv-reach">{D.boundaries.out.map((line) => <li key={line}>{line}</li>)}</ul></div>
    </div>
    <p className="mv-kicker mv-trail-head">Nearby on this site</p>
    <nav className="mv-nearby" aria-label="Nearby on this site">{NEARBY.map(([href, label]) => <Link key={href} to={href}>{label}</Link>)}</nav>
    <p className="mv-kicker mv-trail-head">Reading trail, and what was read</p>
    <ul className="mv-sources">{D.sources.map((s) => <li key={s.id}>
      <p className="mv-source-title"><a href={s.url} {...ext}>{s.title}<span aria-hidden="true"> ↗</span></a><small>{s.kind}</small></p>
      <p className="mv-source-q">{s.answers}</p><p>{s.read}</p>
    </li>)}</ul>
    <p className="mv-kicker mv-trail-head">Pictures</p>
    <ul className="mv-credits">{D.pictures.map((p) => <li key={p.id}><a href={p.href} {...ext}>{p.credit}</a>. <a href={p.licenceUrl} {...ext}>{p.licence}</a>. Retrieved {p.retrieved}.</li>)}</ul>
    <div className="mv-final">
      <p>“{D.question}”</p>
      <small>Carry that to the next document you hear settles a question about the Middle Ages, whether it is offered in praise of them or in blame.</small>
      <nav aria-label="Next from here">
        <Link to="/study/how-the-church-has-read-the-bible">How these readers read Scripture: How the church has read the Bible →</Link>
        <Link to="/study/atlas/reformation">Where this hands over: The Reformation, an outline →</Link>
        <Link to="/study/academic?area=church">Back to Academic studies →</Link>
      </nav>
    </div>
  </>;
}
