// /study/hymns: the hymns whose words we hold (Watts's psalms and hymns, the Olney Hymns of Newton and Cowper), in the
// approved mock-up's order of sections (design/hymn-directions/collection/). The page wears the Preachers page's classes
// so its "whole Bible" map and "through the Bible" ring use those stylesheets unchanged; each section draws inside its
// own TeacherSection, so one failing never blanks the rest.
import { useEffect } from "react";
import { loadHymnCollection } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import { PageStatus, TeacherSection } from "@/pages/teachers/shared/Frame";
import { Cards, List } from "./Catalogue";
import { History } from "./History";
import { Landing } from "./Landing";
import { Psalms } from "./Psalms";
import { Through } from "./Through";
import { WholeBible } from "./WholeBible";
import "./hymns.css";

export default function HymnsPage() {
  const collection = useAsync(loadHymnCollection, "hymns/collection");
  useEffect(() => {
    document.title = "Hymns · Study · Bible Project";
    return () => { document.title = "Bible Project"; };
  }, []);
  if (collection.status !== "ready") return <PageStatus error={collection.status === "error" ? collection.error as Error : null} />;
  const data = collection.value;
  return <div className="tp-page tp-preachers hy-page">
    <TeacherSection id="hymns" title="Hymns"><Landing collection={data} /></TeacherSection>
    <TeacherSection id="bible" title="The whole Bible"><WholeBible collection={data} /></TeacherSection>
    <TeacherSection id="through" title="Hymns through the Bible"><Through collection={data} /></TeacherSection>
    <TeacherSection id="psalms" title="Through the Psalms"><Psalms collection={data} /></TeacherSection>
    <TeacherSection id="history" title="Their history"><History /></TeacherSection>
    <div className="hy-cat">
      <TeacherSection id="cards" title="Every hymn · cards"><Cards collection={data} /></TeacherSection>
      <TeacherSection id="list" title="Every hymn · list"><List collection={data} /></TeacherSection>
    </div>
  </div>;
}
