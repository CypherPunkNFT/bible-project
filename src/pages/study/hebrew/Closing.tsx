// Section 07: how far the evidence reaches, what the page leaves to its neighbours, the words to keep apart, where its Hebrew comes from,
// the reading trail with what was read of each work, the credits, the site's own word about the English Bible, and the question to carry away.
import { Link } from "react-router-dom";
import { D, ext, H, thousands } from "./model";
import { He, Head, Mixed } from "./parts";

export function Closing() {
  const c = H.counts;
  return <>
    <Head letter="ז" num="07" kicker="Where it stops" title={<>You can say it.<em> That is where this page ends.</em></>}
      lead="What this study read, what it left out, and where to go next." />
    <div className="hw-voice"><p>{D.voice}</p></div>
    <div className="hw-close">
      <div><p className="hw-kicker">Words to keep apart</p>
        <dl className="hw-confused">{D.confusedWords.map((w) => <div key={w.word}><dt>{w.word}</dt><dd><Mixed text={w.note} /></dd></div>)}</dl></div>
      <div><p className="hw-kicker">How far the evidence reaches</p>
        <ul className="hw-reach">
          <li>Counted: {thousands(c.hebrewWords)} Hebrew words. Set aside: {thousands(c.aramaicWords)} Aramaic words and {thousands(c.setAside)} others STEP restores or supplies, or leaves untagged.</li>
          {D.reach.map((line) => <li key={line}>{line}</li>)}
        </ul>
        <p className="hw-kicker hw-kicker-gap">Not here</p>
        <ul className="hw-reach">{D.boundaries.out.map((line) => <li key={line}>{line}</li>)}</ul></div>
    </div>
    <p className="hw-kicker hw-trail-head">Where this page's Hebrew comes from</p>
    <p className="hw-para">{D.chain.line} The wider history is told in <Link to="/study/from-manuscript-to-printed-bible">From manuscript to printed Bible</Link>.</p>
    <ol className="hw-chain">{D.chain.steps.map((s) => <li key={s.name}><b>{s.name}</b><small>{s.note}</small></li>)}</ol>
    <p className="hw-kicker hw-trail-head">Reading trail, and what was read</p>
    <ul className="hw-sources">{D.sources.map((s) => <li key={s.id}>
      <p className="hw-source-title">{s.url.startsWith("/") ? <Link to={s.url}>{s.title}</Link> : <a href={s.url} {...ext}>{s.title}<span aria-hidden="true"> ↗</span></a>}<small>{s.kind}</small></p>
      <p className="hw-source-q">{s.answers}</p><p>{s.read}</p>
    </li>)}</ul>
    <p className="hw-kicker hw-trail-head">Credits</p>
    <ul className="hw-credits">
      <li><a href={D.credit.url} {...ext}>STEP Bible</a>. {D.credit.line} <a href={D.credit.licence} {...ext}>The licence ↗</a></li>
      {D.pictures.map((p) => <li key={p.id}><a href={p.href} {...ext}>{p.credit}</a>. {p.licence}. Retrieved {p.retrieved}.</li>)}
    </ul>
    <div className="hw-final">
      <p>“{D.question}”</p>
      <small>Carry that into the next commentary that tells you what <He>בָּרָא</He> really means.</small>
      <nav aria-label="Next from here">
        <Link to="/study/strongs-numbers">Strong's numbers →</Link>
        <Link to="/read/wlc/GEN/1">The Hebrew of Genesis 1 →</Link>
        <Link to="/study/from-manuscript-to-printed-bible">From manuscript to printed Bible →</Link>
        <Link to="/study/academic?area=languages">Back to Academic studies →</Link>
      </nav>
    </div>
  </>;
}
