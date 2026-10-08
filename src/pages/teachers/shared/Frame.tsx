// What both Teachers subpages share: the switch between the two sides, the numbered section heading, a section that
// keeps its own failure to itself, and the loading state.
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SIDE_PATHS, type Side } from "./sides";
import "./frame.css";


/** "Preachers & authors | Scholars": the two sides of Teachers. */
export function SidesSwitch({ current }: { current: Side }) {
  return <nav className="tp-sides" aria-label="Teachers">
    <Link to={SIDE_PATHS.preachers} aria-current={current === "preachers" ? "page" : undefined}>Preachers &amp; authors</Link>
    <Link to={SIDE_PATHS.scholars} aria-current={current === "scholars" ? "page" : undefined}>Scholars</Link>
  </nav>;
}

/** A section heading: the number sits in line with the kicker ("04 / FIVE CENTURIES OF LIVES"), never in its own column. */
export function SectionHead({ num, kicker, title, line, children }: { num: string; kicker: string; title: ReactNode; line?: ReactNode; children?: ReactNode }) {
  return <header className="tp-head">
    <p className="tp-kicker"><span className="tp-num">{num}</span>{kicker}</p>
    <h2>{title}</h2>
    {line && <p className="tp-line">{line}</p>}
    {children}
  </header>;
}

/** One section of a subpage; if it fails to draw, only it says so and the rest of the page carries on. */
export class TeacherSection extends Component<{ id: string; title: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Teachers: the "${this.props.title}" section failed to draw`, error, info.componentStack);
  }
  render() {
    return <section id={this.props.id} className={`tp-sec tp-sec-${this.props.id}`} aria-label={this.props.title}>
      {this.state.failed ? <p className="tp-failed">This section could not be shown. Reloading the page usually fixes it.</p> : this.props.children}
    </section>;
  }
}

export function PageStatus({ error }: { error: Error | null }) {
  return <div className="tp-status" role="status" aria-live="polite">
    {error ? <p>This page could not load its data. Reload to try again.</p> : <p className="animate-pulse">Loading…</p>}
  </div>;
}
