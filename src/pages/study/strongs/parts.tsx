// The Strong's numbers study's shared pieces: a section that keeps its own failure, the source links under a claim, the three
// parts of a record, a word in its own script, and a scan with its credit.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { ext, pictureById, sourceById } from "./model";

export class SnSection extends Component<{ id: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Strong's numbers page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  render() {
    const { id, children } = this.props;
    return <section id={id} className="sn-sec">{this.state.failed ? <p className="sn-failed">This section could not be drawn.</p> : children}</section>;
  }
}

export function Head({ num, kicker, title, lead }: { num: string; kicker: string; title: ReactNode; lead: ReactNode }) {
  return <header className="sn-head"><p className="sn-kicker"><b>{num}</b> · {kicker}</p><h2>{title}</h2><p>{lead}</p></header>;
}

export function Cite({ ids }: { ids: string[] }) {
  return <div className="sn-cite">{ids.map((id) => {
    const source = sourceById.get(id);
    if (!source) { console.error(`Strong's numbers page: source "${id}" is not in the research record`); return null; }
    return <a key={id} href={source.url} {...ext}>{source.title}<span aria-hidden="true"> ↗</span></a>;
  })}</div>;
}

/** What the evidence says · what this study infers · where the evidence stops, kept apart (study rule A2). */
export function ThreeParts({ evidence, inference, limit }: { evidence: ReactNode; inference: ReactNode; limit: ReactNode }) {
  return <dl className="sn-three">
    <div><dt>What the evidence says</dt><dd>{evidence}</dd></div>
    <div><dt>What this study infers</dt><dd>{inference}</dd></div>
    <div><dt>Where the evidence stops</dt><dd>{limit}</dd></div>
  </dl>;
}

/** A Hebrew or Greek word, set in its own direction inside the English line. */
export function Lemma({ lang, children }: { lang: string; children: string }) {
  return lang === "hebrew"
    ? <bdi lang="he" dir="rtl" className="sn-he">{children}</bdi>
    : <span lang="el" className="sn-el">{children}</span>;
}

export function Scan({ id, lazy = true }: { id: string; lazy?: boolean }) {
  const picture = pictureById.get(id);
  if (!picture) { console.error(`Strong's numbers page: picture "${id}" is not in the research record`); return null; }
  return <figure className="sn-scan">
    <a href={picture.href} {...ext}><img src={picture.src} width={picture.width} height={picture.height} alt={picture.alt} loading={lazy ? "lazy" : undefined} /></a>
    <figcaption>{picture.caption} <a href={picture.href} {...ext}>See the page in the scan ↗</a></figcaption>
  </figure>;
}
