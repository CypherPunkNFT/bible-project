import { useRef, useState } from "react";
import { STUDY_BRANCHES } from "./collections";
import { Icon, StudyLink } from "./shared";
const entries = Object.entries(STUDY_BRANCHES).flatMap(([id, b]) => b.areas.flatMap(a => [
    { title: a.title, text: a.hint, kind: b.label, href: `/study/${id}?area=${a.id}` },
    ...[a.featured, ...a.items].map(e => ({ ...e, kind: `${b.label} · ${e.kind}` })),
]));
entries.push({ title: "Writers of Scripture", text: "Paul Luke Moses David Isaiah John", kind: "People", href: "/study/theology?area=people#writer-preview" }, { title: "Scholars", text: "Historians translators archaeology theologians Josephus Tacitus", kind: "People", href: "/teachers/scholars" }, { title: "Atlas", text: "Places journeys maps ancient cities geography Paul", kind: "Shared collection", href: "/study/atlas" });
export function HubSearch() {
    const [query, setQuery] = useState("");
    const input = useRef<HTMLInputElement>(null);
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean), seen = new Set<string>();
    const results = words.length ? entries.filter(e => { if (seen.has(e.href) || !words.every(w => `${e.title} ${e.text} ${e.kind}`.toLowerCase().includes(w)))
        return false; seen.add(e.href); return true; }) : [];
    const clear = () => { setQuery(""); input.current?.focus(); };
    return <><div className="finder"><label htmlFor="study-search">Find your starting point</label><div className="search-field"><Icon name="search"/><input ref={input} id="study-search" type="search" placeholder="A passage, subject or question…" autoComplete="off" aria-controls="search-results" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Escape")
        clear(); }}/><button type="button" id="clear-search" aria-label="Clear search" hidden={!query} onClick={clear}><Icon name="x"/></button></div><p className="search-hint">Try {['prayer', 'Gospels', 'manuscripts'].map((q, i) => <span key={q}>{i === 1 ? ', ' : i === 2 ? ' or ' : ''}<button onClick={() => { setQuery(q); input.current?.focus(); }}>{q}</button></span>)}.</p></div>
 <section id="search-results" className="search-results" aria-label="Study search results" hidden={!words.length}><div className="results-head"><h2>Find a study</h2><p role="status" aria-live="polite">{results.length} {results.length === 1 ? 'result' : 'results'}</p></div><div id="result-list">{results.map(e => <StudyLink key={e.href} to={e.href}><span><small>{e.kind}</small><strong>{e.title}</strong><p>{e.text}</p></span><Icon name="arrowUp"/></StudyLink>)}{!results.length && <p className="empty-result">No match yet. Try a broader subject, such as prayer, history or manuscripts.</p>}</div></section></>;
}
