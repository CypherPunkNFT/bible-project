// Section 06: how far the evidence reaches, what the page leaves to its neighbours, the words to keep apart, the reading trail with what
// was read of each work, the pictures' credits, and the question the reader carries away.
import { Link } from "react-router-dom";
import { D, ext } from "./model";
import { Head } from "./parts";

const NEARBY: [string, string][] = [
  ["/topics/reaping", "Reaping"], ["/topics/threshing", "Threshing"], ["/topics/harvest", "Harvest"], ["/topics/vineyards", "Vineyards"], ["/topics/agriculture-or-husbandry", "Agriculture"],
  ["/topics/c/trades", "Work, wealth & trade"], ["/topics/c/creation", "Creation & nature"], ["/study/museum-archaeology/istanbul-archaeology-museums", "The stone's museum, in Museum-Grade Archaeology"],
];

export function Closing() {
  return <>
    <Head num="06" kicker="Where it stops" title={<>An order, firmly.<em> A date, never.</em></>}
      lead="What this study read, what it left out, and where to go next." />
    <div className="fy-close">
      <div><p className="fy-kicker">Words to keep apart</p>
        <dl className="fy-confused">{D.confusedWords.map((w) => <div key={w.word}><dt>{w.word}</dt><dd>{w.note}</dd></div>)}</dl></div>
      <div><p className="fy-kicker">How far the evidence reaches</p>
        <ul className="fy-reach">{D.reach.map((line) => <li key={line}>{line}</li>)}</ul>
        <p className="fy-kicker fy-kicker-gap">Not here</p>
        <ul className="fy-reach">{D.boundaries.out.map((line) => <li key={line}>{line}</li>)}</ul></div>
    </div>
    <p className="fy-kicker fy-trail-head">Nearby on this site</p>
    <nav className="fy-nearby" aria-label="Nearby on this site">{NEARBY.map(([href, label]) => <Link key={href} to={href}>{label}</Link>)}</nav>
    <p className="fy-kicker fy-trail-head">Reading trail, and what was read</p>
    <ul className="fy-sources">{D.sources.map((s) => <li key={s.id}>
      <p className="fy-source-title">{s.url.startsWith("/") ? <Link to={s.url}>{s.title}</Link> : <a href={s.url} {...ext}>{s.title}<span aria-hidden="true"> ↗</span></a>}<small>{s.kind}</small></p>
      <p className="fy-source-q">{s.answers}</p><p>{s.read}</p>
    </li>)}</ul>
    <p className="fy-kicker fy-trail-head">Pictures</p>
    <ul className="fy-credits">{D.pictures.map((p) => <li key={p.id}><a href={p.href} {...ext}>{p.credit}</a>. <a href={p.licenceUrl} {...ext}>{p.licence}</a>{`. Retrieved ${p.retrieved}.`}</li>)}</ul>
    <div className="fy-final">
      <p>“{D.question}”</p>
      <small>Carry that into the next passage that mentions a harvest.</small>
      <nav aria-label="Next from here">
        <Link to="/study/home-and-household">Where the grain went: Home and household →</Link>
        <Link to="/study/gospels?guide=parables">The parables of Christ →</Link>
        <Link to="/study/academic?area=culture">Back to Academic studies →</Link>
      </nav>
    </div>
  </>;
}
