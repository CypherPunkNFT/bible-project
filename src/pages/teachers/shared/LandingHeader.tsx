import { useLayoutEffect, useRef, type ReactNode } from "react";
import { RadiatingBible } from "../preachers/landing/RadiatingBible";
import "./landing-header.css";

/** Keep both sides of the Teachers landing in the same physical slots. */
export function LandingHeader({ title, lead, navigation, children }: { title: ReactNode; lead: ReactNode; navigation?: ReactNode; children: ReactNode }) {
  const header = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = header.current, search = el?.querySelector<HTMLElement>('.lnd-full-search');
    if (!el || !search) return;
    const measure = () => el.style.setProperty('--teacher-search-width', `${search.getBoundingClientRect().width}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(search);
    return () => observer.disconnect();
  }, []);
  return <div ref={header} className="lnd-top teacher-landing-header">
    <div className="lnd-copy">
      <p className="kicker lnd-kicker">Teachers in the library</p>
      <h1 className="lnd-title">{title}</h1>
      <p className="lnd-lead">{lead}</p>
      {navigation}
    </div>
    <RadiatingBible />
    <div className="lnd-tools">{children}</div>
  </div>;
}
