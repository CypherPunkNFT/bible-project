// The How Hebrew works study's shared pieces: a section that keeps its own failure, Hebrew set apart from the English around it, the
// source links with what was read of each, the three parts of a record, verse links, a picture with its credit, and the reader's test.
import { Component, useId, useState, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BibleName, VerseAt } from "@/components/Verse";
import { ext, pictureById, readerHref, readingTag, sourceById, verseByLabel, type TestOption } from "./model";

export class HwSection extends Component<{ id: string; resetKey?: string; onDismiss?: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`How Hebrew works page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children, onDismiss } = this.props;
    return <section id={id} className="hw-sec">{this.state.failed
      ? <p className="hw-failed">This section could not be drawn.{onDismiss && <button type="button" onClick={onDismiss}>Close</button>}</p>
      : children}</section>;
  }
}

/** Hebrew in running English: its own language, direction and face, isolated so it cannot reorder the words around it. */
export function He({ children, big }: { children: ReactNode; big?: boolean }) {
  return <bdi lang="he" dir="rtl" className={big ? "hw-he hw-he-big" : "hw-he"}>{children}</bdi>;
}

const HEBREW_BLOCK = `${String.fromCodePoint(0x590)}-${String.fromCodePoint(0x5ff)}${String.fromCodePoint(0x25cc)}`;
const HEBREW_RUN = new RegExp(`([${HEBREW_BLOCK}]+(?:\\s+[${HEBREW_BLOCK}]+)*)`, "u");

/** The record's sentences hold Hebrew words inline; this sets each run apart. */
export function Mixed({ text }: { text: string }) {
  const parts = text.split(HEBREW_RUN);
  return <>{parts.map((part, i) => (i % 2 ? <He key={i}>{part}</He> : part))}</>;
}

/** Each section is numbered by a letter and its digit, because the alphabet is what the page teaches. */
export function Head({ letter, num, kicker, title, lead }: { letter: string; num: string; kicker: string; title: ReactNode; lead: ReactNode }) {
  return <header className="hw-head">
    <p className="hw-kicker"><b><He>{letter}</He> {num}</b> · {kicker}</p>
    <h2>{title}</h2><p>{lead}</p>
  </header>;
}

export function Cite({ ids }: { ids: string[] }) {
  return <div className="hw-cite">{ids.map((id) => {
    const source = sourceById.get(id);
    if (!source) { console.error(`How Hebrew works page: source "${id}" is not in the research record`); return null; }
    return <span key={id}><a href={source.url} {...ext}>{source.title}<span aria-hidden="true"> ↗</span></a> <small>({readingTag(source.status)})</small></span>;
  })}</div>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: { evidence: string; inference: string; limit: string }) {
  return <dl className="hw-three">
    <div><dt>What the evidence says</dt><dd><Mixed text={evidence} /></dd></div>
    <div><dt>What this study infers</dt><dd><Mixed text={inference} /></dd></div>
    <div><dt>Where the evidence stops</dt><dd><Mixed text={limit} /></dd></div>
  </dl>;
}

export function VerseLink({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`How Hebrew works page: verse "${label}" is not in the generated data`); return null; }
  return <Link to={readerHref(verse.code, verse.chapter, verse.verse)}>{label}</Link>;
}

export function Quote({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`How Hebrew works page: verse "${label}" is not in the generated data`); return null; }
  return <blockquote className="hw-verse"><p><VerseAt verse={verse} /></p><cite><VerseLink label={label} />, <BibleName /></cite></blockquote>;
}

export function Figure({ id }: { id: string }) {
  const [broken, setBroken] = useState(false);
  const picture = pictureById.get(id);
  if (!picture) { console.error(`How Hebrew works page: picture "${id}" is not in the research record`); return null; }
  return <figure className="hw-pic">
    {broken ? <p className="hw-pic-missing">{picture.alt} The picture could not be loaded.</p>
      : <img src={picture.src} width={picture.width} height={picture.height} alt={picture.alt} loading="lazy"
        onError={() => { console.error(`How Hebrew works page: the picture ${picture.src} did not load`); setBroken(true); }} />}
    <figcaption>{picture.caption} <small>{picture.credit}. {picture.licence}. <a href={picture.href} {...ext}>Source page ↗</a></small></figcaption>
  </figure>;
}

/** The reader's own test: one choice, and an answer in words that says why, so nothing rests on colour. */
export function Test({ kicker, question, options, right = "Supported.", wrong = "Not supported.", children }: {
  kicker: string; question: ReactNode; options: TestOption[]; right?: string; wrong?: string; children?: ReactNode;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const name = useId();
  const answer = picked === null ? null : options[picked];
  return <fieldset className="hw-test">
    <legend><span className="hw-kicker">{kicker}</span><span className="hw-test-q">{question}</span></legend>
    {options.map((option, i) => <label key={option.text} className={picked === i ? "chosen" : ""}>
      <input type="radio" name={name} checked={picked === i} onChange={() => setPicked(i)} /><span>{option.text}</span>
    </label>)}
    <p className="hw-answer" aria-live="polite">{answer && <><b>{answer.right ? right : wrong}</b> <Mixed text={answer.why} /></>}</p>
    {answer?.right && children}
  </fieldset>;
}
