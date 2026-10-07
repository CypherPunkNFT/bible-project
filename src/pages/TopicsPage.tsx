import { Link, Route, Routes, useParams } from "react-router-dom";
import { Loading } from "@/components/charts/ChartCard";
import { loadTopicIndex } from "@/lib/data";
import type { TopicIndex } from "@/lib/topics";
import { useAsync } from "@/lib/useAsync";
import { TopicFamilyPage } from "@/pages/TopicCategoryPage";
import { TopicPage } from "@/pages/TopicPage";
import { TopicsHome } from "@/pages/topics/TopicsHome";
import { useTopicsPageSlide } from "@/pages/topics/useTopicsPageSlide";
import "@/pages/topics/topics-collection.css";

/** A fresh page (folds closed, scroll state) for every topic. */
function TopicRoute({ index }: { index: TopicIndex }) {
  const { id = "" } = useParams();
  return <TopicPage key={id} index={index} />;
}

/**
 * The Topics collection, built like the Atlas collection: one mounted frame for home, families and topics,
 * so the topic index loads once and links between them can play the wipe-and-fold transition.
 */
export default function TopicsCollection() {
  const slide = useTopicsPageSlide();
  const index = useAsync(loadTopicIndex, "topic-index");

  if (index.status === "error") return <div className="mx-auto max-w-3xl px-4 py-16"><h1 className="font-serif text-3xl">The topics could not be loaded.</h1><Link to="/" className="mt-4 inline-block underline">Home</Link></div>;
  if (index.status !== "ready") return <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6"><Loading height={400} /></div>;
  return (
    <div onClickCapture={slide}>
      <Routes>
        <Route index element={<TopicsHome index={index.value} />} />
        <Route path="c/:category" element={<TopicFamilyPage index={index.value} />} />
        <Route path=":id" element={<TopicRoute index={index.value} />} />
      </Routes>
    </div>
  );
}
