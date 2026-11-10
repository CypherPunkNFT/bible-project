// The farming year study's shared pieces: a section that keeps its own failure, the source links under a claim with what was read of
// each, the three parts of a record, verse links, Hebrew set right to left inside English, the marks for the four kinds of evidence,
// and a picture with its credit.
import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BibleName, VerseAt } from "@/components/Verse";
import { ext, kindById, pictureById, readerHref, readingTag, sourceById, verseByLabel, type Kind } from "./model";

export class FySection extends Component<{ id: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`The farming year page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="fy-sec">{this.state.failed ? <p className="fy-failed">This section could not be drawn.</p> : children}</section>;
  }
}

export function Head({ num, kicker, title, lead }: { num: string; kicker: string; title: ReactNode; lead: ReactNode }) {
  return <header className="fy-head"><p className="fy-kicker"><b>{num}</b> · {kicker}</p><h2>{title}</h2><p>{lead}</p></header>;
}

export function He({ children }: { children: string }) {
  return <span className="fy-he" lang="he" dir="rtl">{children}</span>;
}

export function SourceLink({ id }: { id: string }) {
  const source = sourceById.get(id);
  if (!source) { console.error(`The farming year page: source "${id}" is not in the research record`); return null; }
  if (id === "scripture") return <span>The Berean Standard Bible</span>;
  return <span><a href={source.url} {...ext}>{source.title}<span aria-hidden="true"> ↗</span></a> <small>({readingTag(source.status)})</small></span>;
}

export function Cite({ ids }: { ids: string[] }) {
  return <div className="fy-cite">{ids.map((id) => <SourceLink key={id} id={id} />)}</div>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: { evidence: ReactNode; inference: ReactNode; limit: ReactNode }) {
  return <dl className="fy-three">
    <div><dt>What the evidence says</dt><dd>{evidence}</dd></div>
    <div><dt>What this study infers</dt><dd>{inference}</dd></div>
    <div><dt>Where the evidence stops</dt><dd>{limit}</dd></div>
  </dl>;
}

export function VerseLink({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`The farming year page: verse "${label}" is not in the generated data`); return null; }
  return <Link to={readerHref(verse.code, verse.chapter, verse.verse)}>{label}</Link>;
}

export function ReadVerses({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return <p className="fy-readverse">Read in the Berean: {labels.map((label) => <VerseLink key={label} label={label} />)}</p>;
}

export function Quote({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`The farming year page: verse "${label}" is not in the generated data`); return null; }
  return <blockquote className="fy-verse"><p><VerseAt verse={verse} /></p><cite><VerseLink label={label} />, <BibleName /></cite></blockquote>;
}

/** Each kind of evidence has its own small shape and its own word, so it never rests on colour. */
const KIND_SHAPES: Record<Kind, ReactNode> = {
  stone: <><path d="M5 2.5h8.5l1 2.5v10.5h-10z" /><path d="M7 6h5M7 9h5M7 12h3" /></>,
  scripture: <><path d="M9 5C7 3.6 4.6 3.4 2.5 4v10.5c2.1-.6 4.5-.4 6.5 1 2-1.4 4.4-1.6 6.5-1V4C13.4 3.4 11 3.6 9 5z" /><path d="M9 5v10.5" /></>,
  ground: <><path d="M2 6.5h14M2 10.5h14M2 14.5h14" /><path d="M9 2v6.5M6.7 6.2 9 8.5l2.3-2.3" /></>,
  later: <><path d="M2.5 6h3l1.3-2h4.4L12.5 6h3v9h-13z" /><circle cx="9" cy="10.3" r="2.7" /></>,
};

export function KindMark({ kind }: { kind: Kind }) {
  return <svg className="fy-mark" viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{KIND_SHAPES[kind]}</svg>;
}

export function KindWord({ kind }: { kind: Kind }) {
  return <span className="fy-kindword"><KindMark kind={kind} /> {kindById.get(kind)?.word ?? kind}</span>;
}

export function Picture({ id, lazy = true, matte = false }: { id: string; lazy?: boolean; matte?: boolean }) {
  const [broken, setBroken] = useState(false);
  const picture = pictureById.get(id);
  if (!picture) { console.error(`The farming year page: picture "${id}" is not in the research record`); return null; }
  return <figure className={`fy-pic${matte ? " fy-matte" : ""}`}>
    {!broken && <img src={picture.src} width={picture.width} height={picture.height} alt={picture.alt} loading={lazy ? "lazy" : undefined}
      onError={() => { console.error(`The farming year page: the picture ${picture.src} did not load`); setBroken(true); }} />}
    {broken && <p className="fy-pic-missing">{picture.alt} <span>The picture could not be loaded.</span></p>}
    <figcaption>{picture.credit}. <a href={picture.licenceUrl} {...ext}>{picture.licence}</a> · <a href={picture.href} {...ext}>Source page ↗</a></figcaption>
  </figure>;
}
