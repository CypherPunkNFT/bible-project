import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cameFrom } from "@/lib/came-from";
import { nameLinkFor } from "@/data/baby-names";
import { SlideLink } from "@/components/people-pages/SlideLink";
import { WindowedRows } from "@/components/WindowedRows";
import { useCarried } from "@/components/people-pages/use-carried";
import { RefLink } from "@/components/study/StudyParts";
import { useCatalog } from "@/lib/catalog";
import { apostleFor, personPath, prophetFor, rulerFor } from "@/lib/people-pages-index";
import { periodLabel } from "@/lib/people-periods";
import { bookByNum, formatRange } from "@/lib/refs";
import { sectionColor } from "@/lib/sections";
import { loadPeopleBriefs, type Person, type PersonName, type PersonStory } from "@/lib/study";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/site-format";

const SEX = { M: "Man", F: "Woman", G: "Group", "": "" } as const;

/** One person's page body: who they were, their family, where Scripture names them, their story and every verse. */
export function PersonProfile({ person, byId, sameName, switcher, entry }: { person: Person; byId: Map<string, PersonName>; sameName: number; switcher?: ReactNode; entry?: ReactNode }) {
  const catalog = useCatalog();
  const [full, setFull] = useState(false);
  const facts = [SEX[person.s], person.p && periodLabel(person.p), person.t].filter(Boolean).join(" · ");
  const story = Boolean(person.story || person.short || person.article);
  return <>
    {/* A ruler's or apostle's page is one click away: the switch under the name and, beside it, the entry card. */}
    <header className={entry ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:items-start" : undefined}>
      <div className="min-w-0">
        <h1 id="person-name" className="font-serif text-4xl font-semibold sm:text-5xl">{person.n}</h1>
        {person.o.length > 0 && <p className="mt-2 text-sm text-muted">{`Also called ${person.o.join(", ")}`}</p>}
        <NameLink person={person} />
        <p className="mt-1 text-sm text-muted">{facts}{sameName > 1 && ` · one of ${sameName} people named ${person.n}`}</p>
        {person.b && <p className="mt-4 max-w-3xl text-lg">{person.b}</p>}
        {person.note && <p className="mt-2 max-w-3xl text-sm text-muted">{person.note}</p>}
        {!story && <DescriptionCredit person={person} />}
        {switcher && <div className="mt-5">{switcher}</div>}
      </div>
      {entry}
    </header>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        {person.story ? <SiteStory id={person.id} story={person.story} />
          : (person.short || person.article) && <section className="space-y-3 text-[0.98rem] leading-relaxed">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Their story</h2>
          {(full ? person.article || person.short : person.short || person.article).split("\n").filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
          {person.article && person.short && <button type="button" onClick={() => setFull(!full)} className="text-sm text-accent underline">{full ? "Shorter" : "Read more"}</button>}
          <DescriptionCredit person={person} />
        </section>}
        <h2 className="mb-1.5 mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{`Every verse that names ${person.n} · ${formatNumber(person.refs.length)}`}</h2>
        {/* Every verse, in rows of links drawn as the reader scrolls: no "Show more" (owner's scroll rule, 2026-11-17). */}
        <WindowedRows className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-x-3 gap-y-1 text-sm" items={person.refs} itemKey={String} estimate={20}
          renderItem={(ref, row) => <span key={ref} data-row={row}><RefLink span={[ref, ref]} label={formatRange(catalog, ref, ref)} /></span>} />
      </div>
      <aside className="space-y-6">
        <FamilyTree person={person} byId={byId} />
        <MentionsByBook person={person} />
      </aside>
    </div>
  </>;
}

/** "The name Hannah: meaning and everyone who bore it", to the Biblical baby names page (docs/features/baby-names/design.md 6.5). */
function NameLink({ person }: { person: Person }) {
  const link = nameLinkFor(person);
  return link && <div className="mt-2 text-sm"><Link to={link.path} className="text-accent underline underline-offset-2">{`The name ${link.name}: meaning and everyone who bore it`}</Link></div>;
}

/** The site's own story from Scripture (content/people/stories/): the short line, then, on "Read more", each paragraph
 *  with the verses it rests on as links into the reader. */
function SiteStory({ id, story }: { id: string; story: PersonStory }) {
  const [full, setFull] = useState(false);
  return <section className="space-y-3 text-[0.98rem] leading-relaxed">
    <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Their story</h2>
    <p>{story.short}</p>
    {full && story.paragraphs.map((para, i) => <div key={i}>
      <p>{para.text}</p>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">{para.refs.map((span, j) => <RefLink key={j} span={span} />)}</p>
    </div>)}
    {story.paragraphs.length > 0 && <button type="button" onClick={() => setFull(!full)} className="text-sm text-accent underline">{full ? "Shorter" : "Read more"}</button>}
    <SiteStoryCredit id={id} />
  </section>;
}

const RULE_PAGE = { judge: "judge", leader: "leader", governor: "governorship", herod: "rule", roman: "rule" } as Record<string, string>;

/** Credit for the site's story, pointing to the reign, mission or word page, where the sources are. */
function SiteStoryCredit({ id }: { id: string }) {
  const carried = useCarried();
  const ruler = rulerFor(id), apostle = apostleFor(id), prophet = prophetFor(id);
  const page = ruler ? { to: personPath(ruler.id, "rule"), label: `${RULE_PAGE[ruler.kind] ?? "reign"} page` }
    : apostle ? { to: personPath(apostle.id, "mission"), label: "mission page" }
    : prophet ? { to: personPath(prophet.id, "word"), label: "word page" } : undefined;
  return <p className="mt-2 text-xs text-muted">
    Written by this site from Scripture
    {page && <> · sources on the <SlideLink to={page.to} state={carried} className="underline decoration-line underline-offset-2 hover:text-accent">{page.label}</SlideLink></>}
  </p>;
}

/** Who wrote the description: STEP Bible's AI-adapted text (and whether this site corrected it), or this site. */
function DescriptionCredit({ person }: { person: Person }) {
  if (!person.b && !person.short && !person.article) return null;
  return <p className="mt-2 text-xs text-muted" title={person.fx?.length ? `Corrected: ${person.fx.join(", ")}` : undefined}>
    {person.added ? "Record added by this site" : person.fx?.length ? "Description adapted by STEP Bible from AI output (Claude 3 Opus, 2024) · corrected by this site" : "Description adapted by STEP Bible from AI output (Claude 3 Opus, 2024)"}
  </p>;
}

/** A relative: their own page, with this person as the way back. */
function PersonLink({ id, byId, briefs, from }: { id: string; byId: Map<string, PersonName>; briefs: Map<string, string> | null; from: string }) {
  const p = byId.get(id);
  if (!p) return null;
  return <Link to={`/people/${id}`} state={cameFrom(from)} className="inline-block rounded-full border border-line bg-page px-2.5 py-0.5 text-sm hover:border-accent hover:text-accent" title={p.b ?? briefs?.get(id)}>{p.n}</Link>;
}

/** The relatives' one-line briefs (their links' tooltips), read once the family box nears the screen: the person page's
 *  list leaves them out (src/lib/study.ts loadPeopleNames). Null until they arrive, or when every relative has one. */
function useRelativeBriefs(ids: string[], byId: Map<string, PersonName>) {
  const box = useRef<HTMLElement>(null);
  const [briefs, setBriefs] = useState<Map<string, string> | null>(null);
  const wanted = ids.some((id) => byId.get(id)?.b === undefined);
  useEffect(() => {
    const element = box.current;
    if (!wanted || briefs || !element) return;
    let live = true;
    const read = () => loadPeopleBriefs().then((found) => { if (live) setBriefs(found); })
      .catch((error: unknown) => console.warn("the family links' briefs could not be loaded", error));
    if (!("IntersectionObserver" in window)) { void read(); return () => { live = false; }; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); void read(); }
    }, { rootMargin: "300px 0px" });
    observer.observe(element);
    return () => { live = false; observer.disconnect(); };
  }, [wanted, briefs]);
  return { box, briefs };
}

