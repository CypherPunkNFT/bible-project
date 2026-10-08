/// <reference types="vite/client" /> // for import.meta.glob below
// /resources: a way station with three doorways (Learning materials, Fellowships, Help for life). A section is a link only
// once its data file exists in src/data/resources/ (learning.json, fellowships.json, life.json); until then its doorway
// says "In preparation" and is not a link. The three section pages are built separately: until one exists, its address
// returns here, so no page is ever empty or invented. To add a page, render it from the route below for its slug.
import { useEffect, type CSSProperties } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { StationDoor } from "@/components/stations/Station";
import type { StationArtKind } from "@/components/stations/StationArt";

const DATA = import.meta.glob("/src/data/resources/*.json");
const ready = (slug: string) => `/src/data/resources/${slug}.json` in DATA;

interface ResourceSection { slug: "learning" | "fellowships" | "life"; art: StationArtKind; title: string; text: string; color: string }
const RESOURCE_SECTIONS: ResourceSection[] = [
  { slug: "learning", art: "learning", title: "Learning materials", text: "PDFs, workbooks and study guides we make, to print or keep beside the page.", color: "epistles" },
  { slug: "fellowships", art: "fellowships", title: "Fellowships", text: "Free national fellowships that gather believers to pray and to study the word together.", color: "gospels" },
  { slug: "life", art: "life", title: "Help for life", text: "National hotlines, food, pregnancy and post-abortion care and grief care, with a map of places across the USA.", color: "history" },
];

export default function ResourcesPage() {
  return <Routes>
    <Route index element={<Station />} />
    {RESOURCE_SECTIONS.map((s) => <Route key={s.slug} path={s.slug} element={<Navigate replace to="/resources" />} />)}
    <Route path="*" element={<Navigate replace to="/resources" />} />
  </Routes>;
}

function Station() {
  useEffect(() => { document.title = "Resources · Bible Project"; return () => { document.title = "Bible Project"; }; }, []);
  return <div className="st-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="st-hero">
      <div><p className="st-kick">Resources</p><h1>Help for the road,<br /><span>close at hand.</span></h1></div>
      <div className="st-side">
        <p>Materials to study with, fellowships that gather believers around the word, and help for the hardest moments of life.</p>
        <ol className="st-index" aria-label="The three sections">{RESOURCE_SECTIONS.map((s, i) => <li key={s.slug} data-ready={ready(s.slug) || undefined} style={{ "--door": `var(--${s.color})` } as CSSProperties}><span>{String(i + 1).padStart(2, "0")}</span><span>{s.title}</span><span>{ready(s.slug) ? "Open" : "In preparation"}</span></li>)}</ol>
      </div>
    </header>
    <nav className="st-doors" aria-label="Resources">
      {RESOURCE_SECTIONS.map((s, i) => <StationDoor key={s.slug} index={i + 1} art={s.art} title={s.title} text={s.text} color={s.color}
        {...(ready(s.slug) ? { to: `/resources/${s.slug}`, note: "Ready to explore", action: "Open" } : { note: "Not yet published", action: "In preparation" })} />)}
    </nav>
  </div>;
}
