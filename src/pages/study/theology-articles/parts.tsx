// The pieces an article is drawn from. Each block kind in model.ts gets one component here, and
// nothing in this file holds prose: the words all come from the article modules, so an editor can
// change them without opening React and theology.test.ts can check them without rendering anything.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, TriangleAlert } from "lucide-react";
import { findSource, readerHref, type ArticleSection, type Body, type Source } from "./model";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Where to send a reader for a source: this site's own copy if we hold one, otherwise the edition. */
function SourceLink({ source, children }: { source: Source; children: ReactNode }) {
  if (source.onSite) return <Link className="th-src-link" to={source.onSite}>{children}</Link>;
  return <a className="th-src-link" href={source.url} {...ext}>{children}<ArrowUpRight size={13} aria-hidden="true" /></a>;
}

function Scripture({ block }: { block: Extract<Body, { kind: "scripture" }> }) {
  return <figure className="th-scripture">
    <blockquote><p>{block.text}</p></blockquote>
    <figcaption>
      <Link to={readerHref(block.book, block.chapter, block.verses)}>
        <BookOpen size={13} aria-hidden="true" />{block.reference}
        <span className="th-version">Berean Standard Bible</span>
      </Link>
      {block.note && <span className="th-note">{block.note}</span>}
    </figcaption>
  </figure>;
}

function Quotation({ block }: { block: Extract<Body, { kind: "quote" }> }) {
  const source = findSource(block.source);
  if (!source) { console.error(`Theology article: no source "${block.source}" in model.ts SOURCES`); return null; }
  return <figure className="th-quote">
    <blockquote><p>{block.text}</p></blockquote>
    <figcaption>
      {block.speaker && <span className="th-speaker">{block.speaker}</span>}
      <SourceLink source={source}>{source.work}</SourceLink>
      <span className="th-locator">{block.locator}</span>
    </figcaption>
  </figure>;
}

/** A work still in copyright: its argument in our words, labelled as ours, with the place to read it. */
function Summarised({ block }: { block: Extract<Body, { kind: "summary" }> }) {
  const source = findSource(block.source);
  if (!source) { console.error(`Theology article: no source "${block.source}" in model.ts SOURCES`); return null; }
  return <aside className="th-summary">
    <span className="th-small-label">In our words, not his</span>
    <p>{block.text}</p>
    <footer>
      <SourceLink source={source}>{source.work}</SourceLink>
      <span className="th-locator">{block.locator} · {source.licence}</span>
    </footer>
  </aside>;
}

function Terms({ block }: { block: Extract<Body, { kind: "list" }> }) {
  return <div className="th-terms">
    <span className="th-small-label">{block.label}</span>
    <dl>{block.items.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.text}</dd></div>)}</dl>
  </div>;
}

function Caution({ block }: { block: Extract<Body, { kind: "caution" }> }) {
  return <aside className="th-caution">
    <h4><TriangleAlert size={15} aria-hidden="true" />{block.title}</h4>
    <p>{block.text}</p>
  </aside>;
}

/** One block of an article, by kind. */
function Block({ block }: { block: Body }) {
  switch (block.kind) {
    case "p": return <p className="th-p">{block.text}</p>;
    case "h": return <h3 className="th-h">{block.text}</h3>;
    case "scripture": return <Scripture block={block} />;
    case "quote": return <Quotation block={block} />;
    case "summary": return <Summarised block={block} />;
    case "list": return <Terms block={block} />;
    case "caution": return <Caution block={block} />;
  }
}

/** One numbered part of an article. It keeps its own failure: if a block cannot be drawn, the rest of
 *  the article still reads. `key` is set to the article id by the reader, so moving between articles
 *  mounts a fresh boundary instead of inheriting a failed one. */
export class Part extends Component<{ section: ArticleSection; number: number }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Theology article: the "${this.props.section.id}" part failed to draw`, error, info.componentStack);
  }
  render() {
    const { section, number } = this.props;
    const heading = `th-part-${section.id}`;
    return <section className="th-part" id={section.id} aria-labelledby={heading}>
      <div className="th-part-head">
        <span className="eyebrow">{String(number).padStart(2, "0")} / {section.kicker}</span>
        <h2 id={heading}>{section.title}</h2>
        <p className="th-lede">{section.lede}</p>
      </div>
      {this.state.failed
        ? <p className="th-failed">This part of the article could not be drawn. The rest of the page is unaffected.</p>
        : <div className="th-body">{section.body.map((block, i) => <Block key={i} block={block} />)}</div>}
    </section>;
  }
}

/** The figures row the landing and the article both use: counted, never typed by hand. */
export function Figures({ items }: { items: [string | number, string][] }) {
  return <dl className="th-stats">{items.map(([value, label]) => <div key={label}><dd>{value}</dd><dt>{label}</dt></div>)}</dl>;
}

/** The sources footer. `checked` is shown, because "we read this edition" and "we did not reproduce
 *  this at all" are different claims and a reader is entitled to know which one applies. */
export function SourceList({ ids }: { ids: string[] }) {
  const checkedLabel: Record<Source["checked"], string> = {
    corpus: "Quoted from this project’s copy of the edition named",
    edition: "Quoted from the published edition linked",
    none: "In copyright — described and cited, never reproduced",
  };
  return <ul className="th-sources-list">{ids.map((id) => {
    const source = findSource(id);
    if (!source) { console.error(`Theology article: no source "${id}" in model.ts SOURCES`); return null; }
    return <li key={id}>
      <SourceLink source={source}>{source.work}</SourceLink>
      <span className="th-src-meta">{source.author} · {source.edition}</span>
      <span className="th-src-meta">{checkedLabel[source.checked]}</span>
    </li>;
  })}</ul>;
}
