import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { CatalogProvider } from "@/lib/catalog-context";
import HomePage from "@/pages/HomePage";

const LibraryPage = lazy(() => import("@/pages/LibraryPage"));
const BiblePage = lazy(() => import("@/pages/BiblePage"));
const ReaderPage = lazy(() => import("@/pages/ReaderPage"));
const ChartsPage = lazy(() => import("@/pages/ChartsPage"));
const TestimoniesPage = lazy(() => import("@/pages/TestimoniesPage"));
const AtlasPage = lazy(() => import("@/pages/AtlasPage"));
const AtlasMockupPage = lazy(() => import("@/pages/AtlasMockupPage"));
const AtlasMockup2Page = lazy(() => import("@/pages/AtlasMockup2Page"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const VersionsPage = lazy(() => import("@/pages/VersionsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const StudyPage = lazy(() => import("@/pages/study/StudyPage"));
const ApologeticsPage = lazy(() => import("@/pages/ApologeticsPage"));
const StudyRedirect = lazy(() => import("@/pages/study/StudyRedirect"));
const MiraclesPage = lazy(() => import("@/pages/study/MiraclesPage"));
const LettersPage = lazy(() => import("@/pages/study/LettersPage"));
const PeoplePage = lazy(() => import("@/pages/study/PeoplePage"));
const ProphetsPage = lazy(() => import("@/pages/study/ProphetsPage"));
const NamesPage = lazy(() => import("@/pages/study/NamesPage"));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <span className="animate-pulse font-serif text-muted">Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    // Framer Motion animations follow the reader's "reduce motion" setting, like the CSS ones.
    <MotionConfig reducedMotion="user">
    <BrowserRouter>
      <CatalogProvider>
        <Layout>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/bible" element={<BiblePage />} />
              <Route path="/read" element={<ReaderPage />} />
              <Route path="/read/:slug/:book/:chapter" element={<ReaderPage />} />
              <Route path="/charts" element={<StudyRedirect />} />
              <Route path="/charts/references" element={<StudyRedirect />} />
              <Route path="/charts/structure" element={<StudyRedirect />} />
              <Route path="/charts/words-of-jesus" element={<StudyRedirect />} />
              <Route path="/charts/versions" element={<StudyRedirect />} />
              <Route path="/testimonies" element={<TestimoniesPage />} />
              <Route path="/testimonies/join" element={<TestimoniesPage />} />
              <Route path="/testimonies/access" element={<TestimoniesPage />} />
              <Route path="/testimonies/design" element={<Navigate to="/testimonies" replace />} />
              <Route path="/atlas" element={<StudyRedirect />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/versions" element={<VersionsPage />} />
              <Route path="/sources" element={<VersionsPage />} />
              <Route path="/study" element={<StudyPage />} />
              <Route path="/study/references" element={<ChartsPage />} />
              <Route path="/study/structure" element={<ChartsPage />} />
              <Route path="/study/gospels" element={<ChartsPage />} />
              <Route path="/study/versions" element={<ChartsPage />} />
              <Route path="/study/places" element={<AtlasPage />} />
              <Route path="/study/places/mockup/*" element={<AtlasMockupPage />} />
              <Route path="/study/places/mockup2" element={<AtlasMockup2Page />} />
              <Route path="/study/places/mockup3" element={<Navigate to="/study/places/mockup2" replace />} />
              <Route path="/apologetics/*" element={<ApologeticsPage />} />
              <Route path="/study/harmony" element={<StudyRedirect />} />
              <Route path="/study/miracles" element={<MiraclesPage />} />
              <Route path="/study/letters" element={<LettersPage />} />
              <Route path="/study/people" element={<PeoplePage />} />
              <Route path="/study/people/:id" element={<PeoplePage />} />
              <Route path="/study/prophets" element={<ProphetsPage />} />
              <Route path="/study/names" element={<NamesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </CatalogProvider>
    </BrowserRouter>
    </MotionConfig>
  );
}
