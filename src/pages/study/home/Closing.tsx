// Section 06: how far the evidence reaches, what the page leaves to its neighbours, the words to keep apart, the reading trail with what
// was read of each work, the pictures' credits, and the question the reader carries away.
import { Link } from "react-router-dom";
import { D, ext } from "./model";
import { Head } from "./parts";

export function Closing() {
  return <>
    <Head num="06" kicker="Where it stops" title={<>Found here.<em> Not settled here.</em></>}
      lead="What this study read, what it left out, and where to go next." />
    <div className="hh-close">
      <div><p className="hh-kicker">Words to keep apart</p>
        <dl className="hh-confused">{D.confusedWords.map((w) => <div key={w.word}><dt>{w.word}</dt><dd>{w.note}</dd></div>)}</dl></div>
      <div><p className="hh-kicker">How far the evidence reaches</p>
        <ul className="hh-reach">{D.reach.map((line) => <li key={line}>{line}</li>)}</ul>
        <p className="hh-kicker hh-kicker-gap">Not here</p>
        <ul className="hh-reach">{D.boundaries.out.map((line) => <li key={line}>{line}</li>)}</ul></div>
    </div>
    <p className="hh-kicker hh-trail-head">Reading trail, and what was read</p>
    <ul className="hh-sources">{D.sources.map((s) => <li key={s.id}>
      <p className="hh-source-title">{s.url.startsWith("/") ? <Link to={s.url}>{s.title}</Link> : <a href={s.url} {...ext}>{s.title}<span aria-hidden="true"> ↗</span></a>}<small>{s.kind}</small></p>
      <p className="hh-source-q">{s.answers}</p><p>{s.read}</p>
    </li>)}</ul>
    <p className="hh-kicker hh-trail-head">Pictures</p>
    <ul className="hh-credits">{D.pictures.map((p) => <li key={p.id}><a href={p.href} {...ext}>{p.credit}</a>. <a href={p.licenceUrl} {...ext}>{p.licence}</a>{`. Retrieved ${p.retrieved}.`}</li>)}</ul>
    <div className="hh-final">
      <p>“{D.question}”</p>
      <small>Carry that into the next drawing of a Bible home you see.</small>
      <nav aria-label="Next from here">
        <Link to="/study/world-of-jesus-apostles">Homes and cities in the first century →</Link>
        <Link to="/topics/c/family">Marriage, family & neighbours →</Link>
        <Link to="/study/academic?area=culture">Back to Academic studies →</Link>
      </nav>
    </div>
  </>;
}
