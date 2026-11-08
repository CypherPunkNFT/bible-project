// Section 04: the schools, by the form of their argument rather than a tour of their doctrine. One article from Aquinas taken apart, with arcs that
// tie each reply back to its objection and say so in words; the road to lecture at Paris on a true scale of age, with what is worked back hatched;
// and four schools with how each date was chosen.
import { Link } from "react-router-dom";
import { ageShare, ARTICLE_ROW, articleArc, D, findPart, LADDER_AGES, partById, sourceById, type LadderStep, type Part } from "./model";
import { Cite, Head, OldText, Picture, Quote, StandPanel, T } from "./parts";

function Article({ part, onPart }: { part: Part; onPart: (id: string) => void }) {
  const { parts } = D.article, tied = new Set([part.id, part.answeredBy, part.answers]);
  const arcs = parts.filter((p) => p.answeredBy);
  return <div className="mv-articlerows">
    <svg className="mv-arcs" viewBox={`0 0 50 ${parts.length * ARTICLE_ROW}`} width="50" height={parts.length * ARTICLE_ROW} aria-hidden="true">
      {arcs.map((p) => <path key={p.id} className={tied.has(p.id) ? "on" : ""} d={articleArc(p.id, p.answeredBy!)} />)}
    </svg>
    <ol className="mv-parts">{parts.map((p) => <li key={p.id} style={{ height: ARTICLE_ROW }}><button type="button" aria-pressed={p.id === part.id} onClick={() => onPart(p.id)}>
      <small>{p.n}</small><strong>{p.name}</strong>
    </button></li>)}</ol>
  </div>;
}

function PartRecord({ part }: { part: Part }) {
  const tie = part.answeredBy ? `Answered, by name, in the ${partById.get(part.answeredBy)?.n.toLowerCase()}.` : part.answers ? `This answers ${partById.get(part.answers)?.n.toLowerCase()}, and no other.` : null;
  return <div className="mv-partrecord" aria-live="polite">
    <OldText who={<>Aquinas, in the English Dominican translation: <Link to="/teachers/scholars/aquinas">{part.n}</Link></>}>{part.text}</OldText>
    <p className="mv-para"><b>What this move does.</b> {part.does}</p>
    {tie && <p className="mv-tie">{tie}</p>}
    {part.verse && <><p className="mv-kicker mv-kicker-gap">The same verse in the Berean</p><Quote label={part.verse} /></>}
  </div>;
}

function Rung({ step }: { step: LadderStep }) {
  const left = ageShare(step.from) * 100, width = (ageShare(step.to) - ageShare(step.from)) * 100, open = step.id === "lecture-theology";
  return <li className="mv-rung">
    <div className="mv-rungname"><strong>{step.name}</strong><small><T text={step.text} /></small></div>
    <div className="mv-rungtrack"><span className={`${step.inferred ? "inferred" : ""}${open ? " open" : ""}`} style={{ left: `${left}%`, width: `${open ? 100 - left : width}%` }} /></div>
  </li>;
}

function Ladder() {
  const ages = [15, 20, 25, 30, 35, 40];
  return <div className="mv-ladder">
    <h3 className="mv-subhead">The road to that lectern</h3>
    <div className="mv-agescale" aria-hidden="true">{ages.map((a) => <span key={a} style={{ left: `${ageShare(a) * 100}%` }}>{a}</span>)}</div>
    <ol>{D.ladder.steps.map((s) => <Rung key={s.id} step={s} />)}</ol>
    <p className="mv-caption">Ages {LADDER_AGES.from} to {LADDER_AGES.to}, drawn to scale. <T text={D.ladder.note} /> Solid bars are the statute's, hatched bars are worked back. Its translation has “twenty” where other accounts of the same rule give twenty-one.</p>
  </div>;
}

export function School({ partId, onChange }: { partId: string | null; onChange: (values: Record<string, string | null>) => void }) {
  const part = findPart(partId), abelard = sourceById.get(D.abelard.source);
  return <>
    <Head num="06" kicker="A question and its schools" title={<>Hear the other side first.<em> Then answer it by name.</em></>}
      lead="Universities grew from cathedral schools, and they taught by a form as strict as a sonnet. Here is one short article from Thomas Aquinas, about the largest question there is, taken apart move by move." />
    <p className="mv-para"><T text={D.article.note} /></p>
    <div className="mv-article">
      <Article part={part} onPart={(id) => onChange({ part: id })} />
      <PartRecord part={part} />
    </div>
    <p className="mv-caption">{D.article.cite}. The arcs tie each objection to its reply. <T text={D.abelard.text} /> “{D.abelard.quote}”, as {abelard?.title.includes("W. J. Lewis") ? "W. J. Lewis" : "its translator"} renders it.</p>
    <div className="mv-schoolgrid">
      <Ladder />
      <div>
        <h3 className="mv-subhead">Four schools, and how each date was chosen</h3>
        <dl className="mv-schools">{D.schools.map((s) => <div key={s.name}><dt>{s.name}</dt><dd><b>{s.when}</b> <T text={s.note} /></dd></div>)}</dl>
        <Picture id="lecture" />
      </div>
    </div>
    <Cite ids={["summa", "abelard", "paris-1215", "wiki-schools"]} />
    <StandPanel stand={D.schoolStand} labels={[]} />
  </>;
}
