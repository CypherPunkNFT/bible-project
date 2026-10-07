import { useState } from "react";
import { Link } from "react-router-dom";
import { cameFrom } from "@/lib/came-from";
import { RefLink } from "@/components/study/StudyParts";
import { useCatalog } from "@/lib/catalog";
import { periodLabel } from "@/lib/people-periods";
import { bookByNum, formatRange } from "@/lib/refs";
import { sectionColor } from "@/lib/sections";
import type { Person, PersonRow } from "@/lib/study";
import { cn } from "@/lib/utils";

const SEX = { M: "Man", F: "Woman", G: "Group", "": "" } as const;

/** One person's page body: who they were, their family, where Scripture names them, their story and every verse. */
export function PersonProfile({ person, byId, sameName }: { person: Person; byId: Map<string, PersonRow>; sameName: number }) {
  const catalog = useCatalog();
  const [refsShown, setRefsShown] = useState(40);
  const [full, setFull] = useState(false);
  const facts = [SEX[person.s], person.p && periodLabel(person.p), person.t].filter(Boolean).join(" · ");
  return <>
    <header>
      <h1 id="person-name" className="font-serif text-4xl font-semibold sm:text-5xl">{person.n}</h1>
      {person.o.length > 0 && <p className="mt-2 text-sm text-muted">Also called {person.o.join(", ")}</p>}
      <p className="mt-1 text-sm text-muted">{facts}{sameName > 1 && ` · one of ${sameName} people named ${person.n}`}</p>
      {person.b && <p className="mt-4 max-w-3xl text-lg">{person.b}</p>}
    </header>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        {(person.short || person.article) && <section className="space-y-3 text-[0.98rem] leading-relaxed">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Their story</h2>
          {(full ? person.article || person.short : person.short || person.article).split("\n").filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
          {person.article && person.short && <button type="button" onClick={() => setFull(!full)} className="text-sm text-accent underline">{full ? "Shorter" : "Read more"}</button>}
        </section>}
        <h2 className="mb-1.5 mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Every verse that names {person.n} · {person.refs.length}</h2>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">{person.refs.slice(0, refsShown).map((ref) => <RefLink key={ref} span={[ref, ref]} label={formatRange(catalog, ref, ref)} />)}</p>
        {person.refs.length > refsShown && <button type="button" onClick={() => setRefsShown((n) => n + 200)} className="mt-2 text-sm text-accent underline">Show more ({person.refs.length - refsShown} left)</button>}
      </div>
      <aside className="space-y-6">
        <FamilyTree person={person} byId={byId} />
        <MentionsByBook person={person} />
      </aside>
    </div>
  </>;
}

/** A relative: their own page, with this person as the way back. */
function PersonLink({ id, byId, from }: { id: string; byId: Map<string, PersonRow>; from: string }) {
  const p = byId.get(id);
  if (!p) return null;
  return <Link to={`/people/${id}`} state={cameFrom(from)} className="inline-block rounded-full border border-line bg-page px-2.5 py-0.5 text-sm hover:border-accent hover:text-accent" title={p.b}>{p.n}</Link>;
}

/** Parents above; the person with brothers, sisters and spouses; children below. */
function FamilyTree({ person, byId }: { person: Person; byId: Map<string, PersonRow> }) {
  if (!person.pa.length && !person.si.length && !person.sp.length && !person.ch.length) return null;
  const Row = ({ label, ids }: { label: string; ids: string[] }) => ids.length ? <div className="flex flex-wrap items-center justify-center gap-1.5">
    <span className="w-full text-center text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span>
    {ids.map((id) => <PersonLink key={id} id={id} byId={byId} from={person.n} />)}
  </div> : null;
  return <section aria-label="Family" className="space-y-2 rounded-xl border border-line bg-surface p-4">
    <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Family</h2>
    <Row label="Parents" ids={person.pa} />
    {person.pa.length > 0 && <div className="mx-auto h-3 w-px bg-line" aria-hidden />}
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <span className="rounded-full bg-ink px-3 py-0.5 text-sm font-semibold text-page">{person.n}</span>
      {person.sp.map((id) => <span key={id} className="flex items-center gap-1 text-xs text-muted">married to <PersonLink id={id} byId={byId} from={person.n} /></span>)}
    </div>
    <Row label="Brothers and sisters" ids={person.si} />
    {person.ch.length > 0 && <div className="mx-auto h-3 w-px bg-line" aria-hidden />}
    <Row label="Children" ids={person.ch} />
  </section>;
}

/** One bar per book of the Bible, Genesis to Revelation: where this person is named. */
function MentionsByBook({ person }: { person: Person }) {
  const catalog = useCatalog();
  const [hover, setHover] = useState("");
  const counts = Object.entries(person.k).map(([num, n]) => [Number(num), n] as const);
  if (!counts.length) return null;
  const max = Math.max(...counts.map(([, n]) => n));
  const books = catalog.books.filter((b) => b.num <= 66);
  return <figure className="rounded-xl border border-line bg-surface p-4">
    <figcaption className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Where they are named</figcaption>
    <div className="flex h-14 items-end gap-px" role="img" aria-label={`Named in: ${counts.map(([num, n]) => `${bookByNum(catalog, num)?.name} ${n}`).join(", ")}`}>
      {books.map((b) => {
        const n = person.k[String(b.num)] ?? 0;
        return <span key={b.code} onMouseEnter={() => setHover(`${b.name}: ${n}`)} className={cn("flex-1 rounded-t-[1px]", !n && "opacity-20")} style={{ height: n ? `${Math.max(8, (n / max) * 100)}%` : "2px", background: sectionColor(b.section) }} />;
      })}
    </div>
    <p className="mt-1 text-xs text-muted">{hover || "Genesis to Revelation. Point at a bar."}</p>
  </figure>;
}
