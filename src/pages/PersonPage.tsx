import { useMemo } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { BackLink } from "@/components/BackLink";
import { PersonProfile } from "@/components/study/PersonProfile";
import { StudyCredits } from "@/components/study/StudyParts";
import { loadPeople, loadPersonDetail } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";

/** The page for one person (/people/:id), reached from the People table, the family tree, Topics or search.
 *  Its back link names wherever the visitor came from. */
export default function PersonPage() {
  const { id = "" } = useParams();
  const people = useAsync(loadPeople, "people");
  const detail = useAsync(() => loadPersonDetail(id), `person:${id}`);
  const byId = useMemo(() => new Map(people.status === "ready" ? people.value.map((p) => [p.id, p]) : []), [people]);
  const row = byId.get(id);
  const sameName = useMemo(() => people.status === "ready" && row ? people.value.filter((p) => p.n === row.n).length : 1, [people, row]);
  return <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
    <BackLink fallback={{ path: "/study/people", label: "People & genealogies" }} />
    <article aria-labelledby="person-name" className="mt-6">
      {people.status === "ready" && !row ? <p className="text-muted">No person has that address.</p>
        : row && detail.status === "ready" ? <PersonProfile person={{ ...row, ...detail.value }} byId={byId} sameName={sameName} />
        : people.status === "error" || detail.status === "error" ? <p className="text-muted">This person's details could not be loaded.</p>
        : <div className="h-96 animate-pulse rounded-2xl bg-surface-2" role="status" aria-label="Loading" />}
    </article>
    <StudyCredits>
      People, families, eras, descriptions and references: <cite>TIPNR — Translators Individualised Proper Names with all References</cite> by{" "}
      <a className="underline" href="https://www.stepbible.org" rel="noreferrer">STEP Bible</a> (STEPBible.org, based on work at Tyndale House Cambridge), licensed CC BY 4.0.
      STEP notes that its short summaries and articles were adapted from AI output (2024).
    </StudyCredits>
  </div>;
}

/** Old person addresses (/study/people/:id, used by the family tree's "Read their story") open the person's own page. */
export function PersonRedirect() {
  const { id = "" } = useParams();
  const { hash } = useLocation();
  const from = hash === "#people-directory" ? { path: "/study/people?view=families", label: "People & families" } : { path: "/study/people", label: "People & genealogies" };
  return <Navigate to={`/people/${id}`} replace state={{ from }} />;
}
