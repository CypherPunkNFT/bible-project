// /when-youre: the hub and the topic pages (design 5.1). An unknown or cut-off address shows the hub with a gentle line
// and noindex, never the not-found page; a page retired on purpose replaces its address with its recorded successor.
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { redirectFor, topicBySlug, WHEN_YOURE_PATH } from "@/data/when-youre";
import { Hub } from "./Hub";
import { TopicPage } from "./TopicPage";
import "./when-youre.css";

function TopicRoute() {
  const { slug } = useParams();
  const { hash } = useLocation();
  const topic = topicBySlug(slug);
  if (topic) return <TopicPage key={topic.slug} topic={topic} />;
  const target = redirectFor(slug);
  if (target) return <Navigate replace to={`${WHEN_YOURE_PATH}/${target}${hash}`} />;
  return <Hub unknown />;
}

export default function WhenYourePage() {
  return (
    <div className="wy-page">
      <Routes>
        <Route index element={<Hub />} />
        <Route path=":slug" element={<TopicRoute />} />
        <Route path="*" element={<Hub unknown />} />
      </Routes>
    </div>
  );
}
