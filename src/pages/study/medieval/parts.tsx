// The medieval church's shared pieces: a section that keeps its own failure, the source links under a claim with what was read of each,
// the three parts of a record, verse links, the marks that stand for a field or a way, the site's own word, and a picture with its credit.
import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BibleName, VerseAt } from "@/components/Verse";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { ext, pictureById, pictureShown, readerHref, readingTag, sourceById, verseByLabel, type Field, type Stand, type Way } from "./model";

/** A research string as reading text: a settled passage is highlighted and opens its editor's note (brief section 4). Never inside a control or a drawing: those take plainText. */
export const T = ({ text }: { text: string }) => <Checked text={text} />;

export class MvSection extends Component<{ id: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`The medieval church page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="mv-sec">{this.state.failed ? <p className="mv-failed">This section could not be drawn.</p> : children}</section>;
  }
}

export function Head({ num, kicker, title, lead }: { num: string; kicker: string; title: ReactNode; lead: ReactNode }) {
  return <header className="mv-head"><p className="mv-kicker"><b>{num}</b> · {kicker}</p><h2>{title}</h2><p>{lead}</p></header>;
}

export function SourceLink({ id }: { id: string }) {
  const source = sourceById.get(id);
  if (!source) { console.error(`The medieval church page: source "${id}" is not in the research record`); return null; }
  return <span><a href={source.url} {...ext}>{source.title}<span aria-hidden="true"> ↗</span></a> <small>({readingTag(source.status)})</small></span>;
}

export function Cite({ ids }: { ids: string[] }) {
  return <div className="mv-cite">{ids.map((id) => <SourceLink key={id} id={id} />)}</div>;
}

const read = (part: ReactNode) => (typeof part === "string" ? <T text={part} /> : part);

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). Strings read through <Checked>. */
export function ThreeParts({ evidence, inference, limit }: { evidence: ReactNode; inference: ReactNode; limit: ReactNode }) {
  return <dl className="mv-three">
    <div><dt>What the evidence says</dt><dd>{read(evidence)}</dd></div>
    <div><dt>What this study infers</dt><dd>{read(inference)}</dd></div>
    <div><dt>Where the evidence stops</dt><dd>{read(limit)}</dd></div>
  </dl>;
}

export function VerseLink({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`The medieval church page: verse "${label}" is not in the generated data`); return null; }
  return <Link to={readerHref(verse.code, verse.chapter, verse.verse)}>{label}</Link>;
}

export function Quote({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`The medieval church page: verse "${label}" is not in the generated data`); return null; }
  return <blockquote className="mv-verse"><p><VerseAt verse={verse} /></p><cite><VerseLink label={label} />, <BibleName /></cite></blockquote>;
}

/** A historic document's own words, always named as its translator's or writer's, never set as if they were Scripture. */
export function OldText({ who, children }: { who: ReactNode; children: ReactNode }) {
  return <blockquote className="mv-oldtext"><p>{children}</p><cite>{who}</cite></blockquote>;
}

/** The site's own word, marked as the site's, with the Scripture it rests on. */
export function StandPanel({ stand, labels }: { stand: Stand; labels: string[] }) {
  return <aside className="mv-stand">
    <div><p className="mv-kicker">{stand.head}</p><p className="mv-para"><T text={stand.text} /></p></div>
    <div>{labels.map((label) => <Quote key={label} label={label} />)}</div>
  </aside>;
}

const FIELD_SHAPES = {
  circle: <circle r="10.5" />,
  diamond: <path d="M0-13 13 0 0 13-13 0Z" />,
  square: <rect x="-10" y="-10" width="20" height="20" />,
  triangle: <path d="M0-13 12.5 9H-12.5Z" />,
};

/** A field's shape inside a drawing: the shape and the field's name carry it, not the colour. */
export const FieldShape = ({ field }: { field: Field }) => FIELD_SHAPES[field.shape];

export function FieldMark({ field }: { field: Field }) {
  return <svg className="mv-mark" viewBox="-15 -15 30 30" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><FieldShape field={field} /></svg>;
}

const WAY_PATHS = {
  book: "M-9-5.500C-6-7.500-3-7.500 0-5.500 3-7.500 6-7.500 9-5.500V6C6 4 3 4 0 6-3 4-6 4-9 6ZM0-5.500V6",
  crown: "M-9 6.500V-5.500L-4.500-.5 0-7.500 4.500-.5 9-5.500V6.500Z",
  scroll: "M-8-7.500H5C7-7.500 8-6 8-4.500V7.500H-5C-7 7.500-8 6-8 4.500ZM-4-3H4M-4 1H4",
  blade: "M-7.500-7.500 7.500 7.500M7.500-7.500-7.500 7.500",
};

/** How a way of conversion is drawn, a separate set from the fields' shapes. Force is an X, never a cross, which on this page would read as something else. */
export const WayPath = ({ way }: { way: Way }) => <path d={WAY_PATHS[way.shape]} />;

export function WayMark({ way }: { way: Way }) {
  return <svg className="mv-mark" viewBox="-11 -11 22 22" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><WayPath way={way} /></svg>;
}

export function Picture({ id, lazy = true }: { id: string; lazy?: boolean }) {
  const [broken, setBroken] = useState(false);
  const picture = pictureById.get(id);
  if (!picture) { console.error(`The medieval church page: picture "${id}" is not in the research record`); return null; }
  if (!pictureShown(picture)) return null;
  return <figure className="mv-pic">
    {!broken && <img src={picture.src} width={picture.width} height={picture.height} alt={picture.alt} loading={lazy ? "lazy" : undefined}
      onError={() => { console.error(`The medieval church page: the picture ${picture.src} did not load`); setBroken(true); }} />}
    {broken && <p className="mv-pic-missing">{picture.alt} <span>The picture could not be loaded.</span></p>}
    <figcaption>{picture.credit}. <a href={picture.licenceUrl} {...ext}>{picture.licence}</a> · <a href={picture.href} {...ext}>Source page ↗</a>{picture.record && <> · <a href={picture.record.href} {...ext}>{picture.record.label} ↗</a></>}</figcaption>
  </figure>;
}
