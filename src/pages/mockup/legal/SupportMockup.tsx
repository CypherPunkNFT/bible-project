// MOCK-UP: the Support page redesigned (owner, 2026-10-25), at /support_mockup on this computer's preview only. The open
// door (Matthew 7:7) in the hero, three ways to reach us in one quiet row, 01 the common questions in three layouts
// (A tiles that open their answer beneath, B a search over the list, C a question menu beside the answer), switched by
// the pill (?v=a|b|c), and the Help for life band with its lighthouse. All answers come from SupportPage.tsx.
import { ArrowRight, Bookmark, Gift, LifeBuoy, Mail, MessageSquareText, PencilLine, Phone, Search, ShieldCheck, Trash2, WifiOff, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CONTACT_ADDRESS } from "@/pages/PrivacyPage";
import { QUESTIONS } from "@/pages/SupportPage";
import { LighthouseArt, OpenDoorArt } from "./DoorArt";
import { VersionPill } from "./VersionPill";
import "./legal-mockup.css";

type SupportVersion = "a" | "b" | "c";

/** One entry per QUESTIONS item, in the same order: its icon, a short tile label and words a search should find. */
const META: { icon: LucideIcon; label: string; words: string }[] = [
  { icon: Gift, label: "Is it free?", words: "free cost price subscription ads account pay" },
  { icon: PencilLine, label: "Report a mistake", words: "mistake error typo wrong report correction fix" },
  { icon: WifiOff, label: "Offline in the app", words: "offline internet app connection download listen audio phone" },
  { icon: Bookmark, label: "Bookmarks and notes", words: "bookmarks notes saved device sync lost phone browser" },
  { icon: Trash2, label: "Delete a testimony", words: "testimony story remove withdraw delete link" },
  { icon: ShieldCheck, label: "Information we collect", words: "privacy collect data information tracking" },
];

const VERSIONS: { id: SupportVersion; name: string }[] = [
  { id: "a", name: "Tiles" },
  { id: "b", name: "Search" },
  { id: "c", name: "Menu" },
];

function Answer({ index }: { index: number }) {
  const Icon = META[index].icon;
  return <div className="sp-answer" aria-live="polite"><Icon aria-hidden /><div><h3>{QUESTIONS[index].question}</h3><p>{QUESTIONS[index].answer}</p></div></div>;
}

function Tiles() {
  const [open, setOpen] = useState(0);
  return <>
    <div className="sp-tiles">{META.map((m, i) => <button key={m.label} type="button" aria-pressed={i === open} onClick={() => setOpen(i)}>
      <m.icon aria-hidden /><span>{m.label}</span>
    </button>)}</div>
    <Answer index={open} />
  </>;
}

function SearchList() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = QUESTIONS.map((_, i) => i).filter((i) => terms.every((t) => `${QUESTIONS[i].question} ${META[i].words}`.toLowerCase().includes(t)));
  return <>
    <label className="sp-search"><Search aria-hidden /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the questions: offline, mistake, notes…" aria-label="Search the questions" />
      {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear the search"><X aria-hidden /></button>}</label>
    <p className="sp-count">{hits.length === QUESTIONS.length ? `${hits.length} questions` : `${hits.length} of ${QUESTIONS.length} questions`}</p>
    <div className="sp-list">{hits.map((i) => {
      const Icon = META[i].icon, isOpen = open === i || terms.length > 0;
      return <section key={i} className={`sp-row${isOpen ? " is-open" : ""}`}>
        <button type="button" aria-expanded={isOpen} onClick={() => setOpen(open === i ? null : i)}><Icon aria-hidden /><span>{QUESTIONS[i].question}</span></button>
        {isOpen && <p>{QUESTIONS[i].answer}</p>}
      </section>;
    })}
    {!hits.length && <p className="sp-none">Nothing matches. Write to us at <a href={`mailto:${CONTACT_ADDRESS}`}>{CONTACT_ADDRESS}</a>.</p>}</div>
  </>;
}

function Menu() {
  const [open, setOpen] = useState(0);
  return <div className="sp-menu-wrap">
    <nav className="pv-menu" aria-label="Questions">{META.map((m, i) => <button key={m.label} type="button" className="pv-menu-item" aria-current={i === open ? "true" : undefined} onClick={() => setOpen(i)}>
      <m.icon aria-hidden /><span className="pv-n">{String(i + 1).padStart(2, "0")}</span><span>{QUESTIONS[i].question}</span>
    </button>)}</nav>
    <Answer index={open} />
  </div>;
}

const WAYS = [
  { icon: Mail, title: "Email us", line: CONTACT_ADDRESS, href: `mailto:${CONTACT_ADDRESS}` },
  { icon: MessageSquareText, title: "The contact form", line: "Write from the site", to: "/contact" },
  { icon: PencilLine, title: "Suggest a correction", line: "The button on every page sends the page with your note" },
];

export default function SupportMockup() {
  const [params] = useSearchParams();
  const version = VERSIONS.find((v) => v.id === params.get("v"))?.id ?? "a";
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
        {version === "b" ? <SearchList /> : version === "c" ? <Menu /> : <Tiles />}
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
      <VersionPill label="Questions layout" versions={VERSIONS} current={version} />
    </div>
  );
}
