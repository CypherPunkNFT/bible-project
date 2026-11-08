// New Testament history's shared pieces: a section that keeps its own failure, the section head, research text with its check
// notes and its Bible references made into buttons that open the verses, the three parts of a record, and source citations.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { refByKey, readingTag, sourceById } from "./model";
import { useOpen } from "./open";

export class NhSection extends Component<{ id: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`The New Testament history page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="nh-sec">{this.state.failed ? <p className="nh-failed">This section could not be drawn.</p> : children}</section>;
  }
}

export function Head({ num, kicker, title, turn, lead }: { num: string; kicker: string; title: string; turn: string; lead?: ReactNode }) {
  return <header className="nh-head"><p className="nh-kicker"><b>{num}</b> · {kicker}</p><h2>{title} <em>{turn}</em></h2>{lead && <p>{lead}</p>}</header>;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const REF_PATTERN = new RegExp(`(?<![A-Za-z0-9])(${[...refByKey.keys()].sort((a, b) => b.length - a.length).map(escape).join("|")})(?![\\d:])`, "g");

export function RefButton({ label }: { label: string }) {
  const open = useOpen();
  if (!refByKey.has(label)) return <>{label}</>;
  return <button type="button" className="nh-ref" data-opener={`ref:${label}`} aria-haspopup="dialog" onClick={() => open(`ref:${label}`)}>{label}</button>;
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
  return <p className="nh-refs">{lead}: {labels.map((label) => <RefButton key={label} label={label} />)}</p>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: { evidence: string; inference: string; limit: string }) {
  return <dl className="nh-three">
    <div><dt>What the record says</dt><dd><Prose text={evidence} /></dd></div>
    <div><dt>What this study infers</dt><dd><Prose text={inference} /></dd></div>
    <div><dt>Where it stops</dt><dd><Prose text={limit} /></dd></div>
  </dl>;
}

/** The sources a record leans on, each with what was read of it. The record gives no links, so none are made. */
export function Cite({ ids }: { ids: string[] }) {
  const known = ids.map((id) => sourceById.get(id)).filter((s) => s !== undefined);
  if (known.length !== ids.length) console.error(`The New Testament history page: a source in ${ids.join(", ")} is not in the research record`);
  if (!known.length) return null;
  return <ul className="nh-cite" aria-label="Sources">{known.map((s) => <li key={s.id}><Checked text={s.title} /> <small>({readingTag(s.status)})</small></li>)}</ul>;
}
