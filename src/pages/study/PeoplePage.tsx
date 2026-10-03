import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RefLink, StudyCredits, StudyHeader, StudySearch } from "@/components/study/StudyParts";
import { useCatalog } from "@/lib/catalog";
import { bookByNum, formatRange } from "@/lib/refs";
import { sectionColor } from "@/lib/sections";
import { loadPeople, loadPersonDetail, type PersonRow } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";
import { cn, formatNumber } from "@/lib/utils";

const PAGE = 60;
const SEX = { M: "Man", F: "Woman", G: "Group", "": "" } as const;

export default function PeoplePage() {
  const people = useAsync(loadPeople, "people");
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const byId = useMemo(() => new Map(people.status === "ready" ? people.value.map((p) => [p.id, p]) : []), [people]);
  const sameName = useMemo(() => {
    const counts = new Map<string, number>();
    if (people.status === "ready") for (const p of people.value) counts.set(p.n, (counts.get(p.n) ?? 0) + 1);
    return counts;
  }, [people]);
  const results = useMemo(() => {
    if (people.status !== "ready") return [];
    const words = query.trim().toLowerCase();
    const list = words
      ? people.value.filter((p) => p.n.toLowerCase().includes(words) || p.o.some((o) => o.toLowerCase().includes(words)) || p.b.toLowerCase().includes(words))
      : people.value;
    // Exact name matches first, then the most-named people.
    return [...list].sort((a, b) => Number(b.n.toLowerCase() === words) - Number(a.n.toLowerCase() === words) || b.c - a.c);
  }, [people, query]);
  const person = id ? byId.get(id) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <StudyHeader
        eyebrow="Study · People"
        title="Everyone in the Bible."
        lead={<p>3,130 people — who they were, their families, when they lived, and every verse that names them. Search by name, another name, or what they did.</p>}
      />
      {people.status === "loading" && <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}
      {people.status === "error" && <p className="text-muted">The people list could not be loaded.</p>}
      {people.status === "ready" && (
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className={cn(person && "hidden lg:block")}>
            <StudySearch
              value={query}
              onChange={(value) => {
                setQuery(value);
                setShown(PAGE);
              }}
              label="Name, e.g. Zechariah"
              count={results.length}
              total={people.value.length}
            />
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
              {results.slice(0, shown).map((p) => (
                <li key={p.id}>
                  <Link to={`/study/people/${p.id}`} aria-current={p.id === id ? "page" : undefined} className={cn("block px-3 py-2 hover:bg-surface-2", p.id === id && "bg-accent/15")}>
                    <span className="font-semibold">{p.n}</span>
                    {(sameName.get(p.n) ?? 1) > 1 && <span className="ms-1.5 text-xs text-muted">one of {sameName.get(p.n)}</span>}
                    <span className="block truncate text-sm text-muted">{p.b || p.d}</span>
                  </Link>
                </li>
              ))}
              {!results.length && <li className="px-3 py-6 text-center text-muted">No one matches.</li>}
            </ul>
            {results.length > shown && (
              <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className="mt-2 w-full rounded-xl bg-surface-2 py-2 text-sm">
                Show more ({formatNumber(results.length - shown)} left)
              </button>
            )}
          </div>
          <div>
            {person ? (
              <PersonCard key={person.id} person={person} byId={byId} sameName={sameName.get(person.n) ?? 1} onBack={() => navigate("/study/people")} />
            ) : id ? (
              <p className="text-muted">No person has that address.</p>
            ) : (
              <MostNamed people={people.value} />
            )}
          </div>
        </div>
      )}
      <StudyCredits>
        People, families, eras, descriptions and references: <cite>TIPNR — Translators Individualised Proper Names with all References</cite> by{" "}
        <a className="underline" href="https://www.stepbible.org" rel="noreferrer">
          STEP Bible
        </a>{" "}
        (STEPBible.org, based on work at Tyndale House Cambridge), licensed CC BY 4.0. STEP notes that its short summaries and articles were adapted from AI
        output (2024). Our changes: text shown without markup; family links matched to people by name and first verse (50 of 9,458 links could not be matched to
        exactly one person and are not shown); era names shortened; references checked against the King James text.
      </StudyCredits>
    </div>
  );
}

