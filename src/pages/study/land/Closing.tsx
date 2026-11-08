// 08 · Where it stops: the words to keep apart, what this page leaves to its neighbours, the site's stance, the questions still
// open, the reading trail with what was read of each source, the closing question and the way back to Academic studies.
import { Link } from "react-router-dom";
import { useCheckNotes } from "@/pages/study/check-notes/context";
import { D, ext, readingTag, safeUrl, urlNote } from "./model";
import { Head, StudyLink, T } from "./parts";

function SourceNote({ index }: { index: number }) {
  const notes = useCheckNotes();
  const id = urlNote(index);
  if (!id || !notes?.notes.has(id)) return null;
  return <button type="button" className="ls-ref" aria-haspopup="dialog" onClick={() => notes.openNote(id)}>Why no link yet</button>;
}

export function Closing() {
  return <>
    <Head num="08" kicker="Where it stops" title="A selection, stated." turn="The ground has moved."
      lead={<p><T text={D.boundaries.in} /></p>} />
    <div className="ls-stops">
      <div>
        <h3 className="ls-subhead">Words to keep apart</h3>
        <dl className="ls-words">{D.confusedWords.map((w) => <div key={w.word}><dt><T text={w.word} /></dt><dd><T text={w.note} /></dd></div>)}</dl>
      </div>
      <div>
        <h3 className="ls-subhead">How far this page reaches</h3>
        <ul className="ls-bullets">{D.reach.map((r, i) => <li key={i}><T text={r} /></li>)}</ul>
        <h3 className="ls-subhead">Left to other studies</h3>
        <ul className="ls-bullets">{D.boundaries.out.map((o, i) => <li key={i}><T text={o} /></li>)}</ul>
        <ul className="ls-bullets">{D.links.map((l) => <li key={l.title}><StudyLink title={l.title} /> <span className="ls-muted"><T text={l.why} /></span></li>)}</ul>
      </div>
    </div>
    <aside className="ls-stance">
      <p className="ls-kicker">{D.stance.head}</p>
      <p className="ls-confession">“<T text={D.stance.confession} />” <small><T text={D.stance.confessionSource} /></small></p>
      <p className="ls-para"><T text={D.stance.body} /></p>
    </aside>
    <h3 className="ls-subhead">Still open <em>what has to be checked before this page is final</em></h3>
    <ul className="ls-bullets ls-open">{D.openQuestions.map((q, i) => <li key={i}><T text={q} /></li>)}</ul>
    <h3 className="ls-subhead">Reading trail <em>the question each work answers, and what was read</em></h3>
    <ul className="ls-sources">{D.sources.map((s, i) => {
      const url = safeUrl(s.url);
      return <li key={s.id}>
        <p className="ls-src-t">{url ? <a href={url} {...ext}><T text={s.title} /> ↗</a> : <T text={s.title} />} <small>({readingTag(s.status)})</small></p>
        <p className="ls-muted"><T text={s.kind} /> · <T text={s.answers} /></p>
        <p className="ls-muted"><T text={s.read} /> {!url && <SourceNote index={i} />}</p>
      </li>;
    })}</ul>
    <div className="ls-close">
      <p className="ls-kicker">The question to carry</p>
      <p className="ls-close-q">Where on the ground is this, and how sure is the place?</p>
      <p className="ls-para ls-muted">What does the text say, what does the ground add, and what am I inferring?</p>
      <Link to="/study/academic" className="ls-back">← Back to Academic studies</Link>
    </div>
  </>;
}
