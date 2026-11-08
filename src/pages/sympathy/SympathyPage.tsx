// /sympathy: the hub, the twelve loss pages, the funeral readings and the recipient card pages (design 5.1). An unknown
// loss page shows the site's own not-found page; a card link never does (RecipientCard falls back to Psalm 34:18).
import { Route, Routes, useParams } from "react-router-dom";
import { sympathySetBySlug } from "@/data/sympathy";
import NotFoundPage from "@/pages/NotFoundPage";
import { FuneralReadingsPage } from "./FuneralReadingsPage";
import { RecipientCard } from "./RecipientCard";
import { SetPage } from "./SetPage";
import { SympathyHub } from "./SympathyHub";
import "./sympathy.css";
import "./sympathy-sheet.css";

export default function SympathyPage() {
  return (
    <Routes>
      <Route index element={<SympathyHub />} />
      <Route path="funeral-readings" element={<FuneralReadingsPage />} />
      <Route path="card/*" element={<RecipientCard />} />
      <Route path="card" element={<RecipientCard />} />
      <Route path=":slug" element={<SetRoute />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function SetRoute() {
  const { slug } = useParams();
  const set = sympathySetBySlug(slug);
  return set ? <SetPage key={set.slug} set={set} /> : <NotFoundPage />;
}
