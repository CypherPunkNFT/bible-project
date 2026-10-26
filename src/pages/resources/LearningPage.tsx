// /resources/learning: the Learning materials division, as the owner approved it (mock-up E, "Doors and stacks",
// 2026-10-08; plan: Research/Resources/LEARNING.md section 6). "Choose a door." on top; a door opens that reader's stack
// beneath it (the books lying flat, grouped by subject, with the panel beside them) and, under the stack, what its
// titles are built from. ?for=<reader> opens that door; the address follows the open door without redrawing the page.
// Below: every subject through every door, and any series that still joins two titles.
// Only what we have is shown (owner, 24 October 2026): our built workbooks (learning.json) and the workbooks by others
// that have been downloaded (open-workbooks.json, from Research/Resources/OpenWorkbooks), with their makers' credit.
// No planned titles; the page as it was, planned titles and all, is kept at /learning_mockup.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LearningData } from "@/data/resources";
import { CATALOGUE, buildShelf, type OpenWork } from "@/data/resources/learning-catalogue";
import OPEN from "@/data/resources/open-workbooks.json";
import { Doors } from "./learning/Doors";
import { Drawer } from "./learning/Drawer";
import { SeriesBlocks } from "./learning/SeriesBlocks";
import { SubjectLanes } from "./learning/SubjectLanes";
import { ResourceCrumbs } from "./Shell";
import "./learning/learning.css";

export default function LearningPage({ data }: { data: LearningData }) {
  const division = useMemo(() => buildShelf(CATALOGUE, data.items, OPEN as OpenWork[]), [data]);
  const [age, setAge] = useState<string | null>(() => {
    const asked = new URLSearchParams(window.location.search).get("for");
    return asked && division.audience[asked] ? asked : null;
  });
  const [kind, setKind] = useState<string | null>(null);
  const [shown, setShown] = useState(age !== null);

  useEffect(() => { document.title = "Learning materials · Resources · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);

  // Another door clears the kind lit in the last one (owner, 2026-10-08); the open door again closes it.
  const choose = useCallback((id: string) => { setKind(null); setAge((open) => (open === id ? null : id)); }, []);

  // The address keeps the open door (?for=children) without a new history entry or a redraw.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (age) url.searchParams.set("for", age); else url.searchParams.delete("for");
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [age]);

  // With a door open, the left and right keys move to the next door.
  useEffect(() => {
    if (!age) return;
    const order = division.audiences.map((a) => a.id);
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented || document.querySelector(".lm-viewer")) return;
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const i = order.indexOf(age);
      if (e.key === "ArrowRight") { e.preventDefault(); choose(order[(i + 1) % order.length]); }
      if (e.key === "ArrowLeft") { e.preventDefault(); choose(order[(i - 1 + order.length) % order.length]); }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [age, choose, division]);

  // Section numbers follow what is open: 01 (and 02, where the door has titles of our own) belong to the open stack,
  // the rest count on from there.
  const opened = shown && age ? (division.forAudience(age).some((t) => t.builtFrom.length > 0) ? 2 : 1) : 0;
  const num = (n: number) => String(n + opened).padStart(2, "0");
  const back = { path: `/resources/learning${age ? `?for=${age}` : ""}`, label: "Learning materials" };
  return <div className="lm tl-page mx-auto max-w-7xl px-4 sm:px-6">
    <ResourceCrumbs slug="learning" />
    <Doors division={division} age={age} onChoose={choose} />
    <Drawer division={division} age={age} kind={kind} onKind={setKind} onShown={setShown} />
    <SubjectLanes division={division} num={num(1)} back={back} />
    {division.series.length > 0 && <SeriesBlocks division={division} num={num(2)} back={back} />}
  </div>;
}
