// /baby-names: Biblical baby names (docs/features/baby-names/design.md). The hub and the boy and girl lists share one
// list (NameList.tsx); each name has its page at /baby-names/<slug> (NamePage.tsx). An unknown address shows the site's
// own not-found page, which the crawler-copy capture recognises.
import { Route, Routes, useParams } from "react-router-dom";
import NotFoundPage from "@/pages/NotFoundPage";
import { NameList } from "./NameList";
import { NameRoute } from "./NamePage";
import "./baby-names.css";

export default function BabyNamesPage() {
  return (
    <Routes>
      <Route index element={<NameList key="all" variant="all" />} />
      <Route path="boys" element={<NameList key="boy" variant="boy" />} />
      <Route path="girls" element={<NameList key="girl" variant="girl" />} />
      <Route path=":slug" element={<SlugRoute />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function SlugRoute() {
  const { slug = "" } = useParams();
  return <NameRoute key={slug} slug={slug} />;
}
