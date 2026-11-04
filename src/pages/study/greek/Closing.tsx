// Section 07: the site's own word about the English Bible, the words to keep apart, how far the evidence reaches, what the page leaves to
// its neighbours, the reading trail with what was read of each work, the credits, and the question to carry away.
import { Link } from "react-router-dom";
import { D, ext, G, thousands } from "./model";
import { Head, Mixed } from "./parts";

export function Closing() {
  const c = G.counts;
  return <>
    <Head title={<>You can read the letters.<em> That is where this page ends.</em></>} lead="What this study read, what it left out, and where to go next." />
    <div className="ng-voice"><p>{D.voice}</p></div>
    <div className="ng-close">
      <div><p className="ng-kicker">Words to keep apart</p>
        <dl className="ng-confused">{D.confusedWords.map((w) => <div key={w.word}><dt>{w.word}</dt><dd><Mixed text={w.note} /></dd></div>)}</dl></div>
      <div><p className="ng-kicker">How far the evidence reaches</p>
        <ul className="ng-reach">
          <li>Counted: {thousands(c.words)} Greek words, of the {thousands(c.allRows)} word entries STEP holds across all the editions it compares.</li>
          {D.reach.map((line) => <li key={line}>{line}</li>)}
        </ul>
        <p className="ng-kicker ng-kicker-gap">Not here</p>
        <ul className="ng-reach">{D.boundaries.out.map((line) => <li key={line}>{line}</li>)}</ul></div>
    </div>
    <p className="ng-kicker ng-trail-head">Reading trail, and what was read</p>
    <ul className="ng-sources">{D.sources.map((s) => <li key={s.id}>
      <p className="ng-source-title">{s.url.startsWith("/") ? <Link to={s.url}>{s.title}</Link> : <a href={s.url} {...ext}>{s.title}<span aria-hidden="true"> ↗</span></a>}<small>{s.kind}</small></p>
      <p className="ng-source-q">{s.answers}</p><p>{s.read}</p>
    </li>)}</ul>
    <p className="ng-kicker ng-trail-head">Credits</p>
    <ul className="ng-credits">
      <li><a href={D.credit.url} {...ext}>STEP Bible</a>. {D.credit.line} <a href={D.credit.licence} {...ext}>The licence ↗</a></li>
      {D.pictures.map((p) => <li key={p.id}><a href={p.href} {...ext}>{p.credit}</a>. {p.licence}. Retrieved {p.retrieved}.</li>)}
    </ul>
    <div className="ng-final">
      <p>“{D.question}”</p>
      <small>{D.closing.note}</small>
      <nav aria-label="Next from here">
        <Link to="/study/strongs-numbers">Strong's numbers →</Link>
        <Link to="/study/how-hebrew-works">How Hebrew works →</Link>
        <Link to="/read/bsb/JHN/1">John 1 in the Berean →</Link>
        <Link to="/study/academic?area=languages">Back to Academic studies →</Link>
      </nav>
    </div>
  </>;
}