/** With nothing chosen: the twenty most-named people as a bar chart. */
function MostNamed({ people }: { people: PersonRow[] }) {
  const top = [...people].sort((a, b) => b.c - a.c).slice(0, 20);
  return (
    <figure className="rounded-2xl border border-line bg-surface p-4">
      <figcaption className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">The most-named people — verses that name them</figcaption>
      <ol className="space-y-1">
        {top.map((p) => (
          <li key={p.id} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2 text-sm">
            <Link to={`/study/people/${p.id}`} className="truncate text-right hover:text-accent">
              {p.n}
            </Link>
            <span className="h-3.5 rounded-sm bg-accent/70" style={{ width: `${(p.c / top[0].c) * 100}%` }} />
            <span className="tabular-nums text-muted">{formatNumber(p.c)}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

function PersonCard({ person, byId, sameName, onBack }: { person: PersonRow; byId: Map<string, PersonRow>; sameName: number; onBack: () => void }) {
  const catalog = useCatalog();
  const detail = useAsync(() => loadPersonDetail(person.id), `person:${person.id}`);
  const [refsShown, setRefsShown] = useState(40);
  const [full, setFull] = useState(false);
  const facts = [SEX[person.s], person.e && `lived in the time of ${person.e === "Judges" ? "the Judges" : person.e}`, person.t].filter(Boolean).join(" · ");

  return (
    <article aria-labelledby="person-name" className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <button type="button" onClick={onBack} className="mb-3 text-sm text-muted hover:text-accent lg:hidden">
        ← All people
      </button>
      <h2 id="person-name" className="font-serif text-3xl font-semibold">
        {person.n}
      </h2>
      {person.o.length > 0 && <p className="text-sm text-muted">Also called {person.o.join(", ")}</p>}
      <p className="mt-1 text-sm text-muted">
        {facts}
        {sameName > 1 && ` · one of ${sameName} people named ${person.n}`}
      </p>
      {person.b && <p className="mt-3 text-lg">{person.b}</p>}

      <FamilyTree person={person} byId={byId} />
      <MentionsByBook person={person} />

      {detail.status === "ready" && detail.value && (
        <>
          {(detail.value.short || detail.value.article) && (
            <div className="mt-5 space-y-2 text-[0.95rem] leading-relaxed">
              {(full ? detail.value.article || detail.value.short : detail.value.short || detail.value.article)
                .split("\n")
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              {detail.value.article && detail.value.short && (
                <button type="button" onClick={() => setFull(!full)} className="text-sm text-accent underline">
                  {full ? "Shorter" : "Read more"}
                </button>
              )}
            </div>
          )}
          <h3 className="mb-1.5 mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Every verse that names {person.n} · {detail.value.refs.length}</h3>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {detail.value.refs.slice(0, refsShown).map((ref) => (
              <RefLink key={ref} span={[ref, ref]} label={formatRange(catalog, ref, ref)} />
            ))}
          </p>
          {detail.value.refs.length > refsShown && (
            <button type="button" onClick={() => setRefsShown((n) => n + 200)} className="mt-2 text-sm text-accent underline">
              Show more ({detail.value.refs.length - refsShown} left)
            </button>
          )}
        </>
      )}
    </article>
  );
}

function PersonLink({ id, byId }: { id: string; byId: Map<string, PersonRow> }) {
  const p = byId.get(id);
  if (!p) return null;
  return (
    <Link to={`/study/people/${id}`} className="inline-block rounded-full border border-line bg-page px-2.5 py-0.5 text-sm hover:border-accent hover:text-accent" title={p.b}>
      {p.n}
    </Link>
  );
}

/** Parents above; the person with brothers, sisters and spouses; children below. */
function FamilyTree({ person, byId }: { person: PersonRow; byId: Map<string, PersonRow> }) {
  if (!person.pa.length && !person.si.length && !person.sp.length && !person.ch.length) return null;
  const Row = ({ label, ids }: { label: string; ids: string[] }) =>
    ids.length ? (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="w-full text-center text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span>
        {ids.map((id) => (
          <PersonLink key={id} id={id} byId={byId} />
        ))}
      </div>
    ) : null;
  return (
    <section aria-label="Family" className="mt-5 space-y-2 rounded-xl bg-page/60 p-3">
      <Row label="Parents" ids={person.pa} />
      {person.pa.length > 0 && <div className="mx-auto h-3 w-px bg-line" aria-hidden />}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="rounded-full bg-ink px-3 py-0.5 text-sm font-semibold text-page">{person.n}</span>
        {person.sp.map((id) => (
          <span key={id} className="flex items-center gap-1 text-xs text-muted">
            married to <PersonLink id={id} byId={byId} />
          </span>
        ))}
      </div>
      <Row label="Brothers and sisters" ids={person.si} />
      {person.ch.length > 0 && <div className="mx-auto h-3 w-px bg-line" aria-hidden />}
      <Row label="Children" ids={person.ch} />
    </section>
  );
}

/** One bar per book of the Bible, Genesis to Revelation: where this person is named. */
function MentionsByBook({ person }: { person: PersonRow }) {
  const catalog = useCatalog();
  const [hover, setHover] = useState("");
  const counts = Object.entries(person.k).map(([num, n]) => [Number(num), n] as const);
  if (!counts.length) return null;
  const max = Math.max(...counts.map(([, n]) => n));
  const books = catalog.books.filter((b) => b.num <= 66);
  return (
    <figure className="mt-5">
      <div className="flex h-14 items-end gap-px" role="img" aria-label={`Named in: ${counts.map(([num, n]) => `${bookByNum(catalog, num)?.name} ${n}`).join(", ")}`}>
        {books.map((b) => {
          const n = person.k[String(b.num)] ?? 0;
          return (
            <span
              key={b.code}
              onMouseEnter={() => setHover(`${b.name}: ${n}`)}
              className={cn("flex-1 rounded-t-[1px]", !n && "opacity-20")}
              style={{ height: n ? `${Math.max(8, (n / max) * 100)}%` : "2px", background: sectionColor(b.section) }}
            />
          );
        })}
      </div>
      <figcaption className="mt-1 text-xs text-muted">{hover || "Where they are named, Genesis to Revelation. Point at a bar."}</figcaption>
    </figure>
  );
}
