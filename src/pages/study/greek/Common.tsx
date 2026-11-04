// Section 06: where the New Testament's Greek came from. One real farmer's return beside Luke and Romans, then the old claim of a special
// language, tested. The two marks on the plate point to the lines the editors print. The return is shown for its language only.
import { useState } from "react";
import { D, ext, G, pictureById, thousands } from "./model";
import { Cite, Gk, Head, Mixed, Said, Test, ThreeParts, VerseLink } from "./parts";

function Plate() {
  const [broken, setBroken] = useState(false);
  const picture = pictureById.get(D.papyrus.id);
  if (!picture) { console.error(`How New Testament Greek works page: picture "${D.papyrus.id}" is not in the research record`); return null; }
  return <figure className="ng-plate">
    {broken
      ? <p className="ng-pic-missing">{picture.alt} The picture could not be loaded. Grenfell and Hunt's translation is beside it.</p>
      : <div className="ng-plate-img">
        <img src={picture.src} width={picture.width} height={picture.height} alt={picture.alt} loading="lazy" onError={() => { console.error(`How New Testament Greek works page: the picture ${picture.src} did not load`); setBroken(true); }} />
        {D.papyrus.marks.map((m) => <span key={m.id} className="ng-plate-mark" style={{ top: `${m.top}%` }} aria-hidden="true"><b>{m.line}</b></span>)}
      </div>}
    <figcaption>{picture.caption} <small>{picture.credit}. {picture.licence}. <a href={picture.href} {...ext}>Source page ↗</a></small></figcaption>
  </figure>;
}

export function Common() {
  const p = D.papyrus, luke = G.common.luke, lord = G.common.lord;
  return <>
    <Head title={<>Everyday Greek.<em> A farmer used these words too.</em></>}
      lead="For a long time readers took the New Testament's Greek to be a language of its own. Then papyri came out of the Egyptian sand, and people found it in letters, accounts and forms." />
    <div className="ng-return">
      <Plate />
      <div>
        <p className="ng-kicker">What the return says</p>
        <blockquote className="ng-said"><p>{p.translation}</p><cite>{p.translationBy}</cite></blockquote>
        <ul className="ng-markword">{p.marks.map((m) => <li key={m.id}><b>{m.line}</b><Gk big>{m.greek}</Gk><span>{m.gloss}</span></li>)}</ul>
        <dl className="ng-facts">{p.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
      </div>
    </div>
    <div className="ng-shared">
      <div><p className="ng-kicker">The same verb in Luke</p>
        <p><Gk big>{p.luke.form}</Gk></p>
        <p className="ng-para">Luke writes of Caesar's decree in the verb the farmer uses for his lambs. <VerseLink label={luke.label} />, one of {thousands(luke.count)} uses in the words counted.</p></div>
      <div><p className="ng-kicker">The same word in Romans</p>
        <p><Gk big>{p.lord.form}</Gk></p>
        <p className="ng-para"><Mixed text={p.lord.line} /> <VerseLink label={lord.label} />.</p>
        <p className="ng-note">{p.lord.note}</p></div>
    </div>
    <h3 className="ng-sub">“{D.claims.spirit.claim}”</h3>
    <Said quote={{ text: (D.claims.spirit.quote ?? "").replace(/[“”]/g, ""), by: D.claims.spirit.quoteBy ?? "" }} />
    <Said quote={D.quotes.deissmann} />
    <Said quote={D.quotes.robertson} />
    <Test kicker="Your turn" question={D.claims.spirit.question} options={D.claims.spirit.options} />
    <ThreeParts {...D.records.common} />
    <Cite ids={["deissmann", "robertson", "oxy", "stepTagnt"]} />
  </>;
}
