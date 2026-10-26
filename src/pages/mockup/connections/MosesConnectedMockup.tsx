// /people_mockup/moses (local preview only): Moses's real page, its section 03 "The people around him" as it is, with
// pills that switch it to his places, topics and passages, and Moses at the centre opening his full connections page
// (MosesAround.tsx). The real page draws inside its own shadow root; once it says it is ready (data-people-ready),
// the pills and the other categories are added beside the section's own parts, so the page's own code is left as it is.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCachedLoad } from "@/lib/people-pages";
import { loadPeople, loadPersonDetail } from "@/lib/study";
import MosesPage from "@/components/moses-page/MosesPage";
import { cameFrom } from "@/lib/came-from";
import { MosesAround, type SectionParts } from "./MosesAround";
import { fieldHref } from "./graph-data";
import fieldStyles from "./connections.css?inline";
import styles from "./moses-connected.css?inline";

const MOSES = "moses-exo-2-10";
let drawn = 0;

/** Find section 03's heading and field, hide its own filter row (the rings are named on the field), and add places for
 *  the category pills (under the heading) and the other categories (after the field). */
function findParts(shadow: ShadowRoot): SectionParts | undefined {
  const section = shadow.querySelector<HTMLElement>("#mg-people");
  const head = section?.querySelector<HTMLElement>(".mx-head"), stage = section?.querySelector<HTMLElement>(".mx-pstage");
  if (!section || !head || !stage || section.querySelector(".ar-slot")) return undefined;
  const filters = section.querySelector<HTMLElement>(".mx-pfilters");
  if (filters) filters.style.display = "none";
  const pills = document.createElement("div"), content = document.createElement("div"), style = document.createElement("style");
  pills.className = content.className = "ar-slot";
  style.textContent = fieldStyles + styles;
  pills.append(style);
  head.after(pills);
  stage.after(content);
  drawn += 1;
  return { id: drawn, head, stage, pills, content };
}

export default function MosesConnectedMockup() {
  const people = useCachedLoad("people", loadPeople);
  const detail = useCachedLoad(`person:${MOSES}`, () => loadPersonDetail(MOSES));
  const outer = useRef<HTMLDivElement>(null);
  const [parts, setParts] = useState<SectionParts>();
  const navigate = useNavigate();
  const row = people.status === "ready" ? people.value.find((p) => p.id === MOSES) : undefined;
  // One person object for the page's life: a new one would make the Moses page draw itself again (and drop the section).
  const record = detail.status === "ready" ? detail.value : undefined;
  const person = useMemo(() => (row && record ? { ...row, ...record } : undefined), [row, record]);
  const loaded = Boolean(person);
  const openGraph = () => navigate(fieldHref("p", MOSES), { state: cameFrom("Moses") });

  // Choosing Moses at the centre of the page's own people field opens his full connections too.
  useEffect(() => {
    if (!parts) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target as Element).closest?.(".cs-core")) return;
      event.stopPropagation();
      openGraph();
    };
    parts.stage.addEventListener("click", onClick, true);
    return () => parts.stage.removeEventListener("click", onClick, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- openGraph only wraps navigate
  }, [parts, navigate]);

  // Each time the page (re)draws, find section 03 again.
  useEffect(() => {
    const element = outer.current;
    if (!element) return;
    const place = () => {
      const shadow = element.querySelector<HTMLElement>("[data-people-ready]")?.shadowRoot;
      const next = shadow && findParts(shadow);
      if (next) setParts(next);
    };
    const watch = new MutationObserver(place);
    watch.observe(element, { subtree: true, attributes: true, attributeFilter: ["data-people-ready"] });
    place();
    return () => watch.disconnect();
  }, [loaded]);

  if (people.status === "error" || detail.status === "error") return <p className="mx-auto max-w-7xl p-6">Moses’ page could not be loaded.</p>;
  if (!person) return <div className="min-h-[60vh] animate-pulse" role="status" aria-label="Loading Moses" />;
  return <div ref={outer}>
    <MosesPage person={person} />
    {parts?.head.isConnected && <MosesAround key={parts.id} parts={parts} openGraph={openGraph} />}
  </div>;
}
