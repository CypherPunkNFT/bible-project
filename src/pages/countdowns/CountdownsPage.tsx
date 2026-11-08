// /countdowns: the hub, each occasion's page and its day pages (design 6.5, 7.1). An unknown occasion shows the site's own
// not-found page; an unknown day of a known occasion redirects to the occasion page (DayRoute).
import { Route, Routes, useParams } from "react-router-dom";
import { occasionBySlug } from "@/data/countdowns";
import NotFoundPage from "@/pages/NotFoundPage";
import { CountdownsHub } from "./CountdownsHub";
import { DayRoute } from "./DayPage";
import { OccasionPage } from "./OccasionPage";
import "./countdowns.css";
import "./countdowns-sheet.css";

export default function CountdownsPage() {
  return (
    <Routes>
      <Route index element={<CountdownsHub />} />
      <Route path=":occasion" element={<OccasionRoute />} />
      <Route path=":occasion/:day" element={<OccasionRoute />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function OccasionRoute() {
  const { occasion: slug, day } = useParams();
  const occasion = slug ? occasionBySlug(slug) : undefined;
  if (!occasion) return <NotFoundPage />;
  return day ? <DayRoute occasion={occasion} dayKey={day} /> : <OccasionPage key={occasion.slug} occasion={occasion} />;
}
