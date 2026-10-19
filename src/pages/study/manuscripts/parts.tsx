// The Manuscripts page's shared pieces, as the approved mock-up draws them (design/manuscripts-directions/js/core.js,
// art.js, combos.js): icons, kind glyphs, the section heading, a section that keeps its own failure, our drawings of the
// form.
import { Component, type ErrorInfo, type ReactNode } from "react";
import type { MsRecord } from "@/lib/manuscripts";
import type { GlyphName } from "./model";


const ICONS = {
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  arrowLeft: <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>,
  arrowUp: <><path d="M7 7h10v10" /><path d="M7 17 17 7" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
};
/** The mock-up frame's line icons (stroke 1.5). */
export function Icon({ name, size = 18 }: { name: keyof typeof ICONS; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name]}</svg>;
}

const GLYPHS: Record<GlyphName, ReactNode> = {
  fragment: <><path d="M6 4.5 15.5 3l3 4-1 5 2 3.5-2.5 5-9 .5L5 17l1.5-4L4 9z" /><path d="M8.5 8h7M8 11h8M9 14h6" /></>,
  codex: <><path d="M12 6.5c-2-1.6-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z" /><path d="M12 6.5V20" /></>,
  hand: <path d="M4 8c2-1.5 3 1.5 5 0s3 1.5 5 0 3 1.5 6 0M4 12c2-1.5 3 1.5 5 0s3 1.5 5 0 3 1.5 6 0M4 16c2-1.5 3 1.5 5 0s3 1.5 4 0" />,
  lectern: <path d="M5 9.5 12 6l7 3.5M7 8.5V20M17 8.5V20M9 13h6M10 16h4" />,
  scroll: <><path d="M6 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6" /><ellipse cx="6" cy="12" rx="2" ry="7" /><path d="M10 9h6M10 12h6M10 15h4" /></>,
  tongue: <><path d="M4 6h9M8.5 4v2M6 6c.5 3 2.5 5.5 6 7M11 6c-.5 3-2.5 5.5-6 7" /><path d="m13 20 3.5-8 3.5 8M14.2 17.5h4.6" /></>,
};
/** A kind's glyph. */
export function Glyph({ name, size = 20 }: { name: GlyphName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{GLYPHS[name]}</svg>;
}

/** "01 · THROUGH TIME / Every dated copy, by time and by book / one plain line": flush left, the number on the label line. */
export function SectionHead({ num, kicker, title, lead }: { num?: string; kicker: string; title: ReactNode; lead?: ReactNode }) {
  return <header className="t-head ms-head"><div>
    <p className="kicker">{num && <><span className="ms-num">{num}</span><span className="ms-dot" aria-hidden="true">·</span></>}{kicker}</p>
    <h2>{title}</h2>{lead && <p>{lead}</p>}
  </div></header>;
}

/** One section of the page; if it fails to draw, only it says so and the rest of the page carries on. */
export class MsSection extends Component<{ id: string; title: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Manuscripts page: the "${this.props.title}" section failed to draw`, error, info.componentStack);
  }
  render() {
    const { id, title, children } = this.props;
    return <section id={id} className={`t-sec t-sec-${id} ms-sec-${id}`} aria-label={title}>
      {this.state.failed ? <p className="t-failed">This section could not be drawn.</p> : children}
    </section>;
  }
}

/** A view inside a section that keeps its own failure (the mock-up's switcher panes). */
export class MsPane extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error(`Manuscripts page: the "${this.props.name}" view failed to draw`, error); }
  render() { return this.state.failed ? <p className="t-failed">This view could not be drawn.</p> : this.props.children; }
}

// Our own line drawings for a manuscript with no open picture: a scroll, a codex or a papyrus leaf, by kind. They are
// drawings of the form, never of the object, and say so wherever they stand in for a picture.
const fineLines = (x0: number, y0: number, w: number, n: number, gap: number, short = 0.7) => Array.from({ length: n }, (_, i) => {
  const len = w * (i % 5 === 4 ? short : 0.86 + ((i * 37) % 10) / 70);
  return <path key={`${x0}-${i}`} className="a-fine" d={`M${x0} ${y0 + i * gap}h${len.toFixed(1)}`} />;
});
export function FormArt({ record }: { record: MsRecord }) {
  if (record.k === "dss") return <svg className="ms-art" viewBox="0 0 220 150" aria-hidden="true">
    <path className="a-ground" d="M14 132h192" /><path className="a-line" d="M40 30h150M40 118h150" />
    <ellipse className="a-line" cx="40" cy="74" rx="11" ry="44" /><ellipse className="a-fine" cx="40" cy="74" rx="5" ry="38" />
    <path className="a-line" d="M190 30c9 0 14 20 14 44s-5 44-14 44" /><path className="a-fine" d="M190 30c-6 0-9 20-9 44s3 44 9 44" />
    <g>{fineLines(60, 44, 34, 10, 7.6)}{fineLines(104, 44, 34, 10, 7.6)}{fineLines(148, 44, 26, 10, 7.6)}</g>
    <path className="a-tone" d="M98 40v70M142 40v70" />
  </svg>;
  if (record.k === "papyrus" || record.m === "papyrus") return <svg className="ms-art" viewBox="0 0 220 150" aria-hidden="true">
    <path className="a-ground" d="M14 132h192" /><path className="a-line" d="M72 26l44-6 38 10 6 26-10 18 12 30-26 18-52 2-20-22 6-26-10-28z" />
    <path className="a-fine" d="M80 30v86M110 24v98M140 28v90" opacity=".45" /><g>{fineLines(84, 40, 58, 9, 8.4, 0.5)}</g>
  </svg>;
  return <svg className="ms-art" viewBox="0 0 220 150" aria-hidden="true">
    <path className="a-ground" d="M14 132h192" />
    <path className="a-line" d="M110 34c-18-8-46-10-80-6v92c34-4 62-2 80 6 18-8 46-10 80-6V28c-34-4-62-2-80 6z" />
    <path className="a-line" d="M110 34v92" /><path className="a-fine" d="M30 120c34-3 60 0 80 8 20-8 46-11 80-8" />
    <g>{fineLines(40, 46, 26, 9, 8)}{fineLines(72, 46, 26, 9, 8)}{fineLines(120, 46, 26, 9, 8)}{fineLines(152, 46, 26, 9, 8)}</g>
    <path className="a-tone" d="M40 40h8" />
  </svg>;
}
