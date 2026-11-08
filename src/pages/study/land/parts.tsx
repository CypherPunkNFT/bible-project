// The land of the Bible's shared pieces: a section that keeps its own failure, the two-beat section head, a verse reference
// that opens the verse in the sheet, the three parts of a record, the source line under a claim, and a link to a neighbour.
// Every research string goes through <Checked>, so a settled check mark can be clicked for its note.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { linkFor, readingTag, sourceById, verseByLabel } from "./model";
import { useOpen } from "./open-context";

export class LsSection extends Component<{ id: string; resetKey?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`The land of the Bible page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  componentDidUpdate(previous: { resetKey?: string }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="ls-sec">{this.state.failed ? <p className="ls-failed">This section could not be drawn.</p> : children}</section>;
  }
}

export function Head({ num, kicker, title, turn, lead }: { num: string; kicker: string; title: string; turn: string; lead: ReactNode }) {
  return <header className="ls-head"><p className="ls-kicker"><b>{num}</b> · {kicker}</p><h2 tabIndex={-1}>{title} <em>{turn}</em></h2><div className="ls-headlead">{lead}</div></header>;
}

/** A research string, highlighted where a check mark was settled. */
export const T = ({ text }: { text: string }) => <Checked text={text} />;

export function VerseRef({ label }: { label: string }) {
  const open = useOpen();
  if (!verseByLabel.has(label)) { console.error(`The land of the Bible page: verse "${label}" is not in the generated data`); return <span>{label}</span>; }
  return <button type="button" className="ls-ref" data-opener={`verse:${label}`} onClick={() => open(`verse:${label}`)} aria-haspopup="dialog">{label}</button>;
}

export function VerseRefs({ labels }: { labels: string[] }) {
  if (!labels.length) return null;
  return <p className="ls-refs"><span className="ls-refs-k">Verses</span>{labels.map((l) => <VerseRef key={l} label={l} />)}</p>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit, background }: { evidence: string; inference: string; limit: string; background?: string }) {
  return <dl className="ls-three">
    <div><dt>What the text and ground say</dt><dd><T text={evidence} /></dd></div>
    {background && <div><dt>Background, from outside sources</dt><dd><T text={background} /></dd></div>}
    <div><dt>What this study infers</dt><dd><T text={inference} /></dd></div>
    <div><dt>Where the evidence stops</dt><dd><T text={limit} /></dd></div>
  </dl>;
}

export function Cite({ ids }: { ids: string[] | undefined }) {
  if (!ids?.length) return null;
  return <p className="ls-cite"><span className="ls-refs-k">Sources</span>{ids.map((id) => {
    const source = sourceById.get(id);
    if (!source) { console.error(`The land of the Bible page: source "${id}" is not in the research record`); return null; }
    return <span key={id}><T text={source.title} /> <small>({readingTag(source.status)})</small></span>;
  })}</p>;
}

/** A neighbouring study: a link where the build settled its address, plain words where it did not. */
export function StudyLink({ title }: { title: string | undefined }) {
  if (!title) return null;
  const to = linkFor(title);
  return <p className="ls-next">Told in full in {to ? <Link to={to}>{plainText(title)} →</Link> : <span>{plainText(title)} <small>(not linked yet)</small></span>}</p>;
}

/** A record's opener: its name and a verb, choosing it opens the record in the sheet. */
export function Opener({ openKey, children, className = "" }: { openKey: string; children: ReactNode; className?: string }) {
  const open = useOpen();
  return <button type="button" className={`ls-opener ${className}`} data-opener={openKey} aria-haspopup="dialog" onClick={() => open(openKey)}>{children}</button>;
}
