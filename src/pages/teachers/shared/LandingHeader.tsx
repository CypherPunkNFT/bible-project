import type { ReactNode } from "react";
import { RadiatingBible } from "../preachers/landing/RadiatingBible";
import "./landing-header.css";

/** Keep both sides of the Teachers landing in the same physical slots. */
export function LandingHeader({ title, lead, children }: { title: ReactNode; lead: ReactNode; children: ReactNode }) {
  return <div className="lnd-top teacher-landing-header">
    <div className="lnd-copy">
      <p className="kicker lnd-kicker">Teachers in the library</p>
      <h1 className="lnd-title">{title}</h1>
      <p className="lnd-lead">{lead}</p>
    </div>
    <RadiatingBible />
    <div className="lnd-tools">{children}</div>
  </div>;
}
