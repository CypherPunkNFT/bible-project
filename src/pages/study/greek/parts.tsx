// The Greek study's shared pieces: a section with its number in the margin that keeps its own failure, Greek marked as Greek, the source
// links with what was read of each, the three parts of a record, verse links, a quotation with its source, and the reader's test.
import { Component, useId, useState, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BibleName, VerseAt } from "@/components/Verse";
import { ext, readerHref, readingTag, sourceById, verseByLabel, type Parts, type Quoted, type TestOption } from "./model";

export class NgSection extends Component<{ id: string; num?: string; kicker?: string; resetKey?: string; onDismiss?: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`How New Testament Greek works page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, num, kicker, children, onDismiss } = this.props;
    const body = this.state.failed
      ? <p className="ng-failed">This section could not be drawn.{onDismiss && <button type="button" onClick={onDismiss}>Close</button>}</p>
      : children;
    if (!num) return <section id={id} className="ng-open">{body}</section>;
    return <section id={id} className="ng-sec">
      <p className="ng-margin"><b>{num}</b><span>{kicker}</span></p>
      <div className="ng-body">{body}</div>
    </section>;
  }
}

export function Gk({ children, big }: { children: ReactNode; big?: boolean }) {
  return <span lang="grc" className={big ? "ng-gk ng-gk-big" : "ng-gk"}>{children}</span>;
}

const GREEK_RUN = /([Ͱ-Ͽἀ-῿]+(?:\s+[Ͱ-Ͽἀ-῿]+)*)/u;

/** The record's sentences hold Greek words inline; this marks each run as Greek. */
export function Mixed({ text }: { text: string }) {
  const parts = text.split(GREEK_RUN);
  return <>{parts.map((part, i) => (i % 2 ? <Gk key={i}>{part}</Gk> : part))}</>;
}

export function Head({ title, lead }: { title: ReactNode; lead: ReactNode }) {
  return <header className="ng-head"><h2>{title}</h2><p>{lead}</p></header>;
}

export function Cite({ ids }: { ids: string[] }) {
  return <div className="ng-cite">{ids.map((id) => {
    const source = sourceById.get(id);
    if (!source) { console.error(`How New Testament Greek works page: source "${id}" is not in the research record`); return null; }
    return <span key={id}><a href={source.url} {...ext}>{source.title}<span aria-hidden="true"> ↗</span></a> <small>({readingTag(source.status)})</small></span>;
  })}</div>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: Parts) {
  return <dl className="ng-three">
    <div><dt>What the evidence says</dt><dd><Mixed text={evidence} /></dd></div>
    <div><dt>What this study infers</dt><dd><Mixed text={inference} /></dd></div>
    <div><dt>Where the evidence stops</dt><dd><Mixed text={limit} /></dd></div>
  </dl>;
}

export function VerseLink({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`How New Testament Greek works page: verse "${label}" is not in the generated data`); return null; }
  return <Link to={readerHref(verse.code, verse.chapter, verse.verse)}>{label}</Link>;
}

export function Quote({ label }: { label: string }) {
  const verse = verseByLabel.get(label);
  if (!verse) { console.error(`How New Testament Greek works page: verse "${label}" is not in the generated data`); return null; }
  return <blockquote className="ng-verse"><p><VerseAt verse={verse} /></p><cite><VerseLink label={label} />, <BibleName /></cite></blockquote>;
}

/** A scholar's own words, with who said them and any caution the page owes the reader. */
export function Said({ quote }: { quote: Quoted }) {
  return <blockquote className="ng-said"><p>“{quote.text}”</p><cite>{quote.by}</cite>{quote.note && <small>{quote.note}</small>}</blockquote>;
}

/** The reader's own test: one choice, and an answer in words that says why, so nothing rests on colour. */
export function Test({ kicker, question, options }: { kicker: string; question: ReactNode; options: TestOption[] }) {
  const [picked, setPicked] = useState<number | null>(null);
  const name = useId();
  const answer = picked === null ? null : options[picked];
  return <fieldset className="ng-test">
    <legend><span className="ng-kicker">{kicker}</span><span className="ng-test-q">{question}</span></legend>
    {options.map((option, i) => <label key={option.text} className={picked === i ? "chosen" : ""}>
      <input type="radio" name={name} checked={picked === i} onChange={() => setPicked(i)} /><span><Mixed text={option.text} /></span>
    </label>)}
    <p className="ng-answer" aria-live="polite">{answer && <><b>{answer.right ? "Supported." : "Not supported."}</b> <Mixed text={answer.why} /></>}</p>
  </fieldset>;
}
