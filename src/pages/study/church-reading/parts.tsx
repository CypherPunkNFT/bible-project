// The church reading study's shared pieces: a section that keeps its own failure, the source links under a claim with what was read of
// each, the three parts of a record, verse links, and a picture with its credit and its keeper's record.
import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BibleName, VerseAt } from "@/components/Verse";
import { ext, pictureById, readerHref, readingTag, sourceById, verseByLabel } from "./model";

export class HcBoundary extends Component<{ name: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`The church reading page: the "${this.props.name}" part failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <p className="hc-failed">This part could not be drawn.</p> : this.props.children;
  }
}

export function HcSection({ id, resetKey, children }: { id: string; resetKey?: string; children: ReactNode }) {
  return <section id={id} className="hc-sec"><HcBoundary name={id} resetKey={resetKey}>{children}</HcBoundary></section>;
}

export function Head({ num, kicker, title, lead }: { num: string; kicker: string; title: ReactNode; lead: ReactNode }) {
  return <header className="hc-head"><p className="hc-kicker"><b>{num}</b> · {kicker}</p><h2>{title}</h2><p>{lead}</p></header>;
}

export function SourceLink({ id }: { id: string }) {
  const source = sourceById.get(id);
  if (!source) { console.error(`The church reading page: source "${id}" is not in the research record`); return null; }
  if (id === "scripture") return <span>The Berean Standard Bible</span>;
  const title = source.url.startsWith("/") ? <Link to={source.url}>{source.title}</Link> : <a href={source.url} {...ext}>{source.title}<span aria-hidden="true"> ↗</span></a>;
  return <span>{title} <small>({readingTag(source.status)})</small></span>;
}

export function Cite({ ids }: { ids: string[] }) {
  return <div className="hc-cite">{ids.map((id) => <SourceLink key={id} id={id} />)}</div>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: { evidence: ReactNode; inference: ReactNode; limit: ReactNode }) {
  return <dl className="hc-three">
    <div><dt>What the evidence says</dt><dd>{evidence}</dd></div>
    <div><dt>What this study infers</dt><dd>{inference}</dd></div>
    <div><dt>Where the evidence stops</dt><dd>{limit}</dd></div>
  </dl>;
}

export function VerseLink({ label, children }: { label: string; children?: ReactNode }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`The church reading page: verse "${label}" is not in the generated data`); return null; }
  return <Link to={readerHref(verse.code, verse.chapter, verse.verse)}>{children ?? label}</Link>;
}

export function Quote({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`The church reading page: verse "${label}" is not in the generated data`); return null; }
  return <blockquote className="hc-verse"><p><VerseAt verse={verse} /></p><cite><VerseLink label={label} />, <BibleName /></cite></blockquote>;
}

export function Picture({ id, lazy = true }: { id: string; lazy?: boolean }) {
  const [broken, setBroken] = useState(false);
  const picture = pictureById.get(id);
  if (!picture) { console.error(`The church reading page: picture "${id}" is not in the research record`); return null; }
  return <figure className="hc-pic">
    {!broken && <img src={picture.src} width={picture.width} height={picture.height} alt={picture.alt} loading={lazy ? "lazy" : undefined}
      onError={() => { console.error(`The church reading page: the picture ${picture.src} did not load`); setBroken(true); }} />}
    {broken && <p className="hc-pic-missing">{picture.alt} <span>The picture could not be loaded.</span></p>}
    <figcaption>{picture.credit}. <a href={picture.licenceUrl} {...ext}>{picture.licence}</a> · <a href={picture.href} {...ext}>Source page ↗</a>
      {picture.record && <> · <a href={picture.record.href} {...ext}>{picture.record.label} ↗</a></>}</figcaption>
  </figure>;
}
