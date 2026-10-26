// MOCK-UP: the Support page's three question layouts, at /support_mockup on this computer's preview only (A tiles that
// open their answer beneath, B a search over the list, C a question menu beside the answer), switched by the pill
// (?v=a|b|c). The owner chose A, Tiles, for /support (2026-10-25); the page itself is legal/SupportView.tsx.
import { Search, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CONTACT_ADDRESS } from "@/pages/legal/privacy-content";
import { META, QUESTIONS } from "@/pages/legal/support-content";
import { Answer, Tiles } from "@/pages/legal/SupportQuestions";
import { SupportView } from "@/pages/legal/SupportView";
import { VersionPill } from "./VersionPill";

type SupportVersion = "a" | "b" | "c";

const VERSIONS: { id: SupportVersion; name: string }[] = [
  { id: "a", name: "Tiles" },
  { id: "b", name: "Search" },
  { id: "c", name: "Menu" },
];

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

export default function SupportMockup() {
  const [params] = useSearchParams();
  const version = VERSIONS.find((v) => v.id === params.get("v"))?.id ?? "a";
  return (
    <SupportView questions={version === "b" ? <SearchList /> : version === "c" ? <Menu /> : <Tiles />}>
      <VersionPill label="Questions layout" versions={VERSIONS} current={version} />
    </SupportView>
  );
}
