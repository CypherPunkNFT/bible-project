import { ArrowLeft } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { cameFrom } from "@/lib/came-from";
import { StudyCredits, StudyHeader } from "@/components/study/StudyParts";
import { loadPeople, type PersonRow } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";
import { formatNumber } from "@/lib/utils";
import { StudyContents } from "@/components/study/StudyContents";
import { GenealogyExplorer } from "@/components/study/GenealogyExplorer";
import { PeopleCatalog } from "@/components/study/PeopleCatalog";
import { ProphetsContent } from "./ProphetsPage";

type View = "everyone" | "families" | "prophets";

/** People & genealogies: everyone in the Bible (most named, then the full table) until a card opens the family trees
 *  or the prophets. Each person opens on their own page (/people/:id). */
export default function PeoplePage() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const asked = params.get("view");
  // "#people-directory" is the People & families card's older address.
  const view: View = asked === "prophets" ? "prophets" : asked === "families" || (!asked && hash === "#people-directory") ? "families" : "everyone";
  const show = (next: View) => {
    const search = new URLSearchParams(params);
    if (next === "everyone") search.delete("view"); else search.set("view", next);
    setParams(search, { preventScrollReset: true });
  };
  return <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
    <StudyHeader eyebrow="Study · People & genealogies" title="Lives woven through Scripture."
      lead={<p>Everyone the Bible names, in the order of its history. Open a life, follow the families, or trace the prophets through the eras Scripture gives them.</p>}
      contents={<StudyContents selectedId={view === "families" ? "people-directory" : view === "prophets" ? "prophets" : undefined} onSelect={(id) => show(id === "prophets" ? "prophets" : "families")} />} />
    {view !== "everyone" && <button type="button" onClick={() => show("everyone")} className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-accent"><ArrowLeft size={15} aria-hidden />Everyone in the Bible</button>}
    {/* The contents cards switch the view with the study's transition (components/study/study-view.ts). */}
    <div className="people-view-window"><div key={view} data-study-panel className="people-view-panel">
      {view === "prophets" ? <ProphetsContent embedded /> : view === "families" ? <GenealogyExplorer /> : <Everyone />}
    </div></div>
  </div>;
}

function Everyone() {
  const people = useAsync(loadPeople, "people");
  return <>
    {people.status === "loading" && <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />}
    {people.status === "error" && <p className="text-muted">The people list could not be loaded.</p>}
    {people.status === "ready" && <><MostNamed people={people.value} /><PeopleCatalog people={people.value} backLabel="People & genealogies" /></>}
    <StudyCredits>
      People, families, eras, descriptions and references: <cite>TIPNR — Translators Individualised Proper Names with all References</cite> by{" "}
      <a className="underline" href="https://www.stepbible.org" rel="noreferrer">STEP Bible</a>{" "}
      (STEPBible.org, based on work at Tyndale House Cambridge), licensed CC BY 4.0. STEP notes that its short summaries and articles were adapted from AI
      output (2024). Our changes: text shown without markup; family links matched to people by name and first verse (50 of 9,458 links could not be matched to
      exactly one person and are not shown); era names shortened and grouped into periods; references checked against the King James text.
    </StudyCredits>
  </>;
}

/** The twenty most-named people, as a bar chart; each name opens that person's page. */
function MostNamed({ people }: { people: PersonRow[] }) {
  const top = [...people].sort((a, b) => b.c - a.c).slice(0, 20);
  return <figure className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
    <figcaption className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">The most-named people — verses that name them</figcaption>
    <ol className="grid gap-x-8 gap-y-1 md:grid-cols-2">
      {top.map((p) => <li key={p.id} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2 text-sm">
        <Link to={`/people/${p.id}`} state={cameFrom("People & genealogies")} className="truncate text-right hover:text-accent">{p.n}</Link>
        <span className="h-3.5 rounded-sm bg-accent/70" style={{ width: `${(p.c / top[0].c) * 100}%` }} />
        <span className="tabular-nums text-muted">{formatNumber(p.c)}</span>
      </li>)}
    </ol>
  </figure>;
}
