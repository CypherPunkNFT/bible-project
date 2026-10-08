// /resources: a way station with three doorways (Learning materials, Fellowships, Help for life), and the three section
// pages under it. A section is a link only once its data file exists in src/data/resources/ (learning.json,
// fellowships.json, life.json); until then its doorway says "In preparation" and its address returns here, so no page
// is ever empty or invented.
import { lazy, Suspense, useEffect, type ComponentType, type CSSProperties } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { StationDoor } from "@/components/stations/Station";
import { useResource, type FellowshipsData, type LearningData, type LifeData } from "@/data/resources";
import { RESOURCE_SECTIONS, sectionReady } from "./resources/sections";
import { Loading } from "./resources/Shell";

const LearningPage = lazy(() => import("./resources/LearningPage"));
const FellowshipsPage = lazy(() => import("./resources/FellowshipsPage"));
const LifePage = lazy(() => import("./resources/LifePage"));

export default function ResourcesPage() {
  return <Routes>
    <Route index element={<Station />} />
    <Route path="learning" element={<Section name="learning" Page={LearningPage} />} />
    <Route path="fellowships" element={<Section name="fellowships" Page={FellowshipsPage} />} />
    <Route path="life" element={<Section name="life" Page={LifePage} />} />
    <Route path="*" element={<Navigate replace to="/resources" />} />
  </Routes>;
}

interface Data { learning: LearningData; fellowships: FellowshipsData; life: LifeData }

function Section<K extends keyof Data>({ name, Page }: { name: K; Page: ComponentType<{ data: Data[K] }> }) {
  const data = useResource(name);
  if (data === "missing") return <Navigate replace to="/resources" />;
  if (data === "loading") return <Loading />;
  return <Suspense fallback={<Loading />}><Page data={data as Data[K]} /></Suspense>;
}

function Station() {
  useEffect(() => { document.title = "Resources · Bible Project"; return () => { document.title = "Bible Project"; }; }, []);
  return <div className="st-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="st-hero">
      <div><p className="st-kick">Resources</p><h1>Help for the road,<br /><span>close at hand.</span></h1></div>
      <div className="st-side">
        <p>Materials to study with, fellowships that gather believers around the word, and help for the hardest moments of life.</p>
        <ol className="st-index" aria-label="The three sections">{RESOURCE_SECTIONS.map((s, i) => <li key={s.slug} data-ready={sectionReady(s.slug) || undefined} style={{ "--door": `var(--${s.color})` } as CSSProperties}><span>{String(i + 1).padStart(2, "0")}</span><span>{s.title}</span><span>{sectionReady(s.slug) ? "Open" : "In preparation"}</span></li>)}</ol>
      </div>
    </header>
    <nav className="st-doors" aria-label="Resources">
      {RESOURCE_SECTIONS.map((s, i) => <StationDoor key={s.slug} index={i + 1} art={s.art} title={s.title} text={s.text} color={s.color}
        {...(sectionReady(s.slug) ? { to: `/resources/${s.slug}`, note: "Ready to explore", action: "Open" } : { note: "Not yet published", action: "In preparation" })} />)}
    </nav>
  </div>;
}
