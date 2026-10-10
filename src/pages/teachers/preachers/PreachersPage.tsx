// /teachers/preachers-and-authors: the preachers and writers in the library (any Baptist; otherwise conservative evangelicals close to Baptist), in the owner's order of sections
// (approved mock-up: design/authors-directions/teachers/). Each section draws inside its own TeacherSection, so one
// failing never blanks the rest; every section reads the data and the profile drawer from PreachersContext.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PeopleData } from "@/data/teachers/pages-types";
import { PageStatus, SidesSwitch, TeacherSection } from "../shared/Frame";
import { usePeopleData } from "../shared/data";
import { PreachersContext, type ProfileTarget } from "./context";
import { Cities } from "./Cities";
import { Crossing } from "./Crossing";
import { Directory } from "./Directory";
import { Drawer } from "./Drawer";
import { Handed } from "./Handed";
import { Landing } from "./Landing";
import { Lives } from "./Lives";
import { SameYear } from "./SameYear";
import { Through } from "./Through";
import { WholeBible } from "./WholeBible";
import { AcquiredCatalogue, AcquisitionNotice } from "../shared/AcquiredCatalogue";

const SECTIONS = [
  ["landing", "Preachers & authors", Landing],
  ["bible", "The whole Bible", WholeBible],
  ["through", "Teachers through the Bible", Through],
  ["cities", "Cities that gathered them", Cities],
  ["lives", "Who was alive at the same time", Lives],
  ["crossing", "Did their lives cross?", Crossing],
  ["handed", "Who passed it to whom", Handed],
  ["sameyear", "Same year, different worlds", SameYear],
  ["directory", "Everyone, by where they served", Directory],
] as const;

export default function PreachersPage() {
  const { data, error } = usePeopleData();
  useEffect(() => { document.title = "Preachers & authors · Teachers · Bible Project"; return () => { document.title = "Bible Project"; }; }, []);
  return data ? <Loaded data={data} /> : <PageStatus error={error} />;
}

function Loaded({ data }: { data: PeopleData }) {
  const [profile, setProfile] = useState<ProfileTarget | null>(null);
  const openProfile = useCallback((id: string, origin: Element | null = null) => setProfile({ id, origin }), []);
  const closeProfile = useCallback(() => setProfile(null), []);
  const value = useMemo(() => ({ data, openProfile, closeProfile, profile }), [data, openProfile, closeProfile, profile]);
  return <PreachersContext.Provider value={value}>
    <div className="tp-page tp-preachers">
      <SidesSwitch current="preachers" />
      <AcquisitionNotice side="preachers" />
      {SECTIONS.map(([id, title, Section]) => <TeacherSection key={id} id={id} title={title}><Section /></TeacherSection>)}
      <TeacherSection id="acquired" title="Acquired authors and texts"><AcquiredCatalogue side="preachers" /></TeacherSection>
      <Drawer />
    </div>
  </PreachersContext.Provider>;
}