/** Parents above; the person with brothers, sisters and spouses; children below. */
function FamilyTree({ person, byId }: { person: Person; byId: Map<string, PersonName> }) {
  const { box, briefs } = useRelativeBriefs([...person.pa, ...person.si, ...person.sp, ...person.ch], byId);
  if (!person.pa.length && !person.si.length && !person.sp.length && !person.ch.length) return null;
  const Row = ({ label, ids }: { label: string; ids: string[] }) => ids.length ? <div className="flex flex-wrap items-center justify-center gap-1.5">
    <span className="w-full text-center text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span>
    {ids.map((id) => <PersonLink key={id} id={id} byId={byId} briefs={briefs} from={person.n} />)}
  </div> : null;
  return <section ref={box} aria-label="Family" className="space-y-2 rounded-xl border border-line bg-surface p-4">
    <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Family</h2>
    <Row label="Parents" ids={person.pa} />
    {person.pa.length > 0 && <div className="mx-auto h-3 w-px bg-line" aria-hidden />}
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <span className="rounded-full bg-ink px-3 py-0.5 text-sm font-semibold text-page">{person.n}</span>
      {person.sp.map((id) => <span key={id} className="flex items-center gap-1 text-xs text-muted">married to <PersonLink id={id} byId={byId} briefs={briefs} from={person.n} /></span>)}
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
