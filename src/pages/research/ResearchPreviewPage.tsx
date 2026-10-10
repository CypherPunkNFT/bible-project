import { ArrowLeft, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import NotFoundPage from "@/pages/NotFoundPage";
import { ContributorPage, ResearchIndex, WorkPage, WorksCatalogue } from "./ResearchCatalogue";
import { ResearchCasePage, ResearchLessonPage } from "./ResearchReading";
import { isLocalResearchHost, researchUrl, type ResearchBundle } from "./model";
import "./research.css";

/** M04 uses the existing local mockup server. No authoring data is imported into the public bundle. */
export default function ResearchPreviewPage() {
  const [data, setData] = useState<ResearchBundle | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const location = useLocation();
  const local = isLocalResearchHost(window.location.hostname);
  useEffect(() => {
    if (!local) return;
    const abort = new AbortController();
    fetch("/mockups/research-phase-2/preview.json", { cache: "no-store", signal: abort.signal })
      .then(async response => {
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Missing local research data");
        const bundle = await response.json() as ResearchBundle;
        if (bundle.scope !== "local-design-review" || bundle.schemaVersion !== 1 || !Array.isArray(bundle.sources) || !Array.isArray(bundle.cases)) throw new Error("Invalid local research data");
        setData(bundle); setState("ready");
      }).catch(error => { if (error.name !== "AbortError") setState("missing"); });
    return () => abort.abort();
  }, [local]);
  useEffect(() => {
    if (!local) return;
    const meta = document.createElement("meta"); meta.name = "robots"; meta.content = "noindex, nofollow"; document.head.appendChild(meta);
    return () => meta.remove();
  }, [local]);
  useEffect(() => {
    if (!data) return;
    const id = location.pathname.split("/").at(-1);
    const title = data.cases.find(p => p.id === id)?.title ?? data.lessons.find(p => p.id === id)?.title ?? data.sources.find(p => p.id === id)?.title ?? data.contributors.find(p => p.id === id)?.name ?? data.title;
    document.title = title + " · Bible Project";
    return () => { document.title = "Bible Project"; };
  }, [location.pathname, data]);
  if (!local || state === "missing") return <NotFoundPage />;
  if (!data) return <p className="rs-loading" role="status">Loading the readings…</p>;
  return <div className="rs-page">
    <div className="rs-masthead"><Link to={researchUrl()}><BookOpen size={18} aria-hidden /> Sources, evidence & Scripture</Link><Link to="/review"><ArrowLeft size={14} aria-hidden /> Design review</Link></div>
    <nav className="rs-nav" aria-label="Research collection">{[["", "Explore"], ["cases", "Apologetics"], ["works", "Scholars"], ["study", "Studies"]].map(([to,label]) => <NavLink key={to} to={researchUrl(to)} end={!to}>{label}</NavLink>)}</nav>
    <Routes>
      <Route index element={<ResearchIndex data={data} />} />
      <Route path="cases" element={<ResearchIndex data={data} view="cases" />} />
      <Route path="cases/:id" element={<ResearchCasePage data={data} />} />
      <Route path="evidence/:id" element={<WorkPage data={data} evidence />} />
      <Route path="works" element={<WorksCatalogue data={data} />} />
      <Route path="works/:id" element={<WorkPage data={data} />} />
      <Route path="contributors/:id" element={<ContributorPage data={data} />} />
      <Route path="study" element={<ResearchIndex data={data} view="study" />} />
      <Route path="study/:id" element={<ResearchLessonPage data={data} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <footer className="rs-footer"><BookOpen size={20} aria-hidden /><p><strong>Follow the source. Keep the context.</strong><span>Scripture leads the study. Historical sources are used within their stated scope.</span></p><Link to={researchUrl("works")}>Sources & credits <ArrowLeft size={15} aria-hidden /></Link></footer>
  </div>;
}
