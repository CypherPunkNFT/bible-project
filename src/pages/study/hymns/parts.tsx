// The Hymns collection page's frame, as the approved mock-up draws it (design/hymn-directions/collection/page.js and
// design/authors-directions/teachers/teachers.css): a numbered section heading, and a section that keeps its own failure.
import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from "react";
import { DeferredSection } from "@/components/DeferredSection";

/** "01 · THE WHOLE BIBLE / Every chapter, sung in our hymns / one plain line": the number in its own column. */
export function SectionHead({ num, kicker, title, line }: { num: string; kicker: string; title: ReactNode; line: ReactNode }) {
  return <header className="t-head"><span className="t-num">{num}</span><div><p className="kicker">{kicker}</p><h2>{title}</h2><p>{line}</p></div></header>;
}

/** One section of the page; if it fails to draw, only it says so and the rest of the page carries on. Every section but the
 *  landing is drawn only when it comes near the screen (2026-11-19: drawing all six at once kept a throttled phone from
 *  painting for 7 s); the section and its id are always there, so a jump link finds it. `eager` draws it now. */
export class HymnSection extends Component<{ id: string; title: string; className?: string; style?: CSSProperties; eager?: boolean; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Hymns page: the "${this.props.title}" section failed to draw`, error, info.componentStack);
  }
  render() {
    const { id, title, className, style, eager, children } = this.props;
    return <section id={id} className={`t-sec t-sec-${id}${className ? ` ${className}` : ""}`} aria-label={title} style={style}>
      {this.state.failed ? <p className="t-failed">This section could not be drawn.</p> : id === "landing" ? children : <DeferredSection eager={eager}>{children}</DeferredSection>}
    </section>;
  }
}
