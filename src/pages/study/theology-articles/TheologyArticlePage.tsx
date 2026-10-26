// One article, read straight through. Each part keeps its own failure, so a block that cannot be
// drawn costs the reader that part and not the page.
import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { ARTICLES, SECTION_BASE, articleHref, findArticle } from "./model";
import { Part, SourceList } from "./parts";
import { TheologyArt } from "./TheologyArt";
import "./theology.css";

/** An address that names no article we hold. Said in the page rather than as a 404, so the reader
 *  keeps the section they were trying to reach. */
function NotInSection({ id }: { id: string | undefined }) {
  return <div className="theology-section"><div className="th-container">
    <div className="th-missing">
      <StudyBackLink />
      <p className="eyebrow">Theology</p>
      <h1>There is no article at this address.</h1>
      <p>{id ? <>Nothing in this section is called “{id}”.</> : <>No article was named.</>} The section holds {ARTICLES.length === 1 ? "one article" : `${ARTICLES.length} articles`} at the moment:</p>
      <ul>{ARTICLES.map((article) => <li key={article.id}><Link to={articleHref(article.id)}>{article.title}</Link> — {article.kicker}</li>)}</ul>
      <p><Link to={SECTION_BASE}>Back to Theology</Link></p>
    </div>
  </div></div>;
}

export default function TheologyArticlePage() {
  const { id } = useParams();
  const { hash, pathname } = useLocation();
  const article = findArticle(id ?? "");

  useEffect(() => {
    if (!article) return;
    document.title = `${article.title} · Theology · Study · Bible Guide`;
    return () => { document.title = "Bible Guide"; };
  }, [article]);

  // The app frame scrolls every new page to the top (src/components/Layout.tsx), which lands a deep
  // link to a part at the top of the article instead. Honour the hash after that has happened; two
  // frames, because the scroll to top is itself queued from an effect.
  useEffect(() => {
    if (!hash) return;
    // A hand-typed address can carry a malformed escape, which would throw out of the effect.
    let fragment = hash.slice(1);
    try { fragment = decodeURIComponent(fragment); } catch { /* use it as typed */ }
    const target = document.getElementById(fragment);
    if (!target) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "auto" }));
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [hash, pathname]);

  if (!article) return <NotInSection id={id} />;

  const scripture = article.sections.flatMap((section) => section.body).filter((block) => block.kind === "scripture").length;
  return <div className="theology-section"><div className="th-container">
    <header className="th-hero">
      <div className="th-hero-copy">
        <StudyBackLink />
        <p className="eyebrow"><Link to={SECTION_BASE}>Theology</Link> · Article</p>
        <h1>{article.title}<br /><em>{article.kicker}.</em></h1>
        <p className="th-question">{article.question}</p>
        <p className="th-lead">{article.summary}</p>
        <div className="th-article-meta">
          <span>{article.minutes} min read</span>
          <span>{article.sections.length} parts</span>
          <span>{scripture} passages, Berean Standard Bible</span>
          <span>{article.sourceIds.length} sources</span>
        </div>
      </div>
      <TheologyArt />
    </header>

    <nav className="th-toc" aria-label="The parts of this article">
      <span className="th-small-label">In this article</span>
      <ol>{article.sections.map((section) => <li key={section.id}>
        <a href={`#${section.id}`}><strong>{section.kicker}</strong><span>{section.title}</span></a>
      </li>)}</ol>
    </nav>

    {article.sections.map((section, i) => (
      <Part key={`${article.id}-${section.id}`} section={section} number={i + 1} />
    ))}

    <section className="th-related" aria-labelledby="th-related-title">
      <span className="eyebrow">Read next</span>
      <h2 id="th-related-title" className="th-related-title">The documents<em> themselves.</em></h2>
      <ul>{article.related.map((item) => <li key={item.to}>
        <Link to={item.to}><strong>{item.label}</strong><span>{item.note}</span></Link>
      </li>)}</ul>
    </section>

    <footer className="th-sources">
      <div>
        <span className="eyebrow">Every source in this article</span>
        <h2>Named editions.<br /><em>Nothing taken on trust.</em></h2>
        <p>Each work quoted above, with its author, the translation the words were read in, and its licence. Where this site holds the text, the link opens our copy.</p>
      </div>
      <div>
        <h3>Where these words come from</h3>
        <SourceList ids={article.sourceIds} />
      </div>
    </footer>
  </div></div>;
}
