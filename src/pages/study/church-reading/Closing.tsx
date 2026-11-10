// Section 07: how far the evidence reaches, what the page leaves to its neighbours, the words to keep apart, the reading trail with what
// was read of each work, the pictures' credits, and the question the reader carries away.
import { Link } from "react-router-dom";
import { D, ext, sourceCounts } from "./model";
import { Head } from "./parts";
import { formatNumber } from "@/lib/site-format";

const NEARBY: [string, string][] = [
  ["/read/bsb/GAL/4", "Galatians 4 in the Berean"], ["/teachers/scholars/origen", "Origen"], ["/teachers/scholars/augustine", "Augustine"], ["/teachers/scholars/aquinas", "Thomas Aquinas"],
  ["/teachers/scholars/tyndale", "William Tyndale"], ["/teachers/scholars/lightfoot", "J. B. Lightfoot"], ["/teachers/scholars", "All the scholars"], ["/study/circles", "Circles of study"],
  ["/study/atlas/early-church", "The early church: an outline"], ["/study/the-medieval-church", "The medieval church"], ["/study/atlas/reformation", "The Reformation: an outline"], ["/study/creeds", "Catechisms & Creeds"],
];

export function Closing() {
  const counts = sourceCounts(D.sources);
  return <>
    <Head num="07" kicker="Where it stops" title={<>A selection, stated.<em> The passage stays.</em></>}
      lead="What this study read, what it left out, and where to go next." />
    <div className="hc-close">
      <div><p className="hc-kicker">Words to keep apart</p>
        <dl className="hc-confused">{D.confusedWords.map((w) => <div key={w.word}><dt>{w.word}</dt><dd>{w.note}</dd></div>)}</dl></div>
      <div><p className="hc-kicker">How far the evidence reaches</p>
        <ul className="hc-reach">{D.reach.map((line) => <li key={line}>{line}</li>)}</ul>
        <p className="hc-kicker hc-kicker-gap">Not here</p>
        <ul className="hc-reach">{D.boundaries.out.map((line) => <li key={line}>{line}</li>)}</ul></div>
    </div>
    <p className="hc-kicker hc-trail-head">Nearby on this site</p>
    <nav className="hc-nearby" aria-label="Nearby on this site">{NEARBY.map(([href, label]) => <Link key={href} to={href}>{label}</Link>)}</nav>
    <details className="hc-trail">
      <summary><span className="hc-kicker">Reading trail, and what was read</span><span className="hc-trail-count">{`Of ${formatNumber(D.sources.length)} sources: ${formatNumber(counts.whole)} used in full (the passage itself), ${formatNumber(counts.part)} read in part, ${formatNumber(counts.secondHand)} known only second-hand, ${formatNumber(counts.located)} located and not read.`}</span></summary>
      <ul className="hc-sources">{D.sources.map((s) => <li key={s.id}>
      <p className="hc-source-title">{s.url.startsWith("/") ? <Link to={s.url}>{s.title}</Link> : <a href={s.url} {...ext}>{s.title}<span aria-hidden="true"> ↗</span></a>}<small>{s.kind}</small></p>
      <p className="hc-source-q">{s.answers}</p><p>{s.read}</p>
      </li>)}</ul>
    </details>
    <p className="hc-kicker hc-trail-head">Pictures</p>
    <ul className="hc-credits">{D.pictures.map((p) => <li key={p.id}><a href={p.href} {...ext}>{p.credit}</a>. <a href={p.licenceUrl} {...ext}>{p.licence}</a>{`. Retrieved ${p.retrieved}.`}</li>)}</ul>
    <div className="hc-final">
      <p>“{D.question}”</p>
      <small>Carry that to the next time someone tells you what a passage has always meant.</small>
      <nav aria-label="Next from here">
        <Link to="/read/bsb/GAL/4">Read Galatians 4 again →</Link>
        <Link to="/study/how-the-canon-took-shape">Whose list, and why: How the canon took shape →</Link>
        <Link to="/study/academic?area=church">Back to Academic studies →</Link>
      </nav>
    </div>
  </>;
}
