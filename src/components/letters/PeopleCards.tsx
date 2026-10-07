import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import { loadPersonDetail, studyRefLink } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";
import type { Network, Span } from "@/data/letters/types";
import { ClaimText, Refs } from "./LetterParts";

type Person = { id: string; label: string; note?: string; refs: Span[]; personId?: string; links: string[]; group?: string };

/** Everyone in a network as a card: what the letter says of them, their verses, and (for letter networks) which letters name them. */
function peopleOf(network: Network): Person[] {
  const letters = new Map(network.nodes.filter((n) => n.group === "letter").map((n) => [n.id, n.label]));
  // Paul writes these letters; the cards are about the people around him.
  return network.nodes.filter((n) => n.group !== "letter" && n.label !== "Paul").map((n) => {
    const edges = network.edges.filter((e) => e.from === n.id || e.to === n.id);
    const words = edges.map((e) => e.label).filter((l): l is string => Boolean(l));
    const refs = [...(n.refs ?? []), ...edges.flatMap((e) => e.refs ?? [])];
    const unique = [...new Map(refs.map((r) => [r.join("-"), r])).values()];
    const linkedLetters = edges.map((e) => letters.get(e.from === n.id ? e.to : e.from)).filter((l): l is string => Boolean(l));
    return { id: n.id, label: n.label, group: n.group, personId: n.personId, refs: unique, links: linkedLetters.length ? linkedLetters : words,
      note: n.note };
  });
}

/**
 * The people of a passage or a set of letters as cards rather than a graph: each card says what the text says of
 * them and holds their verses; choosing one opens a panel with who they were and where else Scripture names them.
 */
export function PeopleCards({ network }: { network: Network }) {
  const people = peopleOf(network);
  const [open, setOpen] = useState<Person | null>(null);
  const groups = [...new Set(people.map((p) => p.group).filter(Boolean))] as string[];
  return <div>
    <ul className="lg-people">
      {people.map((p) => <li key={p.id}>
        <button type="button" className="lg-person" onClick={() => setOpen(p)} aria-haspopup="dialog">
          <span className="lg-person-name">{p.label}</span>
          {p.note && <span className="lg-person-note">{p.note}</span>}
          {p.links.length > 0 && <span className="lg-person-tags">{p.links.slice(0, 4).map((l) => <span key={l}>{l}</span>)}</span>}
          {groups.length > 1 && p.group && <span className="lg-person-group">{p.group}</span>}
        </button>
        <Refs refs={p.refs} limit={3} />
      </li>)}
    </ul>
    <ClaimText claim={network.claim} className="lg-caption" />
    {open && <PersonPanel person={open} onClose={() => setOpen(null)} />}
  </div>;
}

/** A dialog: the text's own words about the person, then who they were and every book that names them (STEP Bible). */
function PersonPanel({ person, onClose }: { person: Person; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="lg-dialog" onClose={onClose} onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }} aria-labelledby="lg-person-title">
    <div className="lg-dialog-body">
      <header><p className="lg-kicker">Person</p><h3 id="lg-person-title" className="lg-title">{person.label}</h3>
        <button type="button" className="lg-dialog-close" onClick={() => dialog.current?.close()} aria-label="Close">×</button></header>
      {person.note && <p className="lg-claim" style={{ marginTop: ".75rem" }}>{person.note}</p>}
      {person.links.length > 0 && <p className="lg-muted" style={{ marginTop: ".5rem", fontSize: ".85rem" }}>{person.links.join(" · ")}</p>}
      <p className="lg-subhead" style={{ marginTop: "1.25rem" }}>In this letter</p>
      <Refs refs={person.refs} limit={20} />
      {person.personId ? <PersonRecord id={person.personId} /> : <p className="lg-muted" style={{ marginTop: "1.25rem", fontSize: ".85rem" }}>No single record for this name (a group, a household, or more than one person).</p>}
    </div>
  </dialog>;
}

function PersonRecord({ id }: { id: string }) {
  const catalog = useCatalog();
  const detail = useAsync(() => loadPersonDetail(id), `person:${id}`);
  if (detail.status === "loading") return <p className="lg-muted" style={{ marginTop: "1rem" }}>Loading…</p>;
  if (detail.status === "error") return <p className="lg-muted" style={{ marginTop: "1rem" }}>Their record could not be loaded.</p>;
  const p = detail.value;
  const books = Object.entries(p.k).map(([num, count]) => ({ book: bookByNum(catalog, Number(num)), count })).filter((b) => b.book);
  const firstIn = (num: number) => p.refs.find((r) => Math.floor(r / 1_000_000) === num);
  return <div style={{ marginTop: "1.25rem" }}>
    <p className="lg-subhead">Who they were</p>
    {p.short && <p className="lg-claim">{p.short}</p>}
    {p.article && p.article !== p.short && <details className="lg-more"><summary>Read more</summary>{p.article.split("\n").filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}</details>}
    <p className="lg-subhead" style={{ marginTop: "1.25rem" }}>Named in {books.length} {books.length === 1 ? "book" : "books"}</p>
    <div className="lg-chips" style={{ marginTop: 0 }}>{books.map(({ book, count }) => {
      const first = firstIn(book!.num);
      return first ? <Link key={book!.num} className="lg-chip" to={studyRefLink(catalog, [first, first])}>{book!.name} · {count}</Link>
        : <span key={book!.num} className="lg-chip">{book!.name} · {count}</span>;
    })}</div>
    <p style={{ marginTop: "1.25rem", fontSize: ".85rem" }}><Link to={`/study/people/${id}`} style={{ color: "var(--lg)" }}>Open their page in People & relationships →</Link></p>
    <p className="lg-caption">Description and references from STEP Bible's TIPNR, <a href="https://www.stepbible.org" target="_blank" rel="noreferrer">www.STEPBible.org</a> (CC BY 4.0).</p>
  </div>;
}
