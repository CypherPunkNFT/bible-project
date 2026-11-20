// /teachers/preachers-and-authors: the preachers and writers in the library (any Baptist; otherwise conservative evangelicals close to Baptist), in the owner's order of sections
// (approved mock-up: design/authors-directions/teachers/). Each section draws inside its own TeacherSection, so one
// failing never blanks the rest; every section reads the data and the profile drawer from PreachersContext.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MapView, PeopleData, Person } from "@/data/teachers/pages-types";
import { PageStatus, TeacherSection } from "../shared/Frame";
import { usePeopleData, usePeopleOpening } from "../shared/data";
import { PreachersContext, type ProfileTarget } from "./context";
import { Cities } from "./Cities";
import { Crossing } from "./Crossing";
import { TeacherCatalogue as Directory } from "./catalogue/TeacherCatalogue";
import { Drawer } from "./Drawer";
import { Handed } from "./Handed";
import { Landing } from "./Landing";
import { Lives } from "./Lives";
import { SameYear } from "./SameYear";
import { Through } from "./Through";
import { WholeBible } from "./WholeBible";
import { AcquiredCatalogue } from "../shared/AcquiredCatalogue";

const SECTIONS = [
  ["landing", "Preachers & authors", Landing],
  ["bible", "The whole Bible", WholeBible],
  ["directory", "Every teacher, one place", Directory],
  ["through", "Teachers through the Bible", Through],
  ["cities", "Cities that gathered them", Cities],
  ["lives", "Who was alive at the same time", Lives],
  ["crossing", "Did their lives cross?", Crossing],
  ["handed", "Who passed it to whom", Handed],
  ["sameyear", "Same year, different worlds", SameYear],
] as const;

// The landing draws from the opening slice (64 KB, people-opening.json) as soon as it arrives; the other sections and the
// profile drawer draw once people.json (1.8 MB, every passage and sermon) has arrived, fetched at the same time
// (job 87f995cb, 2026-11-19). Until then their sections keep their place, so the landing's jump links still land.
const NO_VIEW: MapView = { width: 0, height: 0, land: "", places: {} };
const openingData = (people: Person[]): PeopleData =>
  ({ about: "", books: [], people, links: [], chapters: {}, views: { world: NO_VIEW, atlantic: NO_VIEW, europe: NO_VIEW, america: NO_VIEW } });

export default function PreachersPage() {
  const { data, error } = usePeopleData();
  const { data: opening } = usePeopleOpening();
  const early = useMemo(() => opening ? openingData(opening.people) : null, [opening]);
  useEffect(() => { document.title = "Preachers & authors · Teachers · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const shown = data ?? early;
  return shown ? <Loaded data={shown} complete={Boolean(data)} error={error} /> : <PageStatus error={error} />;
}

function Loaded({ data, complete, error }: { data: PeopleData; complete: boolean; error: Error | null }) {
  const [profile, setProfile] = useState<ProfileTarget | null>(null);
  const openProfile = useCallback((id: string, origin: Element | null = null) => setProfile({ id, origin }), []);
  const closeProfile = useCallback(() => setProfile(null), []);
  const value = useMemo(() => ({ data, openProfile, closeProfile, profile }), [data, openProfile, closeProfile, profile]);
  return <PreachersContext.Provider value={value}>
    <div className="tp-page tp-preachers">
      {SECTIONS.map(([id, title, Section]) => <TeacherSection key={id} id={id} title={title}>{id === "landing" || complete ? <Section /> : <PageStatus error={error} />}</TeacherSection>)}
      <TeacherSection id="acquired" title="Acquired authors and texts"><AcquiredCatalogue side="preachers" /></TeacherSection>
      {complete && <Drawer />}
    </div>
  </PreachersContext.Provider>;
}
