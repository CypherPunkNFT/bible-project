// /teachers/scholars: historians, translators, archaeologists, theologians before the Reformation and the makers of the
// reference books this site is built on, in the owner's order of sections (approved mock-up:
// design/scholars-directions/scholars/). Every section reads the data, the shared profile and the catalogue's filters
// from ScholarsContext; each draws inside its own TeacherSection so one failing never blanks the rest.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ScholarsData } from "@/data/teachers/pages-types";
import { PageStatus, SidesSwitch, TeacherSection } from "../shared/Frame";
import { useScholarsData } from "../shared/data";
import { Built } from "./Built";
import { Catalogue } from "./Catalogue";
import { NO_FILTERS, ScholarsContext, type CatalogueFilters, type ProfileTarget } from "./context";
import { Directory } from "./Directory";
import { Discoveries } from "./Discoveries";
import { Fields } from "./Fields";
import { Landing } from "./Landing";
import { Named } from "./Named";
import { Numbers } from "./Numbers";
import { Profile } from "./Profile";
import { AcquiredCatalogue, AcquisitionNotice } from "../shared/AcquiredCatalogue";

const SECTIONS = [
  ["landing", "Scholars", Landing],
  ["catalogue", "The catalogue", Catalogue],
  ["built", "Built on their work", Built],
  ["discoveries", "The discoveries", Discoveries],
  ["fields", "Five ways to study the Bible", Fields],
  ["named", "Where the site names them", Named],
  ["numbers", "By the numbers", Numbers],
  ["directory", "All the scholars", Directory],
] as const;

export default function ScholarsPage() {
  const { data, error } = useScholarsData();
  useEffect(() => { document.title = "Scholars · Teachers · Bible Project"; return () => { document.title = "Bible Project"; }; }, []);
  return data ? <Loaded data={data} /> : <PageStatus error={error} />;
}

function Loaded({ data }: { data: ScholarsData }) {
  const [profile, setProfile] = useState<ProfileTarget | null>(null);
  const [filters, setFilters] = useState<CatalogueFilters>(NO_FILTERS);
  const [shownIds, setShownIds] = useState<string[]>(() => data.scholars.map((s) => s.id));
  const openProfile = useCallback((id: string, origin: Element | null = null) => setProfile({ id, origin }), []);
  const closeProfile = useCallback(() => setProfile(null), []);
  const filterCatalogue = useCallback((next: Partial<CatalogueFilters>, options: { scroll?: boolean } = {}) => {
    setFilters({ ...NO_FILTERS, ...next });
    if (options.scroll !== false) document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const value = useMemo(() => ({ data, openProfile, closeProfile, profile, filters, filterCatalogue, shownIds, setShownIds }),
    [data, openProfile, closeProfile, profile, filters, filterCatalogue, shownIds]);
  return <ScholarsContext.Provider value={value}>
    <div className="tp-page tp-scholars">
      <SidesSwitch current="scholars" />
      <AcquisitionNotice side="scholars" />
      {SECTIONS.map(([id, title, Section]) => <TeacherSection key={id} id={id} title={title}><Section /></TeacherSection>)}
      <TeacherSection id="acquired" title="Acquired authors and editors"><AcquiredCatalogue side="scholars" /></TeacherSection>
      <Profile />
    </div>
  </ScholarsContext.Provider>;
}
