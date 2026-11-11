// /blessings: the hub and the eight pages (design 5.1). An unknown page shows the site's not-found page, as the sibling
// features do; nothing has been retired, so there is no redirect list.
import { Route, Routes, useParams } from "react-router-dom";
import { pageBySlug } from "@/data/home-blessings";
import NotFoundPage from "@/pages/NotFoundPage";
import { BlessingPage } from "./BlessingPage";
import { Hub } from "./Hub";
import "./home-blessings.css";

function PageRoute() {
  const { slug } = useParams();
  const page = pageBySlug(slug);
  return page ? <BlessingPage key={page.slug} page={page} /> : <NotFoundPage />;
}

export default function BlessingsPage() {
  return (
    <div className="hb-page">
      <Routes>
        <Route index element={<Hub />} />
        <Route path=":slug" element={<PageRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
