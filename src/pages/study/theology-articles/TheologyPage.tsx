// The Theology section's landing. One article is in it today, so the grid is an auto-fit row that a
// single wide card fills and a second article later splits, with no change to the layout.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { ARTICLES, SOURCES, articleHref, sectionFigures, type Article } from "./model";
import { Figures, SourceList } from "./parts";
import { TheologyArt } from "./TheologyArt";
import "./theology.css";

function ArticleCard({ article }: { article: Article }) {
  return <li className="th-card">
    <Link to={articleHref(article.id)}>
      <div className="th-card-copy">
        <span className="th-small-label">Article · {article.minutes} min read</span>
        <h3>{article.title}<em>{article.kicker}</em></h3>
        <p className="th-card-question">{article.question}</p>
        <p>{article.summary}</p>
        <div className="th-card-foot">
          <span>{article.sections.length} parts · {article.sourceIds.length} sources</span>
          <span>Read the article <ArrowUpRight size={15} aria-hidden="true" /></span>
        </div>
      </div>
      <div className="th-card-parts">
        <span className="th-small-label">What is in it</span>
        <ol>{article.sections.map((section) => <li key={section.id}><strong>{section.kicker}</strong>{section.title}</li>)}</ol>
      </div>
    </Link>
  </li>;
}

export default function TheologyPage() {
  useEffect(() => {
    document.title = "Theology · Study · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  const figures = sectionFigures(ARTICLES);
  return <div className="theology-section"><div className="th-container">
    <header className="th-hero">
      <div className="th-hero-copy">
        <StudyBackLink />
        <p className="eyebrow">Theology</p>
        <h1>The faith,<br /><em>thought through.</em></h1>
        <p className="th-lead">Long-form articles on Christian doctrine: what the church actually confesses, where the words came from, and — just as carefully — what the explanations cannot do. Every quotation is from a named edition, and every analogy comes with the limit its own author set on it.</p>
        <nav className="th-jumps" aria-label="On this page">
          <a href="#theology-articles">The articles <ArrowDown size={12} aria-hidden="true" /></a>
          <a href="#theology-method">How these are written <ArrowDown size={12} aria-hidden="true" /></a>
          <a href="#theology-sources">The sources <ArrowDown size={12} aria-hidden="true" /></a>
        </nav>
      </div>
      <TheologyArt />
    </header>

    <Figures items={[
      [figures.articles, figures.articles === 1 ? "Article" : "Articles"],
      [figures.parts, "Parts, each read on its own"],
      [figures.scripture, "Passages quoted in full"],
      [figures.sources, "Sources, each with its edition"],
    ]} />

    <section className="th-section" id="theology-articles" aria-labelledby="th-articles-title">
      <div className="th-heading">
        <span className="eyebrow">01 / What is here</span>
        <h2 id="th-articles-title">One doctrine at a time.<br /><em>Taken slowly.</em></h2>
        <p>Each article sets out a question, answers it from Scripture and the primary sources, and says plainly where the answer stops. They are long on purpose: these are subjects that go wrong when they are made short.</p>
      </div>
      <ul className="th-cards" aria-label="Articles in this section">
        {ARTICLES.map((article) => <ArticleCard key={article.id} article={article} />)}
      </ul>
    </section>

    <section className="th-section" id="theology-method" aria-labelledby="th-method-title">
      <div className="th-heading">
        <span className="eyebrow">02 / How these are written</span>
        <h2 id="th-method-title">Four rules,<em> kept throughout.</em></h2>
      </div>
      <div className="th-terms th-method">
        <span className="th-small-label">What you can expect of every article here</span>
        <dl>
          <div>
            <dt>Primary sources, quoted and located</dt>
            <dd>When Augustine or Aquinas or a council is quoted, the words are theirs, the translation is named, and the reference is exact enough to look up. Nothing is paraphrased and then put in quotation marks.</dd>
          </div>
          <div>
            <dt>Scripture in modern English</dt>
            <dd>All Bible quotations are the Berean Standard Bible, given to the public domain in 2023, and each one links to the same wording in this site’s reader.</dd>
          </div>
          <div>
            <dt>Every analogy with its limit attached</dt>
            <dd>An illustration is allowed to make one point. Wherever an article offers one, it also says, in the same place, what the picture cannot carry — usually in the words of the person who drew it.</dd>
          </div>
          <div>
            <dt>Work still in copyright is described, not reproduced</dt>
            <dd>Where a modern author’s argument matters, it is summarised in our own words and labelled as ours, with the book and chapter to read it in. The quotations on this site are from editions that are free for anyone to copy.</dd>
          </div>
        </dl>
      </div>
    </section>

    <footer className="th-sources" id="theology-sources">
      <div>
        <span className="eyebrow">Read it yourself</span>
        <h2>Named editions.<br /><em>Nothing taken on trust.</em></h2>
        <p>Every source quoted anywhere in this section, with its translator, its edition and its licence. Where this site holds the text, the link opens our copy; otherwise it opens the edition the words were read in.</p>
      </div>
      <div>
        <h3>Where these words come from</h3>
        <SourceList ids={SOURCES.map((source) => source.id)} />
        <details>
          <summary>A note on quotation and copyright</summary>
          <p>The ancient and medieval sources here are in the public domain, as are the nineteenth-century translations they are read in — chiefly the Nicene and Post-Nicene Fathers and the Dominican Fathers’ Summa. Work that is still in copyright is never reproduced on this site: it is described in our own words, marked as our summary, and cited so that you can read the original for yourself.</p>
        </details>
      </div>
    </footer>
  </div></div>;
}
