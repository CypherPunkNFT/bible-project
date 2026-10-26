// MOCK-UP: the full Privacy Policy text (SECTIONS from PrivacyPage.tsx, word for word) in three layouts. A "Codex": a
// big-icon menu beside one section at a time. B "Rail": every section in full, the menu kept beside it and lit for the
// section being read. C "Folded": one row per section, opening in place. Styles: legal-mockup.css (.pv-*).
import { Baby, ChevronDown, Globe, HardDrive, HeartHandshake, History, Landmark, MailOpen, CirclePlay, Handshake, SlidersHorizontal, Smartphone, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SECTIONS } from "@/pages/PrivacyPage";

export type PolicyVersion = "a" | "b" | "c";

const ICONS: Record<string, LucideIcon> = {
  "Who we are": Landmark, "Visiting the website": Globe, "What is saved in your own browser": HardDrive,
  "Videos and recordings": CirclePlay, "Messages and corrections": MailOpen, "Testimonies": HeartHandshake,
  "The Bible Guide app": Smartphone, "Children": Baby, "Who we share it with": Handshake,
  "Your choices": SlidersHorizontal, "Changes to this policy": History,
};

const iconFor = (title: string) => ICONS[title] ?? Landmark;
const number = (i: number) => String(i + 1).padStart(2, "0");
const idFor = (i: number) => `policy-${number(i)}`;

function Body({ index }: { index: number }) {
  return <>{SECTIONS[index].body.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</>;
}

function MenuButton({ index, active, onClick }: { index: number; active: boolean; onClick: () => void }) {
  const Icon = iconFor(SECTIONS[index].title);
  return <button type="button" className="pv-menu-item" aria-current={active ? "true" : undefined} onClick={onClick}>
    <Icon aria-hidden /><span className="pv-n">{number(index)}</span><span>{SECTIONS[index].title}</span>
  </button>;
}

function Codex() {
  const [open, setOpen] = useState(0);
  const Icon = iconFor(SECTIONS[open].title);
  return <div className="pv-codex">
    <nav className="pv-menu" aria-label="Policy sections">{SECTIONS.map((s, i) => <MenuButton key={s.title} index={i} active={i === open} onClick={() => setOpen(i)} />)}</nav>
    <article className="pv-panel" aria-live="polite">
      <span className="pv-big-n" aria-hidden>{number(open)}</span>
      <Icon className="pv-panel-icon" aria-hidden />
      <h3>{SECTIONS[open].title}</h3>
      <Body index={open} />
      <div className="pv-turn">
        {open > 0 && <button type="button" onClick={() => setOpen(open - 1)}>← {SECTIONS[open - 1].title}</button>}
        {open < SECTIONS.length - 1 && <button type="button" className="pv-next" onClick={() => setOpen(open + 1)}>{SECTIONS[open + 1].title} →</button>}
      </div>
    </article>
  </div>;
}

function Rail() {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const seen = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setCurrent(Number(top.target.getAttribute("data-index")));
    }, { rootMargin: "-20% 0px -60% 0px" });
    SECTIONS.forEach((_, i) => { const el = document.getElementById(idFor(i)); if (el) seen.observe(el); });
    return () => seen.disconnect();
  }, []);
  const go = (i: number) => document.getElementById(idFor(i))?.scrollIntoView({ behavior: "smooth", block: "start" });
  return <div className="pv-rail">
    <nav className="pv-menu pv-sticky" aria-label="Policy sections">{SECTIONS.map((s, i) => <MenuButton key={s.title} index={i} active={i === current} onClick={() => go(i)} />)}</nav>
    <div className="pv-text">{SECTIONS.map((s, i) => {
      const Icon = iconFor(s.title);
      return <section key={s.title} id={idFor(i)} data-index={i} className="pv-block">
        <h3><Icon aria-hidden /><span className="pv-n">{number(i)}</span>{s.title}</h3>
        <Body index={i} />
      </section>;
    })}</div>
  </div>;
}

function Folded() {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const all = open.size === SECTIONS.length;
  const flip = (i: number) => setOpen((now) => { const next = new Set(now); if (next.has(i)) next.delete(i); else next.add(i); return next; });
  return <div className="pv-folded">
    <button type="button" className="pv-all" onClick={() => setOpen(all ? new Set() : new Set(SECTIONS.map((_, i) => i)))}>{all ? "Fold every section" : "Open every section"}</button>
    {SECTIONS.map((s, i) => {
      const Icon = iconFor(s.title), isOpen = open.has(i);
      return <section key={s.title} className={`pv-fold${isOpen ? " is-open" : ""}`}>
        <h3><button type="button" aria-expanded={isOpen} onClick={() => flip(i)}>
          <Icon aria-hidden /><span className="pv-n">{number(i)}</span><span className="pv-fold-title">{s.title}</span><ChevronDown className="pv-chev" aria-hidden />
        </button></h3>
        {isOpen && <div className="pv-fold-body"><Body index={i} /></div>}
      </section>;
    })}
  </div>;
}

export function PolicyText({ version }: { version: PolicyVersion }) {
  if (version === "b") return <Rail />;
  if (version === "c") return <Folded />;
  return <Codex />;
}
