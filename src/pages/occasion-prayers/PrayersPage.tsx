// /prayers: the hub and the occasion pages (design 5.1). An unknown occasion shows the site's not-found page, as the
// life-event packs do; nothing has been retired, so there is no redirect list.
import { Route, Routes, useParams } from "react-router-dom";
import { occasionBySlug } from "@/data/occasion-prayers";
import NotFoundPage from "@/pages/NotFoundPage";
import { Hub } from "./Hub";
import { OccasionPage } from "./OccasionPage";
import "./occasion-prayers.css";

function OccasionRoute() {
  const { slug } = useParams();
  const occasion = occasionBySlug(slug);
  return occasion ? <OccasionPage key={occasion.slug} occasion={occasion} /> : <NotFoundPage />;
}

export default function PrayersPage() {
  return (
    <div className="op-page">
      <Routes>
        <Route index element={<Hub />} />
        <Route path=":slug" element={<OccasionRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
