// The Privacy page (redesigned 2026-10-25: "much more interactive and fun... drawings, icons, sections, banners"). The
// inner-room drawing (Matthew 6:6) in the hero, the four promises as an icon bar, 01 "What leaves your device?"
// (FlowMap.tsx), 02 the policy in full (PolicyViews.tsx). /privacy shows the Codex layout; /privacy_mockup passes the
// others and adds its version pill as children.
import { Ban, EyeOff, HardDrive, Send, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { InnerRoomArt } from "./DoorArt";
import { FlowMap } from "./FlowMap";
import { PolicyText, type PolicyVersion } from "./PolicyViews";
import { CONTACT_ADDRESS, SUMMARY, UPDATED } from "./privacy-content";
import "./legal.css";

const PROMISE_ICONS: LucideIcon[] = [EyeOff, Ban, HardDrive, Send];
const PROMISE_HEADS = ["No account", "No ads, no tracking", "Kept on your device", "Only what you send"];

export function PrivacyView({ version, supportTo, children }: { version: PolicyVersion; supportTo: string; children?: ReactNode }) {
  return (
    <div className="lg-page">
      <section className="lg-hero">
        <div>
          <p className="lg-eyebrow">Privacy Policy · Updated {UPDATED}</p>
          <h1>Nothing to sell.<em>Nothing tracked.</em></h1>
          <p className="lg-sub">Read in your inner room,<br />with the door shut.</p>
          <p className="lg-lead">Bible Guide is free, has no ads and does not track you. This page says exactly what the website and the Bible Guide app collect, and why.</p>
        </div>
        <InnerRoomArt />
      </section>
      <ul className="lg-promises">
        {SUMMARY.map((line, i) => {
          const Icon = PROMISE_ICONS[i];
          return <li key={line}><Icon aria-hidden /><b>{PROMISE_HEADS[i]}</b><span>{line}</span></li>;
        })}
      </ul>
      <section className="lg-section">
        <p className="lg-eyebrow"><span>01</span> · Choose a moment</p>
        <h2>What leaves <em>your device?</em></h2>
        <p className="lg-text">Most of Bible Guide never leaves your screen. Choose what you are doing to see the few places anything goes.</p>
        <FlowMap />
      </section>
      <section className="lg-section">
        <p className="lg-eyebrow"><span>02</span> · Eleven sections</p>
        <h2>The policy <em>in full.</em></h2>
        <PolicyText version={version} />
      </section>
      <aside className="lg-band">
        <p>Questions about your information? Write to <a href={`mailto:${CONTACT_ADDRESS}`}>{CONTACT_ADDRESS}</a>.</p>
        <Link to={supportTo}>Support →</Link>
      </aside>
      {children}
    </div>
  );
}
