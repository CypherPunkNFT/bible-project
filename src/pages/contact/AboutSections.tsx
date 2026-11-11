import { CONVICTIONS } from "./AboutSections.shared";
import { ART } from "./conviction-art";
// The two sections under the contact form (approved mock-up F, 2026-10-20): 01 About the project, with four convictions
// (glory, free, open, gathered) under giant numerals, and 02 a short letter from the founder on a ruled sheet.
// Verses are the King James Version. Styles: contact.css (.cv-* and .lt-*).
import { Verse } from "@/components/Verse";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

// The letter's two buttons: Redeemer Forge, Inc., which runs Bible Guide, and Lucas's own story at the root of the testimony tree.
const REDEEMER_FORGE_URL = "https://redeemerforge.com";
const FOUNDER = { name: "Lucas Campbell Saint Laurent", first: "Lucas", role: "Founder and sole developer", place: "Jacksonville, Florida" };

function Eyebrow({ number, children, id }: { number: string; children: string; id?: string }) {
  return <p className="cv-eyebrow" id={id}><span>{number}</span> · {children}</p>;
}

/** The four convictions under giant numerals, each with its drawing and verse; also shown on the homepage mock-up, which
 *  passes `firstText` (its own words for the first conviction) and `shelf` (the shelf drawing in place of the books). */
export function ConvictionList({ firstText, shelf }: { firstText?: string; shelf?: boolean }) {
  return (
  <ol className="cv-list">
    {CONVICTIONS.map((item, index) => (
      <li key={item.numeral}>
        <span className="cv-numeral" aria-hidden="true">{item.numeral}</span>
        <div className="cv-art">
          <svg viewBox="0 0 120 92" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ART[shelf && item.art === "books" ? "shelf" : item.art]}</svg>
        </div>
        <h3>{item.title}</h3>
        <p>{index === 0 && firstText ? firstText : item.text}</p>
        <blockquote>“<Verse id={item.verse} unquoted />”<cite>{item.reference}</cite></blockquote>
      </li>
    ))}
  </ol>
  );
}

export function AboutProject() {
  return (
    <section className="cv-why" aria-labelledby="about-project">
      <header>
        <Eyebrow number="01">About the project</Eyebrow>
        <h2 id="about-project">Gathered, connected,<em>given freely.</em></h2>
        <p className="cv-text">
          For two thousand years believers have copied the Scriptures, confessed the creeds, preached, argued and prayed. Most of
          that inheritance survives, but it is scattered across libraries and archives, in books long out of print, and much of it
          behind a paywall. Bible Guide gathers it into one source and gives it away, for the glory of God.
        </p>
      </header>
      <ConvictionList />
    </section>
  );
}

function MarginNote({ side, verse, reference }: { side: "left" | "right"; verse: number; reference: string }) {
  return <aside className={`lt-note lt-note-${side}`}><p><Verse id={verse} /></p><cite>{reference}</cite></aside>;
}

export function FounderLetter() {
  const { hash } = useLocation();
  const section = useRef<HTMLElement>(null);
  // "Back to the letter" on the other-work page lands here. The layout scrolls every new page to the top first, so wait a frame.
  useEffect(() => {
    if (hash !== "#founder-letter") return;
    const frame = requestAnimationFrame(() => section.current?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [hash]);
  return (
    <section className="lt-wrap" aria-labelledby="founder-letter" ref={section}>
      <Eyebrow number="02" id="founder-letter">Who builds it · a letter from the founder</Eyebrow>
      <article className="lt-letter">
        <div className="lt-ruled">
          <header><span>Bible Guide</span><span>{FOUNDER.place}</span></header>
          <p className="lt-dear">Dear reader,</p>
          <div className="lt-body">
            <p>
              {`Thank you for stopping here. I wanted you to know who is on the other side of this page. My name is ${FOUNDER.first}, and I build Bible Guide by myself.`}
            </p>
            <MarginNote side="right" verse={46010031} reference="1 Corinthians 10:31" />
            <p>
              I do it because I believe what these pages hold. The faith came to me through people who copied, preached and prayed
              long before I was born. I want to pass it on the way it came to me: freely, and for the glory of God.
            </p>
            <p>
              So if something here helps you, troubles you, or you simply want to say hello, write to me. I read every letter myself,
              and I would be glad to hear from you.
            </p>
          </div>
          <footer>
            <p className="lt-close">Grace and peace,</p>
            <p className="lt-sign">{FOUNDER.name}</p>
            <p className="lt-role">{FOUNDER.role}, Bible Guide</p>
            <p className="lt-ps">
              <b>P.S.</b> When I'm not building this, I'm working on <a href="https://redeemerpathways.org" target="_blank" rel="noopener">redeemerpathways.org</a>,
              a faith-based program for foster youth, and <a href="https://churchfamily.io" target="_blank" rel="noopener">ChurchFamily.io</a>, a community
              platform for churches to serve one another in love.
            </p>
          </footer>
        </div>
        <div className="lt-links">
          <a href={REDEEMER_FORGE_URL} target="_blank" rel="noopener">Visit Redeemer Forge<ArrowRight className="h-[15px] w-[15px]" aria-hidden /></a>
          <Link to="/testimonies">Read about my faith<ArrowRight className="h-[15px] w-[15px]" aria-hidden /></Link>
        </div>
        <span className="lt-wax" aria-hidden="true">
          <svg viewBox="0 0 64 64"><path d="M32 4c6 2 9-1 14 3s3 8 7 12 1 9 3 14-2 8-4 13-7 5-11 9-9 1-14 3-8-2-13-4-5-7-9-11-1-9-3-14 2-8 4-13 7-5 11-9 9-1 15-3Z" /><path className="lt-wax-cross" d="M32 18V46M23 28H41" /></svg>
        </span>
      </article>
    </section>
  );
}
