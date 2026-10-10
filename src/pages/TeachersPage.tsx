// /teachers: a way station with two doorways (owner 2026-10-08): Preachers & authors (the Reformed preachers and writers
// in the library) and Scholars (historians, translators, archaeologists and the makers of the reference books this site
// is built on, Christian or not, each labelled). Each subpage is the owner-approved mock-up, ported to React, and loads
// its own data only when opened. The earlier three lists (/teachers/preachers, /authors) now lead to the merged page.
import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { StationDoor, StationStats } from "@/components/stations/Station";
import summary from "@/data/teachers/summary.json";
import { SIDE_PATHS } from "./teachers/shared/sides";
import "./teachers/station.css";

const PreachersPage = lazy(() => import("./teachers/preachers/PreachersPage"));
const ScholarsPage = lazy(() => import("./teachers/scholars/ScholarsPage"));

export default function TeachersPage() {
  return <Routes>
    <Route index element={<Station />} />
    <Route path="preachers-and-authors" element={<Suspense fallback={null}><PreachersPage /></Suspense>} />
    <Route path="scholars" element={<Suspense fallback={null}><ScholarsPage /></Suspense>} />
    <Route path="preachers" element={<Navigate replace to={SIDE_PATHS.preachers} />} />
    <Route path="authors" element={<Navigate replace to={SIDE_PATHS.preachers} />} />
    <Route path="*" element={<Navigate replace to="/teachers" />} />
  </Routes>;
}

function Station() {
  useEffect(() => { document.title = "Teachers · Bible Project"; return () => { document.title = "Bible Project"; }; }, []);
  return <div className="st-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="st-hero">
      <div><p className="st-kick">Teachers</p><h1>Learn from those<br /><span>who taught the Word.</span></h1></div>
      <div className="st-side">
        <p>The preachers and writers whose sermons and books are in the site’s library, and the scholars whose work the site is built on.</p>
        <StationStats items={[["Preachers & authors", summary.people], ["Scholars", summary.scholars], ["Preacher & author works", summary.works], ["Used on this site", summary.scholarsInUse]]} />
      </div>
    </header>
    <nav className="st-doors st-doors-2" aria-label="Teachers">
      <StationDoor index={1} art="preachers" title="Preachers & authors" color="accent" to={SIDE_PATHS.preachers}
        text="Five centuries of Baptist, Reformed and evangelical pastors and preachers, from Bullinger to today: what they preached, where they served and who taught whom."
        note={`${summary.people} preachers and authors`} action="Meet the preachers and authors" />
      <StationDoor index={2} art="scholars" title="Scholars" color="prophets" to={SIDE_PATHS.scholars}
        text="Historians, translators, archaeologists and the makers of the reference books this site stands on, Christian or not, each labelled for what they were."
        note={`${summary.scholars} scholars`} action="Meet the scholars" />
    </nav>
    <p className="st-closing"><span />Every work links to where it can be read; every scholar shows how this site uses their work.<span /></p>
  </div>;
}
