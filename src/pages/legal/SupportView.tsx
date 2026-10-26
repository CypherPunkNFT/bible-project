// The Support page (redesigned 2026-10-25). The open door (Matthew 7:7) in the hero, three ways to reach us in one quiet
// row, 01 the common questions, and the Help for life band with its lighthouse. /support passes the Tiles layout;
// /support_mockup passes its other layouts and adds its version pill as children.
import { ArrowRight, LifeBuoy, Mail, MessageSquareText, PencilLine, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LighthouseArt, OpenDoorArt } from "./DoorArt";
import { CONTACT_ADDRESS } from "./privacy-content";
import "./legal.css";

const WAYS = [
  { icon: Mail, title: "Email us", line: CONTACT_ADDRESS, href: `mailto:${CONTACT_ADDRESS}` },
  { icon: MessageSquareText, title: "The contact form", line: "Write from the site", to: "/contact" },
  { icon: PencilLine, title: "Suggest a correction", line: "The button on every page sends the page with your note" },
];

export function SupportView({ questions, children }: { questions: ReactNode; children?: ReactNode }) {
  return (
    <div className="lg-page">
      <section className="lg-hero">
        <div>
          <p className="lg-eyebrow">Support · questions · help</p>
          <h1>How can we<em>help?</em></h1>
          <p className="lg-sub">Ask, and it will be given to you;<br />seek, and you will find.</p>
          <p className="lg-lead">Help with the Bible Guide website and app. If your question is not answered here, write to us.</p>
        </div>
        <OpenDoorArt />
      </section>
      <ul className="lg-ways">{WAYS.map((w) => {
        const inner = <><w.icon aria-hidden /><b>{w.title}</b><span>{w.line}</span>{(w.href || w.to) && <ArrowRight className="lg-ways-go" aria-hidden />}</>;
        return <li key={w.title}>{w.href ? <a href={w.href}>{inner}</a> : w.to ? <Link to={w.to}>{inner}</Link> : <div>{inner}</div>}</li>;
      })}</ul>
      <section className="lg-section">
        <p className="lg-eyebrow"><span>01</span> · Six answers</p>
        <h2>Common <em>questions.</em></h2>
        {questions}
      </section>
      <aside className="lg-help">
        <LighthouseArt />
        <div>
          <p className="lg-eyebrow">Help for life</p>
          <p className="lg-help-verse">“God is our refuge and strength, an ever-present help in times of trouble.” <span>Psalm 46:1</span></p>
          <p className="lg-help-text">In danger now? Call <b>911</b>. Thinking of suicide or in crisis? Call or text <b>988</b>.</p>
          <div className="lg-help-actions">
            <Link className="lg-help-go" to="/resources/life"><LifeBuoy aria-hidden />Find free help<ArrowRight aria-hidden /></Link>
            <a className="lg-help-call" href="tel:988"><Phone aria-hidden />Call or text 988</a>
            <a className="lg-help-call" href="tel:911"><Phone aria-hidden />Call 911</a>
          </div>
        </div>
      </aside>
      {children}
    </div>
  );
}
