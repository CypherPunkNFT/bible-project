// /teachers: a way station with three doorways (Preachers, Authors, Scholars), and the three lists under it.
// The Authors list is built from the library's registry and holdings for now; another chat is designing an Authors page
// (design/authors-directions/), which may replace it here once the owner picks a direction.
import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { StationDoor, StationStats } from "@/components/stations/Station";
import { SECTIONS, TEACHERS, readableWorks, sectionBySlug } from "@/data/teachers";
import TeacherList from "./teachers/TeacherList";

export default function TeachersPage() {
  return <Routes>
    <Route index element={<Station />} />
    <Route path=":slug" element={<SectionRoute />} />
    <Route path="*" element={<Navigate replace to="/teachers" />} />
  </Routes>;
}

function SectionRoute() {
  const { slug } = useParams();
  const info = sectionBySlug(slug);
  return info ? <TeacherList key={info.slug} info={info} /> : <Navigate replace to="/teachers" />;
}

function Station() {
  useEffect(() => { document.title = "Teachers · Bible Project"; return () => { document.title = "Bible Project"; }; }, []);
  const people = TEACHERS.teachers;
  return <div className="st-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="st-hero">
      <div><p className="st-kick">Teachers</p><h1>Learn from those<br /><span>who taught the Word.</span></h1></div>
      <div className="st-side">
        <p>Preachers, authors and scholars from the site’s Christian library, and the commentators our study pages cite. Each name shows what we hold of theirs and the record behind it.</p>
        <StationStats items={[["Preachers", TEACHERS.counts.preacher], ["Authors", TEACHERS.counts.author], ["Scholars", TEACHERS.counts.scholar], ["To read here", readableWorks(people)]]} />
      </div>
    </header>
    <nav className="st-doors" aria-label="Teachers">
      {SECTIONS.map((s, i) => <StationDoor key={s.slug} index={i + 1} art={s.art} title={s.title} text={s.text} to={`/teachers/${s.slug}`} color={s.color}
        note={`${TEACHERS.counts[s.section].toLocaleString("en-US")} ${TEACHERS.counts[s.section] === 1 ? s.one : s.title.toLowerCase()}`} action={`Meet the ${s.title.toLowerCase()}`} />)}
    </nav>
    <p className="st-closing"><span />Every name links to its record: the library registry’s evidence, or the page that cites the work.<span /></p>
  </div>;
}
