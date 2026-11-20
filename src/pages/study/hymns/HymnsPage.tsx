// /study/hymns: the hymns whose words we hold (Watts's psalms and hymns, the Olney Hymns of Newton and Cowper), drawn
// exactly as the approved mock-up (design/hymn-directions/collection/): its sections in its order, its markup, and its own
// CSS (generated into mockup-collection.css by scripts/build-hymn-styles.py). Each section keeps its own failure.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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

/** The sections in page order; a jump link (#cards) draws its section and every one above it, so it lands where it should. */
const SECTIONS = ["landing", "bible", "through", "psalms", "history", "cards"];

export default function HymnsPage() {
  const collection = useAsync(loadHymnCollection, "hymns/collection");
  const target = SECTIONS.indexOf(useLocation().hash.slice(1));
  useEffect(() => {
    document.title = "Hymns · Study · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  // The sections below the landing wait until they come near the screen (parts.tsx), and the data arrives after the
  // browser has looked for the address's #section: once the sections up to it are drawn, go to it.
  const ready = collection.status === "ready";
  useEffect(() => {
    if (!ready || target < 1) return;
    const frame = requestAnimationFrame(() => document.getElementById(SECTIONS[target])?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [ready, target]);
  if (collection.status !== "ready") return <PageStatus error={collection.status === "error" ? collection.error as Error : null} />;
  const data = collection.value;
  const eager = (id: string) => SECTIONS.indexOf(id) <= target;
  return <div className="hy-page"><div className="wrap t-page">
    <HymnSection id="landing" title="Hymns"><Landing collection={data} /></HymnSection>
    <HymnSection id="bible" title="The whole Bible" eager={eager("bible")}><WholeBible collection={data} /></HymnSection>
    <HymnSection id="through" title="Hymns through the Bible" eager={eager("through")}><Through collection={data} /></HymnSection>
    <HymnSection id="psalms" title="Through the Psalms" eager={eager("psalms")}><Psalms collection={data} /></HymnSection>
    <HymnSection id="history" title="Their history" eager={eager("history")}><History /></HymnSection>
    <HymnSection id="cards" title="Every hymn · cards" className="hy-cat" eager={eager("cards")}><Cards collection={data} /></HymnSection>
  </div></div>;
}
