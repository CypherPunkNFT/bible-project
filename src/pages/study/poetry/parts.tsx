// The page's shared pieces: a section that keeps its own failure, the section head, research text with its check notes and
// its Bible references made into buttons, the three parts of a record, source citations, and the Hebrew-beside-Berean
// verse: line beside line where the build divided it, the whole verse beside the whole verse where it did not. The page is
// about the Berean's own lines, so its words come from the Berean's file whatever the reader's language (bible="bsb").
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Verse as BibleVerse } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import { verseIdOf } from "@/lib/verses";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { bereanLines, byKey, firstOf, readingTag, refByKey, sourceById, splitHeadline, type Pair, type Verse } from "./model";
import { useOpen } from "./open";

export class HpnSection extends Component<{ id: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`The Hebrew poetry page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="hpn-sec">{this.state.failed ? <p className="hpn-failed">This section could not be drawn.</p> : children}</section>;
  }
}

/** A numbered section head; the headline comes from the record as "Plain. *Gold turn.*" */
export function Head({ num, kicker, headline, lead }: { num: string; kicker: string; headline: string; lead?: string }) {
  const { title, turn } = splitHeadline(headline);
  return <header className="hpn-head">
    <p className="hpn-kicker"><b>{num}</b> · {kicker}</p>
    <h2>{title} {turn && <em>{turn}</em>}</h2>
    {lead && <p><Prose text={lead} /></p>}
  </header>;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const REF_PATTERN = new RegExp(`(?<![A-Za-z0-9])(${[...refByKey.keys()].sort((a, b) => b.length - a.length).map(escape).join("|")})(?![\\d:])`, "g");

export function RefButton({ label, children }: { label: string; children?: ReactNode }) {
  const open = useOpen();
  if (!refByKey.has(label)) return <>{children ?? label}</>;
  return <button type="button" className="hpn-ref" data-opener={`ref:${label}`} aria-haspopup="dialog" onClick={() => open(`ref:${label}`)}>{children ?? label}</button>;
}

/** Plain words with every Bible reference the build supplied turned into a button that opens its verses. */
function withRefs(words: string): ReactNode {
  const parts = words.split(REF_PATTERN);
  if (parts.length === 1) return words;
  return parts.map((part, index) => (index % 2 === 1 ? <RefButton key={index} label={part} /> : part));
}

/** Research text: check-noted passages highlighted, references opening their verses. */
export const Prose = ({ text }: { text: string }) => <Checked text={text} render={withRefs} />;

export function Refs({ labels, lead = "Read" }: { labels: string[]; lead?: string }) {
  if (!labels.length) return null;
  return <p className="hpn-refs">{lead}: {labels.map((label) => <RefButton key={label} label={label} />)}</p>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: { evidence: string; inference: string; limit: string }) {
  return <dl className="hpn-three">
    <div><dt>What the text shows</dt><dd><Prose text={evidence} /></dd></div>
    <div><dt>What this study infers</dt><dd><Prose text={inference} /></dd></div>
    <div><dt>Where it stops</dt><dd><Prose text={limit} /></dd></div>
  </dl>;
}

/** A source by its author alone, or by author and work (`whole`) where two works by one author may stand together. */
export function SourceButton({ id, whole = false }: { id: string; whole?: boolean }) {
  const open = useOpen();
  const source = sourceById.get(id);
  if (!source) {
    console.error(`The Hebrew poetry page: source "${id}" is not in the research record`);
    return null;
  }
  return <button type="button" className="hpn-source" data-opener={`source:${id}`} aria-haspopup="dialog" onClick={() => open(`source:${id}`)}>
    <Checked text={whole ? source.title.split(" (")[0] : source.title.split(",")[0]} /> <small>({readingTag(source.status)})</small>
  </button>;
}

// ---- Hebrew beside the Berean ----

/** Hebrew words, right to left, with the words at the given verse positions lit. `from` is the position of the first word. */
export function Hebrew({ text, from = 0, lit }: { text: string; from?: number; lit?: Set<number> }) {
  const words = text.split(" ");
  return <span className="hpn-he" lang="he" dir="rtl">
    {words.map((word, i) => <span key={i}>{i > 0 && " "}{lit?.has(from + i) ? <mark>{word}</mark> : word}</span>)}
  </span>;
}

/** Berean words with the given English words lit, each found after the one before. */
function litEnglish(lines: string[], words: string[] = []): ReactNode[] {
  const queue = [...words];
  return lines.map((line, index) => {
    const parts: ReactNode[] = [];
    let rest = line;
    while (queue.length) {
      const match = new RegExp(`\\b${escape(queue[0])}\\b`, "i").exec(rest);
      if (!match) break;
      parts.push(rest.slice(0, match.index), <mark key={`${index}-${parts.length}`}>{match[0]}</mark>);
      rest = rest.slice(match.index + match[0].length);
      queue.shift();
    }
    parts.push(rest);
    return <span key={index}>{parts}</span>;
  });
}

/** The note that the Hebrew numbers a verse differently, when a psalm's title is its own verse there. */
function HebrewNumber({ verse }: { verse: Verse }) {
  if (!verse.hebrewVerse) return null;
  return <small className="hpn-hebnum">{`In the Hebrew ${verse.chapter}:${verse.hebrewVerse}, because the title is its verse 1`}</small>;
}

/** The Berean's words for a verse, shown some way (`render`): the Berean whatever the reader's language. */
function Berean({ verse, render }: { verse: Verse; render: (text: string) => ReactNode }) {
  const catalog = useCatalog();
  return <BibleVerse id={verseIdOf(catalog, verse.code, verse.chapter, verse.verse)} bible="bsb" render={render} />;
}

/** One verse in both languages: line beside line when the build divided the Hebrew, the whole verse beside the whole otherwise. */
export function VersePair({ label, verseKey, lit, litEn, caption = true }: { label?: string; verseKey?: string; lit?: number[]; litEn?: string[]; caption?: boolean }) {
  const found = label ? firstOf(label) : verseKey ? byKey(verseKey) : null;
  if (!found) return null;
  const { verse, pair } = found;
  const litSet = new Set(lit ?? []);
  return <figure className={`hpn-pair${pair ? "" : " hpn-pair-whole"}`}>
    {(caption || verse.hebrewVerse) && <figcaption>{caption && label && <RefButton label={label} />}<HebrewNumber verse={verse} /></figcaption>}
    {pair ? <Lines verse={verse} pair={pair} litEn={litEn} lit={litSet} psalm={verse.code === "PSA"} /> : <div className="hpn-rows">
      {/* A verse shown whole is one run of words. */}
      <p className="hpn-row"><span className="hpn-en"><Berean verse={verse} render={(text) => litEnglish([text], litEn)} /></span>{verse.hebrew && <Hebrew text={verse.hebrew} lit={litSet} />}</p>
    </div>}
    {!verse.hebrew && <small className="hpn-nohe">New Testament: written in Greek; the Berean alone is shown.</small>}
  </figure>;
}

function Lines({ verse, pair, litEn, lit, psalm }: { verse: Verse; pair: Pair; litEn?: string[]; lit: Set<number>; psalm: boolean }) {
  let from = pair.title ? pair.title.he.split(" ").length : 0;
  const title = pair.title;
  // The lit English words are found row after row, the heading left out, so each row lights its share of them.
  const rowWords = (index: number) => (text: string) => {
    const lines = bereanLines(text, verse.breaks);
    return litEnglish(pair.rows.map((r) => lines[r.line] ?? ""), litEn)[index];
  };
  return <div className="hpn-rows">
    {title && <p className="hpn-title">
      <span className="hpn-title-tag">{psalm ? "Title · in the Hebrew, part of verse 1" : "Heading"}</span>
      <span className="hpn-en">{title.en ?? <Berean verse={verse} render={(text) => bereanLines(text, verse.breaks)[title.line ?? 0]} />}</span>
      <Hebrew text={title.he} lit={lit} />
    </p>}
    {pair.rows.map((row, i) => {
      const start = from;
      from += row.he ? row.he.split(" ").length : 0;
      return <p key={i} className={`hpn-row${i % 2 ? " hpn-row-b" : ""}`}>
        <span className="hpn-en"><Berean verse={verse} render={rowWords(i)} /></span>
        {row.he ? <Hebrew text={row.he} from={start} lit={lit} /> : <span className="hpn-he-none">No line here in the Leningrad text</span>}
      </p>;
    })}
  </div>;
}
