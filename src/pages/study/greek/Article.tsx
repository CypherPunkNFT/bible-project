// Section 04: the article. Every θεός in John 1, marked with or without it, then the claim that no article means "a god", tested on those
// verses. Harner's table of what John could have written is kept short, and the page does not choose between the two grammarians.
import { D, G } from "./model";
import { Cite, Gk, Head, Mixed, Test, ThreeParts, VerseLink } from "./parts";

export function Article() {
  const without = G.theos.filter((m) => !m.article).length;
  return <>
    <Head title={<>The small word.<em> And what its absence does not prove.</em></>}
      lead={<>Greek has a word for “the”, <Gk>ὁ</Gk>, and it changes its form to agree with its noun. It has no word for “a”. So a noun without <Gk>ὁ</Gk> is not automatically “a” anything.</>} />
    <h3 className="ng-sub">Every <Gk>θεός</Gk> in John 1</h3>
    <ol className="ng-theos" aria-label={`All ${G.theos.length} places in John 1. ${without} have no article.`}>
      {G.theos.map((mark, i) => <li key={i} className={mark.article ? "with" : "without"}>
        <span className="ng-theos-dot" aria-hidden="true" />
        <VerseLink label={mark.label} />
        <Gk big>{mark.form}</Gk>
        <small>{mark.article ? "with the article" : "no article"}</small>
      </li>)}
    </ol>
    <p className="ng-caption">Case forms of the same word, as STEP tags them. In John 1:18 the second word is <Gk>θεὸς</Gk> in the edition counted here, and “Son” in the traditional manuscripts, which is why English Bibles differ there.</p>
    <Test kicker={D.claims.article.claim ?? ""} question={<Mixed text={D.claims.article.question} />} options={D.claims.article.options} />
    <ThreeParts {...D.records.article} />
    <h3 className="ng-sub">What John could have written</h3>
    <p className="ng-para"><Mixed text={D.harner.line} /></p>
    <ul className="ng-clauses">{D.harner.clauses.map((c) => <li key={c.id} className={c.actual ? "actual" : ""}>
      <b>{c.id}</b><Gk big>{c.greek}</Gk><p><Mixed text={c.says} /></p>
    </li>)}</ul>
    <ul className="ng-views">{D.harner.views.map((v) => <li key={v.who}><b>{v.who}</b> <Mixed text={v.view} /><small>{v.status}</small></li>)}</ul>
    <div className="ng-voice"><p><Mixed text={D.harner.voice} /></p></div>
    <Cite ids={["harner", "colwell", "stepTagnt"]} />
  </>;
}
