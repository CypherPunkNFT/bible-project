// The shared pieces of How the Old Testament books were written: a section that keeps its own failure, the two-beat
// headline, research text with its check notes and its references made into buttons, the three parts of a record, the
// three layers' tags, a quoted verse and the site's own word.
import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { useOpenSheet } from "./context";
import { findReferences, NEIGHBOURS, REFS } from "./model";

export class ObSection extends Component<{ id: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`How the Old Testament books were written: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="ob-sec">{this.state.failed ? <p className="ob-failed">This section could not be drawn.</p> : children}</section>;
  }
}

/** "Moses wrote. Someone wrote his death." → the first beat in ink, the turn in gold italic. */
export function TwoBeats({ text }: { text: string }) {
  const words = plainText(text), cut = words.indexOf(". ");
  if (cut < 0) return <>{words}</>;
  return <>{words.slice(0, cut + 1)} <em>{words.slice(cut + 2)}</em></>;
}

export function Head({ num, kicker, headline, children }: { num: string; kicker: string; headline: string; children?: ReactNode }) {
  return <header className="ob-head">
    <p className="ob-kicker"><b>{num}</b> · {kicker}</p>
    <h2><TwoBeats text={headline} /></h2>
    {children}
  </header>;
}

const LAYERS = { book: ["I", "The book speaks"], readers: ["II", "Later readers remember"], theory: ["III", "A modern reconstruction"] } as const;

/** Which of the three layers a block belongs to. The order is always the book, then its readers, then the theories. */
export function Layer({ of }: { of: keyof typeof LAYERS }) {
  const [n, words] = LAYERS[of];
  return <p className={`ob-layer ob-layer-${of}`}><span aria-hidden="true">{n}</span>{words}</p>;
}

export function RefButton({ refKey, children }: { refKey: string; children: ReactNode }) {
  const open = useOpenSheet();
  if (!REFS.has(refKey)) return <>{children}</>;
  return <button type="button" className="ob-ref" data-opener={`v:${refKey}`} aria-haspopup="dialog" onClick={() => open(`v:${refKey}`)}>{children}</button>;
}

const NEIGHBOUR_NAMES = [...NEIGHBOURS.keys()];

/** Plain words with their references as buttons and the neighbouring studies that exist as links. */
function Linked({ words, book }: { words: string; book?: string }) {
  const pieces: ReactNode[] = [];
  let last = 0;
  for (const found of findReferences(words, book)) {
    if (!REFS.has(found.key)) continue;
    pieces.push(<Neighbours key={`t${last}`} words={words.slice(last, found.start)} />);
    pieces.push(<RefButton key={`r${found.start}`} refKey={found.key}>{words.slice(found.start, found.end)}</RefButton>);
    last = found.end;
  }
  pieces.push(<Neighbours key={`t${last}`} words={words.slice(last)} />);
  return <>{pieces}</>;
}

function Neighbours({ words }: { words: string }) {
  const name = NEIGHBOUR_NAMES.find((n) => words.includes(n));
  if (!name) return <>{words}</>;
  const at = words.indexOf(name);
  return <>{words.slice(0, at)}<Link className="ob-link" to={NEIGHBOURS.get(name)!}>{name}</Link><Neighbours words={words.slice(at + name.length)} /></>;
}

/** Every research string goes through here: its settled words open their check notes, its references open their verses. */
export function Txt({ text, book }: { text: string; book?: string }) {
  return <Checked text={text} render={(words) => <Linked words={words} book={book} />} />;
}

export function Para({ text, book, className = "ob-para" }: { text: string; book?: string; className?: string }) {
  return <p className={className}><Txt text={text} book={book} /></p>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit, labels = ["What the evidence says", "What this study infers", "Where the evidence stops"], book }:
  { evidence: string; inference: string; limit: string; labels?: [string, string, string]; book?: string }) {
  return <dl className="ob-three">
    {[evidence, inference, limit].map((text, i) => <div key={labels[i]}><dt>{labels[i]}</dt><dd><Txt text={text} book={book} /></dd></div>)}
  </dl>;
}

/** A verse in the Berean's own words, from the generated data, with its reference opening the sheet. */
export function VerseQuote({ refKey }: { refKey: string }) {
  const ref = REFS.get(refKey);
  if (!ref) { console.error(`How the Old Testament books were written: verse "${refKey}" is not in the generated data`); return null; }
  return <blockquote className="ob-verse">
    <p>{ref.lines.map(([, verse, text], i) => <Fragment key={verse}>{i > 0 && " "}{text}</Fragment>)}</p>
    <cite><RefButton refKey={refKey}>{refKey}</RefButton> · Berean Standard Bible</cite>
  </blockquote>;
}

/** The site's own word, marked as the site's. */
export function Stand({ text, label = "What this site holds", book }: { text: string; label?: string; book?: string }) {
  return <aside className="ob-stand"><p className="ob-kicker">{label}</p><Para text={text} book={book} /></aside>;
}

/** Views among scholars, as floating words joined by a rule: name, who holds it, the reading. Not ranked. */
export function Views({ views, book, note }: { views: { id: string; name: string; held: string; reading: string; limit?: string }[]; book?: string; note: string }) {
  return <div className="ob-views">
    <p className="ob-kicker">{note}</p>
    <ol>{views.map((view) => <li key={view.id}>
      <h3><Txt text={view.name} /></h3>
      <p className="ob-held"><span>Held by</span> <Txt text={view.held} book={book} /></p>
      <Para text={view.reading} book={book} />
      {view.limit && <p className="ob-limit"><span>Where it stops</span> <Txt text={view.limit} book={book} /></p>}
    </li>)}</ol>
  </div>;
}

export const MarkShape = ({ kind, size = 14 }: { kind: "self" | "later" | "divide"; size?: number }) => <svg className={`ob-shape ob-shape-${kind}`} width={size} height={size} viewBox="-8 -8 16 16" aria-hidden="true">
  {kind === "self" && <path d="M0-6.5 6.5 0 0 6.5-6.5 0Z" />}
  {kind === "later" && <circle r="5" />}
  {kind === "divide" && <path d="M0-7V7" strokeDasharray="2.4 2" />}
</svg>;
