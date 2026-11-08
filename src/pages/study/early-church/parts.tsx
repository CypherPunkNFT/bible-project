// The early church's shared pieces: a section that keeps its own failure, the two-beat section head, research text with its check
// notes and its Bible references made into buttons, a note dot for a field whose note has no words to mark, the three parts of a
// record, the links a record names (no link where the route is empty), and source citations.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { beats, isUnchecked, linkFor, noteByPath, readingTag, refByKey, sourceById, type LinkItem } from "./model";
import { useOpen } from "./open";

export class EkSection extends Component<{ id: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`The early church page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="ek-sec">{this.state.failed ? <p className="ek-failed">This section could not be drawn.</p> : children}</section>;
  }
}

/** A section head: its number or kind, and a headline in two beats, the second in gold italic. */
export function Head({ kicker, title, lead, level = 2 }: { kicker: ReactNode; title: string; lead?: ReactNode; level?: 2 | 3 }) {
  const [first, turn] = beats(title);
  const Tag = level === 2 ? "h2" : "h3";
  return <header className="ek-head"><p className="ek-kicker">{kicker}</p><Tag>{first} {turn && <em>{turn}</em>}</Tag>{lead && <p className="ek-lead-line">{lead}</p>}</header>;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const REF_PATTERN = new RegExp(`(?<![A-Za-z0-9])(${[...refByKey.keys()].sort((a, b) => b.length - a.length).map(escape).join("|")})(?![\\d:])`, "g");

export function RefButton({ label }: { label: string }) {
  const open = useOpen();
  if (!refByKey.has(label)) return <>{label}</>;
  return <button type="button" className="ek-ref" data-opener={`ref:${label}`} aria-haspopup="dialog" onClick={() => open(`ref:${label}`)}>{label}</button>;
}

/** Plain words with every Bible reference the build supplied turned into a button that opens its verses. */
function withRefs(words: string): ReactNode {
  const parts = words.split(REF_PATTERN);
  if (parts.length === 1) return words;
  return parts.map((part, index) => (index % 2 === 1 ? <RefButton key={index} label={part} /> : part));
}

/** Research text: check-noted passages highlighted, references opening their verses. */
export const Prose = ({ text }: { text: string }) => <Checked text={text} render={withRefs} />;

/** The note on a field that has no words to highlight (an empty route, a quotation's reference), as a small dot. */
export function NoteDot({ path }: { path: string }) {
  const id = noteByPath.get(path);
  return id ? <> <Checked text={`{{check:${id}}}{{/check}}`} /></> : null;
}

export function Refs({ labels, lead = "Read" }: { labels: string[]; lead?: string }) {
  if (!labels.length) return null;
  return <p className="ek-refs">{lead}: {labels.map((label) => <RefButton key={label} label={label} />)}</p>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: { evidence: string; inference: string; limit: string }) {
  return <dl className="ek-three">
    <div><dt>What the record says</dt><dd><Prose text={evidence} /></dd></div>
    <div><dt>What this study infers</dt><dd><Prose text={inference} /></dd></div>
    <div><dt>Where it stops</dt><dd><Prose text={limit} /></dd></div>
  </dl>;
}

/** The studies a record points to. A route the build could not settle holds "" and is shown as a name, with its note. */
export function Links({ links, path }: { links: LinkItem[]; path: string }) {
  if (!links.length) return null;
  return <p className="ek-links"><span>Told elsewhere:</span> {links.map((l, i) => {
    const to = linkFor(l.route);
    return <span key={`${l.title}${i}`} className="ek-link">{to ? <Link to={to}>{l.title}</Link> : <span className="ek-unlinked">{l.title} <small>(not yet on the site)</small></span>}<NoteDot path={`${path}.links[${i}].route`} /></span>;
  })}</p>;
}

/** The sources a record leans on, each with what was read of it. */
export function Cite({ ids }: { ids: string[] }) {
  const known = ids.map((id) => sourceById.get(id)).filter((s) => s !== undefined);
  if (known.length !== ids.length) console.error(`The early church page: a source in ${ids.join(", ")} is not in the research record`);
  if (!known.length) return null;
  return <ul className="ek-cite" aria-label="Sources">{known.map((s) => <li key={s.id}><Checked text={s.title} /> <small>({readingTag(s.status)})</small></li>)}</ul>;
}

/** A quotation from an early writer or council, with where it stands and whether it has been compared with a held text. */
export function QuoteLine({ words, source, reference, path, held }: { words: string; source: string; reference: string; path: string; held?: string }) {
  const known = sourceById.get(source);
  return <figure className="ek-quote">
    <blockquote><Checked text={words} /></blockquote>
    <figcaption><Checked text={reference} /><NoteDot path={`${path}.quote.ref`} />
      {held ? <small className="ek-held">Checked word for word against {held}, held on this site.</small>
        : isUnchecked(source) ? <small>From {known ? <Checked text={known.title} /> : "a named translation"}; to be checked word for word before release.</small> : null}
    </figcaption>
  </figure>;
}
