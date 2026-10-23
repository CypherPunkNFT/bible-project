import { useResourcePageTransition } from "./resources/useResourcePageTransition";
import "./resources/resource-transitions.css";
// /resources: a way station with three doorways (Learning materials, Fellowships, Help for life), and the three section
// pages under it. A section is a link only once its data file exists in src/data/resources/ (learning.json,
// fellowships.json, life.json); until then its doorway says "In preparation" and its address returns here, so no page
// is ever empty or invented.
import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { StationDoor, StationStats } from "@/components/stations/Station";
import { loadResource, useResource, type FellowshipsData, type LearningData, type LifeData } from "@/data/resources";
import { divisionCounts } from "@/data/resources/learning-catalogue";
import { RESOURCE_SECTIONS, sectionReady } from "./resources/sections";
import { Loading } from "./resources/Shell";

const loadLearning = () => import("./resources/LearningPage");
const LearningPage = lazy(loadLearning);
const LearningTitlePage = lazy(() => import("./resources/learning/TitlePage"));
const loadFellowships = () => import("./resources/FellowshipsPage");
const FellowshipsPage = lazy(loadFellowships);
const loadLife = () => import("./resources/LifePage");
const LifePage = lazy(loadLife);

const preloadSection = (name: "learning" | "fellowships" | "life") => Promise.all([
  ({ learning: loadLearning, fellowships: loadFellowships, life: loadLife })[name](), loadResource(name),
]);

export default function ResourcesPage() {
  const openCard = useResourcePageTransition(preloadSection);
  return <div className="rs-route-content" onClickCapture={openCard}><Routes>
    <Route index element={<Station />} />
    <Route path="learning" element={<Section name="learning" Page={LearningPage} />} />
    <Route path="learning/:titleId" element={<Section name="learning" Page={LearningTitlePage} />} />
    <Route path="fellowships" element={<Section name="fellowships" Page={FellowshipsPage} />} />
    <Route path="life" element={<Section name="life" Page={LifePage} />} />
    <Route path="*" element={<Navigate replace to="/resources" />} />
  </Routes></div>;
}

interface Data { learning: LearningData; fellowships: FellowshipsData; life: LifeData }

function Section<K extends keyof Data>({ name, Page }: { name: K; Page: ComponentType<{ data: Data[K] }> }) {
  const data = useResource(name);
  if (data === "missing") return <Navigate replace to="/resources" />;
  if (data === "loading") return <Loading />;
  return <Suspense fallback={<Loading />}><Page data={data as Data[K]} /><span hidden data-resource-ready={name} /></Suspense>;
}

/** "1 ready · 40 planned · 7 readers": the Learning division at a glance (learning-catalogue.json). */
function learningNote() {
  const { ready, planned, readers } = divisionCounts();
  return `${ready} ready · ${planned} planned · ${readers} readers`;
}

/** What the three sections hold, counted from their data; a figure reads "…" until its file has loaded. */
function useStationFigures(): [string, string | number][] {
  const fellowships = useResource("fellowships");
  const life = useResource("life");
  const { ready, planned } = divisionCounts();
  const cities = typeof life === "object" ? life.cities.filter((c) => c.verified === true && c.entries.length > 0) : null;
  return [
    ["Learning titles", ready + planned],
    ["Fellowships", typeof fellowships === "object" ? fellowships.groups.reduce((n, g) => n + g.entries.length, 0) : "…"],
    ["Cities with local help", cities ? cities.length : "…"],
    ["Local places & lines", cities ? cities.reduce((n, c) => n + c.entries.length + (c.lines?.length ?? 0), 0) : "…"],
  ];
}

function Station() {
  useEffect(() => { document.title = "Resources · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  return <div className="st-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="st-hero">
      <div><p className="st-kick">Resources</p><h1>Help for the road,<br /><span>close at hand.</span></h1></div>
      <div className="st-side">
        <p>Materials to study with, fellowships that gather believers around the word, and help for the hardest moments of life.</p>
        <StationStats items={useStationFigures()} />
      </div>
    </header>
    <nav className="st-doors" aria-label="Resources">
      {RESOURCE_SECTIONS.map((s, i) => <StationDoor key={s.slug} index={i + 1} art={s.art} title={s.title} text={s.text} color={s.color}
        {...(sectionReady(s.slug) ? { to: `/resources/${s.slug}`, note: s.slug === "learning" ? learningNote() : "Ready to explore", action: "Open" } : { note: "Not yet published", action: "In preparation" })} />)}
    </nav>
  </div>;
}
