// Section 05: how far the data reaches, the words to keep apart, the reading trail with what was read of each work, and the question
// the reader carries away.
import { Link } from "react-router-dom";
import { D, ext } from "./model";
import { Head } from "./parts";

export function Closing() {
  return <>
    <Head num="05" kicker="Where it stops" title={<>Counted here.<em> Not settled here.</em></>}
      lead="What this study read, what it left out, and where to go next." />
    <div className="sn-close">
      <div><p className="sn-kicker">Words to keep apart</p>
        <dl className="sn-confused">{D.confusedWords.map((w) => <div key={w.word}><dt>{w.word}</dt><dd>{w.note}</dd></div>)}</dl></div>
      <div><p className="sn-kicker">How far the data reaches</p>
        <ul className="sn-reach">{D.reach.map((line) => <li key={line}>{line}</li>)}</ul></div>
    </div>
    <p className="sn-kicker sn-trail-head">Reading trail, and what was read</p>
    <ul className="sn-sources">{D.sources.map((s) => <li key={s.id}>
      <p className="sn-source-title">{s.url.startsWith("/") ? <Link to={s.url}>{s.title}</Link> : <a href={s.url} {...ext}>{s.title}<span aria-hidden="true"> ↗</span></a>}<small>{s.kind}</small></p>
      <p className="sn-source-q">{s.answers}</p><p>{s.read}</p>
    </li>)}</ul>
    <p className="sn-credit">Word data from <a href="https://www.STEPBible.org" {...ext}>STEP Bible</a>: data created by www.STEPBible.org based on work at Tyndale House Cambridge, CC BY 4.0. This study reduces it to letter ranges and a few words; it was not otherwise changed.</p>
    <div className="sn-final">
      <p>“What does the verse say, and what am I asking the number to say?”</p>
      <small>Carry that to the next word study you hear.</small>
      <nav aria-label="Next from here">
        <Link to="/study/letters/what-runs-through-them/words">Words across the letters →</Link>
        <Link to="/study/versions">Compare editions →</Link>
        <Link to="/study/academic?area=languages">Back to Academic studies →</Link>
      </nav>
    </div>
  </>;
}
