// /study/hymns: the hymns whose words we hold (Watts's psalms and hymns, the Olney Hymns of Newton and Cowper), drawn
// exactly as the approved mock-up (design/hymn-directions/collection/): its sections in its order, its markup, and its own
// CSS (generated into mockup-collection.css by scripts/build-hymn-styles.py). Each section keeps its own failure.
import { useEffect } from "react";
import { loadHymnCollection } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import { PageStatus } from "@/pages/teachers/shared/Frame";
import { Cards } from "./Catalogue";
import { History } from "./History";
import { Landing } from "./Landing";
import { HymnSection } from "./parts";
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
  return <div className="hy-page"><div className="wrap t-page">
    <HymnSection id="landing" title="Hymns"><Landing collection={data} /></HymnSection>
    <HymnSection id="bible" title="The whole Bible"><WholeBible collection={data} /></HymnSection>
    <HymnSection id="through" title="Hymns through the Bible"><Through collection={data} /></HymnSection>
    <HymnSection id="psalms" title="Through the Psalms"><Psalms collection={data} /></HymnSection>
    <HymnSection id="history" title="Their history"><History /></HymnSection>
    <HymnSection id="cards" title="Every hymn · cards" className="hy-cat"><Cards collection={data} /></HymnSection>
  </div></div>;
}
