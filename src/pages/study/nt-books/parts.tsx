// How the New Testament books were written: the shared pieces. A section that keeps its own failure, the headline in two
// beats, reading text with its check marks and its references (each reference opens its verses in the sheet), the three
// parts of a record, sources with what was read of each, a verse quoted from the build's Berean, and views with their holders.
import { Component, useContext, type ErrorInfo, type ReactNode } from "react";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { readingTag, sourceById, splitRefs, versesOf, type Holder } from "./model";
import { OpenContext } from "./open-context";

export class NbSection extends Component<{ id: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`How the New Testament books were written: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="nb-sec">{this.state.failed ? <p className="nb-failed">This section could not be drawn.</p> : children}</section>;
  }
}

export function Head({ num, kicker, title, lead }: { num: string; kicker: string; title: ReactNode; lead?: string }) {
  return <header className="nb-head">
    <p className="nb-kicker"><b>{num}</b> · {kicker}</p>
    <h2>{title}</h2>
    {lead && <p><Text text={lead} /></p>}
  </header>;
}

/** A reference the build resolved: it opens its verses in the sheet. Inside a checked passage it keeps its own click and keys. */
export function RefButton({ refKey, children }: { refKey: string; children?: ReactNode }) {
  const open = useContext(OpenContext);
  return <button type="button" className="nb-ref" data-opener={`verse:${refKey}`} aria-haspopup="dialog"
    onClick={(event) => { event.stopPropagation(); open?.openVerse(refKey); }} onKeyDown={(event) => event.stopPropagation()}>
    {children ?? refKey}
  </button>;
}

function Refs({ words, book }: { words: string; book?: string }) {
  return <>{splitRefs(words, book).map((piece, index) => piece.ref
    ? <RefButton key={index} refKey={piece.ref}>{piece.text}</RefButton>
    : <span key={index}>{piece.text}</span>)}</>;
}

/** Every research string goes through here: its check marks open their notes, its references open their verses. */
export function Text({ text, book }: { text: string; book?: string }) {
  return <Checked text={text} render={(words) => <Refs words={words} book={book} />} />;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: { evidence: string; inference: string; limit: string }) {
  return <dl className="nb-three">
    <div><dt>What the evidence says</dt><dd><Text text={evidence} /></dd></div>
    <div><dt>What this study infers</dt><dd><Text text={inference} /></dd></div>
    <div><dt>Where the evidence stops</dt><dd><Text text={limit} /></dd></div>
  </dl>;
}

export function Cite({ ids }: { ids: string[] }) {
  return <ul className="nb-cite">{ids.map((id) => {
    const source = sourceById.get(id);
    if (!source) { console.error(`How the New Testament books were written: source "${id}" is not in the research record`); return null; }
    return <li key={id}><Text text={source.title} /> <small>({readingTag(source.status)})</small></li>;
  })}</ul>;
}

/** A verse or passage quoted from the build's Berean, with the reference that opens it. */
export function Quote({ refKey }: { refKey: string }) {
  const verses = versesOf(refKey);
  if (!verses.length) { console.error(`How the New Testament books were written: "${refKey}" is not in the generated data`); return null; }
  return <blockquote className="nb-verse">
    <p>{verses.map(({ label, verse }, i) => <span key={label}>{i > 0 && " "}{verses.length > 1 && <sup>{verse.verse}</sup>}{verse.text}</span>)}</p>
    <cite><RefButton refKey={refKey} />, Berean Standard Bible</cite>
  </blockquote>;
}

/** Views with who holds them: every one at the same weight, none marked as the page's. */
export function Holders({ views, label = "Who holds it" }: { views: Holder[]; label?: string }) {
  return <ol className="nb-holders">{views.map((view) => <li key={view.who}>
    <p className="nb-holder-who"><Text text={view.who} /></p>
    <p className="nb-holder-held"><span className="nb-sr">{label}: </span><Text text={view.held} /></p>
  </li>)}</ol>;
}

/** The site's own word, marked as the site's. */
export function SiteWord({ head = "What this site holds", text }: { head?: string; text: string }) {
  return <aside className="nb-siteword"><p className="nb-kicker">{head}</p><p><Text text={text} /></p></aside>;
}
