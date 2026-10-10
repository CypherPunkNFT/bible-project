import { lazy, Suspense, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { CatalogProvider } from "@/lib/catalog-context";
import HomePage from "@/pages/HomePage";

const LibraryPage = lazy(() => import("@/pages/LibraryPage"));
const BiblePage = lazy(() => import("@/pages/BiblePage"));
const ReaderPage = lazy(() => import("@/pages/ReaderPage"));
const ChartsPage = lazy(() => import("@/pages/ChartsPage"));
const TestimoniesPage = lazy(() => import("@/pages/TestimoniesPage"));
const AtlasPage = lazy(() => import("@/pages/AtlasPage"));
const AtlasRedirect = lazy(() => import("@/pages/places/AtlasRedirect"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const MeaningSearchPage = lazy(() => import("@/pages/MeaningSearchPage"));
const TopicsPage = lazy(() => import("@/pages/TopicsPage"));
const TeachersPage = lazy(() => import("@/pages/TeachersPage"));
const ResourcesPage = lazy(() => import("@/pages/ResourcesPage"));
const VersionsPage = lazy(() => import("@/pages/VersionsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const StudyBranch = lazy(() => import("@/pages/study/hub/StudyBranch"));
const StudyPage = lazy(() => import("@/pages/study/StudyPage"));
const ApologeticsPage = lazy(() => import("@/pages/ApologeticsPage"));
const StudyRedirect = lazy(() => import("@/pages/study/StudyRedirect"));
const MiraclesPage = lazy(() => import("@/pages/study/MiraclesPage"));
const LettersPage = lazy(() => import("@/pages/study/LettersPage"));
const CurvedGenealogyPage = lazy(() => import("@/pages/study/CurvedGenealogyPage"));
const CircularGenealogyPage = lazy(() => import("@/pages/study/CircularGenealogyPage"));
const PeoplePage = lazy(() => import("@/pages/study/PeoplePage"));
const PersonPage = lazy(() => import("@/pages/PersonPage"));
const PersonRedirect = lazy(() => import("@/pages/PersonPage").then((m) => ({ default: m.PersonRedirect })));
const ProphetsPage = lazy(() => import("@/pages/study/ProphetsPage"));
const NamesPage = lazy(() => import("@/pages/study/NamesPage"));
// The owner's design review board: hidden, local preview only (it shows "not found" on the live site).
const DesignReviewPage = lazy(() => import("@/pages/review/DesignReviewPage"));
const ResearchPreviewPage = lazy(() => import("@/pages/research/ResearchPreviewPage"));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <span className="animate-pulse font-serif text-muted">Loading…</span>
    </div>
  );
}

function AppFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const page = <PageErrorBoundary resetKey={pathname}>{children}</PageErrorBoundary>;
  return pathname === "/mock/genealogy-circle-2" || pathname === "/mock/genealogy-circle" || pathname === "/mock/genealogy-curves" ? page : <Layout>{page}</Layout>;
}

export default function App() {
  return (
    // Framer Motion animations follow the reader's "reduce motion" setting, like the CSS ones.
    <MotionConfig reducedMotion="user">
    <BrowserRouter>
      <CatalogProvider>
        <AppFrame>
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
              <Route path="/search/meaning" element={<MeaningSearchPage />} />
              <Route path="/topics/*" element={<TopicsPage />} />
              <Route path="/teachers/*" element={<TeachersPage />} />
              <Route path="/resources/*" element={<ResourcesPage />} />
              <Route path="/versions" element={<VersionsPage />} />
              <Route path="/sources" element={<VersionsPage />} />
              <Route path="/study" element={<StudyPage />} />
              <Route path="/study/theology" element={<StudyBranch branch="theology" />} />
              <Route path="/study/academic" element={<StudyBranch branch="academic" />} />
              <Route path="/study/references" element={<ChartsPage />} />
              <Route path="/study/structure" element={<ChartsPage />} />
              <Route path="/study/gospels" element={<ChartsPage />} />
              <Route path="/study/versions" element={<ChartsPage />} />
              <Route path="/study/atlas/*" element={<AtlasPage />} />
              <Route path="/study/places/*" element={<AtlasRedirect />} />
              <Route path="/apologetics/*" element={<ApologeticsPage />} />
              <Route path="/study/harmony" element={<StudyRedirect />} />
              <Route path="/study/miracles" element={<MiraclesPage />} />
              <Route path="/study/letters/*" element={<LettersPage />} />
              <Route path="/mock/genealogy-curves" element={<CurvedGenealogyPage />} />
              <Route path="/mock/genealogy-circle-2" element={<CircularGenealogyPage familyBands />} />
              <Route path="/mock/genealogy-circle" element={<CircularGenealogyPage />} />
              <Route path="/study/people" element={<PeoplePage />} />
              <Route path="/study/people/:id" element={<PersonRedirect />} />
              {/* A ruler's or apostle's second page: /people/:id/rule, /people/:id/mission (one route, so the page stays mounted). */}
              <Route path="/people/:id/:aspect?" element={<PersonPage />} />
              <Route path="/study/prophets" element={<ProphetsPage />} />
              <Route path="/study/rulers" element={<Navigate to="/study/people?view=rulers" replace />} />
              <Route path="/study/apostles" element={<Navigate to="/study/people?view=apostles" replace />} />
              <Route path="/study/names" element={<NamesPage />} />
              <Route path="/review" element={<DesignReviewPage />} />
              <Route path="/review/research/*" element={<ResearchPreviewPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppFrame>
      </CatalogProvider>
    </BrowserRouter>
    </MotionConfig>
  );
}
