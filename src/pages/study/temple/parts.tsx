// The temple page's shared pieces: a section that keeps its own failure, the section head, research text with its check notes
// and its Bible references made into buttons (a bare "(26:22–23)" is read against the last book named before it, as the build
// script reads it), the three parts of a record, the witness marks, and source citations.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { readingTag, refByKey, sourceById, type Witness } from "./model";
import { useOpen } from "./open";

export class TwSection extends Component<{ id: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`The temple page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="tw-sec">{this.state.failed ? <p className="tw-failed">This section could not be drawn.</p> : children}</section>;
  }
}

export function Head({ num, kicker, title, turn, lead }: { num: string; kicker: string; title: string; turn: string; lead?: ReactNode }) {
  return <header className="tw-head">
    <p className="tw-kicker"><b>{num}</b> {kicker}</p>
    <h2>{title} <em>{turn}</em></h2>
    {lead && <p className="tw-head-lead">{lead}</p>}
  </header>;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const FULL = [...refByKey.keys()].sort((a, b) => b.length - a.length).map(escape).join("|");
const PART = String.raw`\d+:\d+(?:[–-]\d+)?(?:, \d+(?:[–-]\d+)?(?![\d:]))*`;
const PATTERN = new RegExp(`(?<![A-Za-z0-9])(${FULL})(?![\\d:–-])|(?<=\\()(${PART}(?:; ${PART})*)(?=[);])`, "g");
const bookOf = (label: string): string => label.replace(/ \d[\d:–,; -]*$/, "");

export function RefButton({ label, shown = label }: { label: string; shown?: string }) {
  const open = useOpen();
  if (!refByKey.has(label)) return <>{shown}</>;
  return <button type="button" className="tw-ref" data-opener={`ref:${label}`} aria-haspopup="dialog" onClick={() => open(`ref:${label}`)}>{shown}</button>;
}

/** A render function for one piece of text: it remembers the last book named, across the text's check-noted runs. */
function referenceRenderer(): (words: string) => ReactNode {
  let book = "";
  return (words) => {
    const out: ReactNode[] = [];
    let last = 0;
    for (const match of words.matchAll(PATTERN)) {
      const at = match.index ?? 0;
      if (at > last) out.push(words.slice(last, at));
      if (match[1]) {
        book = bookOf(match[1]);
        out.push(<RefButton key={at} label={match[1]} />);
      } else {
        out.push(book ? <RefButton key={at} label={`${book} ${match[2]}`} shown={match[2]} /> : match[2]);
      }
      last = at + match[0].length;
    }
    if (!out.length) return words;
    if (last < words.length) out.push(words.slice(last));
    return out;
  };
}

/** Research text: check-noted passages highlighted, references opening their verses. */
export function Prose({ text }: { text: string }) {
  return <Checked text={text} render={referenceRenderer()} />;
}

export function Refs({ labels, lead = "Read" }: { labels: string[]; lead?: string }) {
  if (!labels.length) return null;
  return <p className="tw-refs">{lead}: {labels.map((label) => <RefButton key={label} label={label} />)}</p>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: { evidence: string; inference: string; limit: string }) {
  return <dl className="tw-three">
    <div><dt>What the evidence says</dt><dd><Prose text={evidence} /></dd></div>
    <div><dt>What this study infers</dt><dd><Prose text={inference} /></dd></div>
    <div><dt>Where it stops</dt><dd><Prose text={limit} /></dd></div>
  </dl>;
}

const WITNESS_LABEL: Record<Witness, string> = {
  scripture: "Scripture", josephus: "Josephus", rabbinic: "Mishnah · about AD 200", ground: "In the ground", other: "Another ancient writer",
};

/** A witness mark: the shape and the word carry the kind, never colour alone. */
export function Tag({ kind }: { kind: Witness }) {
  return <span className={`tw-tag tw-tag-${kind}`}><i aria-hidden="true" />{WITNESS_LABEL[kind]}</span>;
}

export function Tags({ kinds }: { kinds: Witness[] }) {
  if (!kinds.length) return null;
  return <span className="tw-tags" aria-label={`Witnesses: ${kinds.map((k) => WITNESS_LABEL[k]).join(", ")}`}>{kinds.map((k) => <Tag key={k} kind={k} />)}</span>;
}

/** The sources a record leans on, each with what was read of it. No outside link is made: the page links only inside the site. */
export function Cite({ ids }: { ids: string[] }) {
  const known = ids.map((id) => sourceById.get(id)).filter((s) => s !== undefined);
  if (known.length !== ids.length) console.error(`The temple page: a source in ${ids.join(", ")} is not in the research record`);
  if (!known.length) return null;
  return <ul className="tw-cite" aria-label="Sources">{known.map((s) => <li key={s.id}><Checked text={s.title} /> <small>({readingTag(s.status)})</small></li>)}</ul>;
}
