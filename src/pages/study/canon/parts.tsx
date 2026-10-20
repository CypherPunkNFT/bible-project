// The canon study's shared pieces (approved mock-up: js/core.js): the source links under every claim, a picture's credit,
// the note on what changed over time, and a section that keeps its own failure and opens with its line of the story.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { imgSrc, pictureWhat, sourceById, type Picture } from "./model";

export const ext = { target: "_blank", rel: "noopener" } as const;

/** The source links under a claim, opening in a new tab, exactly as the research file lists them. */
export function Cite({ ids }: { ids: string[] }) {
  return <div className="cn-cite">{ids.map((id) => {
    const s = sourceById.get(id);
    if (!s) { console.error(`canon page: source "${id}" is not in the research file's sources`); return null; }
    return <a key={id} href={s.url} {...ext}>{s.title}<span aria-hidden="true"> ↗</span></a>;
  })}</div>;
}

export function Credit({ p }: { p: Picture }) {
  return <>{p.credit} · {p.licence} · <a href={p.page} {...ext}>Wikimedia Commons</a></>;
}

export function PictureImg({ p, lazy = true }: { p: Picture; lazy?: boolean }) {
  return <img src={imgSrc(p.q)} width={p.w} height={p.h} alt={`${p.name}: ${pictureWhat(p)}`} loading={lazy ? "lazy" : undefined} />;
}

/** The live page's note on what changed over time, shown once, after the map. */
export function Bridge() {
  return <aside className="cn-bridge"><span className="kicker">What changed over time?</span>
    <p>Use, copying and explicit boundaries overlapped. A council could regulate an inherited collection; a bishop could distinguish books for instruction from books in his canon. <strong>No single meeting in this record selected a Bible for every tradition.</strong></p>
    <p className="cn-caption">Compare Athanasius, the African Code and Trent above. Greek biblical collections also require attention to the particular manuscript: “the Septuagint” should not be treated as one surviving ancient volume with a universal contents page.</p>
    <Cite ids={["carthage", "sinaiticus"]} />
  </aside>;
}

/** One section of the page: its line of the story first, then its body; if it fails to draw, only it says so. */
export class CnSection extends Component<{ id: string; story?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Canon page: the "${this.props.id}" section failed to draw`, error, info.componentStack);
  }
  render() {
    const { id, story, children } = this.props;
    return <section id={id} className={`t-sec t-sec-${id} cn-sec-${id}`}>
      {this.state.failed ? <p className="t-failed">This section could not be drawn.</p> : <>{story && <p className="cn-story">{story}</p>}{children}</>}
    </section>;
  }
}
