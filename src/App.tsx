import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { CatalogProvider } from "@/lib/catalog-context";
import HomePage from "@/pages/HomePage";

const LibraryPage = lazy(() => import("@/pages/LibraryPage"));
const ReaderPage = lazy(() => import("@/pages/ReaderPage"));
const ChartsPage = lazy(() => import("@/pages/ChartsPage"));
const AtlasPage = lazy(() => import("@/pages/AtlasPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const VersionsPage = lazy(() => import("@/pages/VersionsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const StudyPage = lazy(() => import("@/pages/study/StudyPage"));
const HarmonyPage = lazy(() => import("@/pages/study/HarmonyPage"));
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
              <Route path="/read" element={<ReaderPage />} />
              <Route path="/read/:slug/:book/:chapter" element={<ReaderPage />} />
              <Route path="/charts" element={<ChartsPage />} />
              <Route path="/atlas" element={<AtlasPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/versions" element={<VersionsPage />} />
              <Route path="/study" element={<StudyPage />} />
              <Route path="/study/harmony" element={<HarmonyPage />} />
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
