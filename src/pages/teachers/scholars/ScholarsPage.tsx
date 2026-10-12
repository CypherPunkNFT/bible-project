import { evidencedProfiles } from "./site-evidence";
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
import { Landing } from "./Landing";
import { Named } from "./Named";
import { Numbers } from "./Numbers";
import { Profile } from "./Profile";
import { useLibrary } from "./catalogue/useLibrary";
import { SCHOLAR_SECTIONS } from "./sections";

const COMPONENTS = { catalogue: Catalogue, built: Built, discoveries: Discoveries, named: Named, numbers: Numbers, directory: Directory };


export default function ScholarsPage() {
  const { data, error } = useScholarsData();
  useEffect(() => { document.title = "Scholars · Teachers · Bible Project"; return () => { document.title = "Bible Project"; }; }, []);
  return data ? <Loaded data={data} /> : <PageStatus error={error} />;
}

function Loaded({ data: original }: { data: ScholarsData }) {
  const data = useMemo(() => evidencedProfiles(original), [original]);
  const { library, libraryError, libraryFacts } = useLibrary(data);
  const [profile, setProfile] = useState<ProfileTarget | null>(null);
  const [catalogueResetToken, resetCatalogue] = useState(0);
  const [filters, setFilters] = useState<CatalogueFilters>(NO_FILTERS);
  const [shownIds, setShownIds] = useState<string[]>(() => data.scholars.map((s) => s.id));
  const openProfile = useCallback((id: string, origin: Element | null = null) => setProfile({ id, origin }), []);
  const closeProfile = useCallback(() => setProfile(null), []);
  const filterCatalogue = useCallback((next: Partial<CatalogueFilters>, options: { scroll?: boolean } = {}) => {
    setFilters({ ...NO_FILTERS, ...next });
    if(options.scroll !== false) resetCatalogue(n=>n+1);
    if (options.scroll !== false) document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const value = useMemo(() => ({ data, catalogueResetToken, library, libraryError, libraryFacts, openProfile, closeProfile, profile, filters, filterCatalogue, shownIds, setShownIds }),
    [data, catalogueResetToken, library, libraryError, libraryFacts, openProfile, closeProfile, profile, filters, filterCatalogue, shownIds]);
  return <ScholarsContext.Provider value={value}>
    <div className="tp-page tp-scholars">
      <SidesSwitch current="scholars" />
      <TeacherSection id="landing" title="Scholars"><Landing /></TeacherSection>
      {SCHOLAR_SECTIONS.map(({ id, title }) => { const Section = COMPONENTS[id]; return <TeacherSection key={id} id={id} title={title}><Section /></TeacherSection>; })}
      <Profile />
    </div>
  </ScholarsContext.Provider>;
}
