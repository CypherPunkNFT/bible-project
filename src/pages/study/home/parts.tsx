// The Home and household study's shared pieces: a section that keeps its own failure, the source links under a claim with what was
// read of each, the three parts of a record, verse links, the mark for each kind of evidence, and a picture with its credit.
import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BibleName, VerseAt } from "@/components/Verse";
import { ext, pictureById, readerHref, readingTag, sourceById, verseByLabel, type Kind } from "./model";

export class HhSection extends Component<{ id: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Home and household page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="hh-sec">{this.state.failed ? <p className="hh-failed">This section could not be drawn.</p> : children}</section>;
  }
}

export function Head({ num, kicker, title, lead }: { num: string; kicker: string; title: ReactNode; lead: ReactNode }) {
  return <header className="hh-head"><p className="hh-kicker"><b>{num}</b> · {kicker}</p><h2>{title}</h2><p>{lead}</p></header>;
}

export function SourceLink({ id }: { id: string }) {
  const source = sourceById.get(id);
  if (!source) { console.error(`Home and household page: source "${id}" is not in the research record`); return null; }
  if (id === "scripture") return <span>The Berean Standard Bible</span>;
  return <span><a href={source.url} {...ext}>{source.title}<span aria-hidden="true"> ↗</span></a> <small>({readingTag(source.status)})</small></span>;
}

export function Cite({ ids }: { ids: string[] }) {
  return <div className="hh-cite">{ids.map((id) => <SourceLink key={id} id={id} />)}</div>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: { evidence: ReactNode; inference: ReactNode; limit: ReactNode }) {
  return <dl className="hh-three">
    <div><dt>What the evidence says</dt><dd>{evidence}</dd></div>
    <div><dt>What this study infers</dt><dd>{inference}</dd></div>
    <div><dt>Where the evidence stops</dt><dd>{limit}</dd></div>
  </dl>;
}

export function VerseLink({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`Home and household page: verse "${label}" is not in the generated data`); return null; }
  return <Link to={readerHref(verse.code, verse.chapter, verse.verse)}>{label}</Link>;
}

export function ReadVerses({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return <p className="hh-readverse">Read in the Berean: {labels.map((label) => <VerseLink key={label} label={label} />)}</p>;
}

export function Quote({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`Home and household page: verse "${label}" is not in the generated data`); return null; }
  return <blockquote className="hh-verse"><p><VerseAt verse={verse} /></p><cite><VerseLink label={label} />, <BibleName /></cite></blockquote>;
}

/** Each kind of evidence has its own stroke and its own word, so it never rests on colour. */
export function KindMark({ kind }: { kind: Kind }) {
  return <svg className={`hh-mark hh-${kind}`} viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="6.5" /></svg>;
}

export function Picture({ id, lazy = true }: { id: string; lazy?: boolean }) {
  const [broken, setBroken] = useState(false);
  const picture = pictureById.get(id);
  if (!picture) { console.error(`Home and household page: picture "${id}" is not in the research record`); return null; }
  return <figure className="hh-pic">
    {!broken && <img src={picture.src} width={picture.width} height={picture.height} alt={picture.alt} loading={lazy ? "lazy" : undefined}
      onError={() => { console.error(`Home and household page: the picture ${picture.src} did not load`); setBroken(true); }} />}
    {broken && <p className="hh-pic-missing">{picture.alt} <span>The picture could not be loaded.</span></p>}
    <figcaption>{picture.credit}. <a href={picture.licenceUrl} {...ext}>{picture.licence}</a> · <a href={picture.href} {...ext}>Source page ↗</a></figcaption>
  </figure>;
}
