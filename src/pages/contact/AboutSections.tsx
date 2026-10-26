// The two sections under the contact form (approved mock-up F, 2026-10-20): 01 About the project, with four convictions
// (glory, free, open, gathered) under giant numerals, and 02 a short letter from the founder on a ruled sheet.
// Verses are the King James Version. Styles: contact.css (.cv-* and .lt-*).
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

// The letter's two buttons: Redeemer Forge, Inc., which runs Bible Guide, and Lucas's own story at the root of the testimony tree.
const REDEEMER_FORGE_URL = "https://redeemerforge.com";
const FOUNDER = { name: "Lucas Campbell Saint Laurent", first: "Lucas", role: "Founder and sole developer", place: "Jacksonville, Florida" };

const ART = {
  cross: <><path d="M60 16V84M44 34H76" strokeWidth="2" /><path className="cv-accent" d="M60 6V10M30 20L34 24M90 20L86 24M22 44H28M92 44H98M30 66L34 62M90 66L86 62" /><path className="cv-faint" d="M36 84H84" /></>,
  bowl: <><path d="M22 52H98Q94 76 60 78Q26 76 22 52Z" /><path className="cv-accent" d="M60 46C52 38 56 28 60 20C64 28 68 38 60 46Z" /><path className="cv-faint" d="M40 34L46 40M80 34L74 40M60 10V14" /><path className="cv-faint" d="M34 84H86" /></>,
  door: <><path d="M34 84V36A26 26 0 0 1 86 36V84" /><path className="cv-faint" d="M60 14V84" /><path className="cv-paper" d="M60 84L82 78V40Q80 22 62 14" /><path className="cv-accent" d="M38 84L18 88M86 84L104 88" /><circle className="cv-dot" cx="76" cy="54" r="2" /></>,
  books: <><path d="M18 84H102" /><path d="M24 84V30H38V84M38 84V22H52V84" /><path className="cv-paper" d="M56 84L66 26L80 28L70 86" /><path d="M84 84V44Q92 38 100 44V84" /><path className="cv-faint" d="M28 40H34M42 34H48M28 48H34" /><path className="cv-accent" d="M66 40L76 42" /></>,
};

const CONVICTIONS: { numeral: string; title: string; text: string; verse: string; reference: string; art: keyof typeof ART }[] = [
  { numeral: "I", title: "For the glory of God.", text: "Not for attention, and not for a name. Every page is offered back to the One it is about.", verse: "Whatsoever ye do, do all to the glory of God.", reference: "1 Corinthians 10:31", art: "cross" },
  { numeral: "II", title: "Free, always.", text: "There is no subscription and nothing to buy. What the Church received as a gift should be passed on as one.", verse: "Freely ye have received, freely give.", reference: "Matthew 10:8", art: "bowl" },
  { numeral: "III", title: "Open to everyone.", text: "Believer or skeptic, scholar or simply curious: the door is open to anyone who wants to come in.", verse: "Ho, every one that thirsteth, come ye to the waters.", reference: "Isaiah 55:1", art: "door" },
  { numeral: "IV", title: "Gathered in one place.", text: "Scripture, the creeds, the teachers and the hard questions, scattered for centuries, brought into one source and linked together.", verse: "Wisdom is the principal thing; therefore get wisdom.", reference: "Proverbs 4:7", art: "books" },
];

function Eyebrow({ number, children, id }: { number: string; children: string; id?: string }) {
  return <p className="cv-eyebrow" id={id}><span>{number}</span> · {children}</p>;
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
          behind a paywall. Bible Project gathers it into one source and gives it away, for the glory of God.
        </p>
      </header>
      <ol className="cv-list">
        {CONVICTIONS.map((item) => (
          <li key={item.numeral}>
            <span className="cv-numeral" aria-hidden="true">{item.numeral}</span>
            <div className="cv-art">
              <svg viewBox="0 0 120 92" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ART[item.art]}</svg>
            </div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <blockquote>“{item.verse}”<cite>{item.reference}</cite></blockquote>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MarginNote({ side, text, reference }: { side: "left" | "right"; text: string; reference: string }) {
  return <aside className={`lt-note lt-note-${side}`}><p>{text}</p><cite>{reference}</cite></aside>;
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
          <header><span>Bible Project</span><span>{FOUNDER.place}</span></header>
          <p className="lt-dear">Dear reader,</p>
          <div className="lt-body">
            <p>
              Thank you for stopping here. I wanted you to know who is on the other side of this page. My name is {FOUNDER.first}, and I
              build Bible Project by myself.
            </p>
            <MarginNote side="right" text="Whatsoever ye do, do all to the glory of God." reference="1 Corinthians 10:31" />
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
            <p className="lt-role">{FOUNDER.role}, Bible Project</p>
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
