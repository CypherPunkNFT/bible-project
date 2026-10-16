import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { BackLink } from "@/components/BackLink";
import { AspectSwitch, EntryCard } from "@/components/people-pages/PersonEntry";
import { readyKey, usePeoplePageSlide } from "@/components/people-pages/usePeoplePageSlide";
import { PersonProfile } from "@/components/study/PersonProfile";
import { StudyCredits } from "@/components/study/StudyParts";
import { useCachedLoad } from "@/lib/people-pages";
import { isApostleEndpoint, isAspect, personPath, specialPageOf, type Aspect } from "@/lib/people-pages-index";
import { personIdOf, slugOf } from "@/lib/people-slugs";
import { loadPeople, loadPersonDetail } from "@/lib/study";

type SpecialPages = typeof import("@/components/people-pages/SpecialPages");
let specialPages: SpecialPages | undefined;
const loadSpecialPages = () => import("@/components/people-pages/SpecialPages").then((module) => (specialPages = module));

/** The ruler, apostle and prophet pages' code, loaded only when one opens (kept after, so a page wipe never waits on it twice). */
function useSpecialPages(wanted: boolean): SpecialPages | undefined {
  const [, setLoaded] = useState(0);
  useEffect(() => {
    if (!wanted || specialPages) return;
    let live = true;
    void loadSpecialPages().then(() => { if (live) setLoaded((n) => n + 1); });
    return () => { live = false; };
  }, [wanted]);
  return specialPages;
}

/** The page for one person (/people/:id), reached from the People table, the family tree, Topics or search; and, for a
 *  ruler, an apostle or a prophet, their other pages (/people/:id/rule, /people/:id/mission, /people/:id/word). The back
 *  link names wherever the visitor came from; the switch between the pages carries that along. */
export default function PersonPage() {
  const { id: segment = "", aspect: asked } = useParams();
  // /people/peter and /people/peter-mat-4-18 are the same person; the readable address is the one shown.
  const id = personIdOf(segment);
  const { state } = useLocation();
  const askedAspect: Aspect | undefined = isAspect(asked) ? asked : undefined;
  // The Twelve, Matthias and Paul: their person address is their one page (the apostle page).
  const endpoint = isApostleEndpoint(id);
  const aspect: Aspect | undefined = endpoint && !asked ? "mission" : askedAspect;
  const slide = usePeoplePageSlide();
  const people = useCachedLoad("people", loadPeople);
  const detail = useCachedLoad(`person:${id}`, () => loadPersonDetail(id));
  const special = aspect ? specialPageOf(id, aspect) : undefined;
  const pages = useSpecialPages(Boolean(special));
  const byId = useMemo(() => new Map(people.status === "ready" ? people.value.map((p) => [p.id, p]) : []), [people]);
  const row = byId.get(id);
  const sameName = useMemo(() => people.status === "ready" && row ? people.value.filter((p) => p.n === row.n).length : 1, [people, row]);

  // An address with no such page goes to the person page; another record of the same person goes to the main one.
  if ((asked && !askedAspect) || (aspect && !special)) return <Navigate to={personPath(id)} replace state={state} />;
  if (!asked && slugOf(id) && segment !== slugOf(id)) return <Navigate to={personPath(id)} replace state={state} />;
  if (endpoint && askedAspect === "mission") return <Navigate to={personPath(id)} replace state={state} />;
  if (special && special.id !== id) return <Navigate to={personPath(special.id, aspect)} replace state={state} />;
  if (detail.status === "ready" && detail.value.same) return <Navigate to={personPath(detail.value.same, aspect)} replace state={state} />;

  const sex = detail.status === "ready" ? detail.value.s : "";
  // The Twelve, Matthias and Paul have the full-width apostle page (components/apostle-page); the wider circle keeps theirs.
  const twelve = special?.aspect === "mission" && special.summary.group.startsWith("apostles-");
  if (special && aspect) return <div className={twelve ? undefined : "mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6"} onClickCapture={slide}>
    <div className="people-page-slide">
      {!pages ? <div className="h-96 animate-pulse rounded-2xl bg-surface-2" role="status" aria-label="Loading" />
        : aspect === "rule" ? <pages.RulerPage id={special.id} sex={sex} /> : twelve ? <pages.ApostleMissionPage id={special.id} />
        : aspect === "mission" ? <pages.ApostlePage id={special.id} /> : <pages.ProphetPage id={special.id} sex={sex} />}
    </div>
  </div>;

  const ready = row && detail.status === "ready";
  return <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6" onClickCapture={slide}>
    <div className="people-page-slide" data-people-ready={ready ? readyKey({ kind: "person", id }) : undefined}>
      <BackLink fallback={{ path: "/study/people", label: "People & genealogies" }} />
      <article aria-labelledby="person-name" className="mt-6">
        {people.status === "ready" && !row ? <p className="text-muted">No person has that address.</p>
          : row && detail.status === "ready" ? <PersonProfile person={{ ...row, ...detail.value }} byId={byId} sameName={sameName}
            switcher={<AspectSwitch id={id} name={row.n} />} entry={<EntryCard id={id} sex={detail.value.s} />} />
          : people.status === "error" || detail.status === "error" ? <p className="text-muted">This person's details could not be loaded.</p>
          : <div className="h-96 animate-pulse rounded-2xl bg-surface-2" role="status" aria-label="Loading" />}
      </article>
      <StudyCredits>
        People, families, eras, descriptions and references: <cite>TIPNR — Translators Individualised Proper Names with all References</cite> by{" "}
        <a className="underline" href="https://www.stepbible.org" rel="noreferrer">STEP Bible</a> (STEPBible.org, based on work at Tyndale House Cambridge), licensed CC BY 4.0.
        STEP notes that its short summaries and articles were adapted from AI output (2024).
      </StudyCredits>
    </div>
  </div>;
}

/** Old person addresses (/study/people/:id, used by the family tree's "Read their story") open the person's own page. */
export function PersonRedirect() {
  const { id = "" } = useParams();
  const { hash } = useLocation();
  const from = hash === "#people-directory" ? { path: "/study/people?view=families", label: "People & families" } : { path: "/study/people", label: "People & genealogies" };
  return <Navigate to={`/people/${id}`} replace state={{ from }} />;
}
