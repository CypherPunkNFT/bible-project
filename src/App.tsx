import WorldStudyRedirect from "@/pages/study/world/WorldStudyRedirect";
import { lazy, Suspense, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PageTransitions } from "@/components/PageTransitions";
import { CorrectionButton } from "@/components/corrections/CorrectionButton";
import { Layout } from "@/components/Layout";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { CatalogProvider } from "@/lib/catalog-context";
import HomePage from "@/pages/HomePage";

const LibraryPage = lazy(() => import("@/pages/LibraryPage"));
const BiblePage = lazy(() => import("@/pages/BiblePage"));
const ListenPage = lazy(() => import("@/pages/ListenPage"));
const AudioBiblePage = lazy(() => import("@/pages/AudioBiblePage"));
const ReaderPage = lazy(() => import("@/pages/ReaderPage"));
const ChartsPage = lazy(() => import("@/pages/ChartsPage"));
const TestimoniesPage = lazy(() => import("@/pages/TestimoniesPage"));
const AtlasPage = lazy(() => import("@/pages/AtlasPage"));
const AtlasRedirect = lazy(() => import("@/pages/places/AtlasRedirect"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const OtherWorkPage = lazy(() => import("@/pages/OtherWorkPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const SupportPage = lazy(() => import("@/pages/SupportPage"));
const MeaningSearchPage = lazy(() => import("@/pages/MeaningSearchPage"));
const TopicsPage = lazy(() => import("@/pages/TopicsPage"));
const TeachersPage = lazy(() => import("@/pages/TeachersPage"));
const AnalysisPage = lazy(() => import("@/pages/AnalysisPage"));
const ResourcesPage = lazy(() => import("@/pages/ResourcesPage"));
const VersionsPage = lazy(() => import("@/pages/VersionsPage"));
const HomeMockupsPage = lazy(() => import("@/pages/HomeMockupsPage"));
const EmblemMockupsPage = lazy(() => import("@/pages/EmblemMockupsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const SurvivingWitnessesPage = lazy(() => import("@/pages/study/witnesses/SurvivingWitnessesPage"));
const PassageManuscriptsPage = lazy(() => import("@/pages/study/passages/PassageManuscriptsPage"));
const IsraelEmpiresPage = lazy(() => import("@/pages/study/empires/IsraelEmpiresPage"));
const PrintRoomPage = lazy(() => import("@/pages/study/print-room/PrintRoomPage"));
const MergedWorldPage = lazy(() => import("@/pages/study/world/MergedWorldPage"));
const CitiesLayersPage = lazy(() => import("@/pages/study/history/CitiesLayersPage"));
const CanonPage = lazy(() => import("@/pages/study/canon/CanonPage"));
const DeadSeaScrollsPage = lazy(() => import("@/pages/study/scrolls/DeadSeaScrollsPage"));
const DiscoveriesPage = lazy(() => import("@/pages/study/discoveries/DiscoveriesPage"));
const MuseumArchaeologyPage = lazy(() => import("@/pages/study/museums/MuseumArchaeologyPage"));
const MuseumPage = lazy(() => import("@/pages/study/museums/MuseumPage"));
const HistoricalStudyLanding = lazy(() => import("@/pages/study/discoveries/HistoricalStudyLanding"));
const CreedsPage = lazy(() => import("@/pages/study/creeds/CreedsPage"));
const CreedDocumentPage = lazy(() => import("@/pages/study/creeds/CreedDocumentPage"));
const HymnsPage = lazy(() => import("@/pages/study/hymns/HymnsPage"));
const HymnPage = lazy(() => import("@/pages/study/hymns/HymnPage"));
const ManuscriptsPage = lazy(() => import("@/pages/study/manuscripts/ManuscriptsPage"));
const StudyBranch = lazy(() => import("@/pages/study/hub/StudyBranch"));
const StudyPage = lazy(() => import("@/pages/study/StudyPage"));
const StudyCollection = lazy(() => import("@/pages/study/StudyCollection"));
const ApologeticsPage = lazy(() => import("@/pages/ApologeticsPage"));
const StudyRedirect = lazy(() => import("@/pages/study/StudyRedirect"));
const MiraclesPage = lazy(() => import("@/pages/study/MiraclesPage"));
const LettersPage = lazy(() => import("@/pages/study/LettersPage"));
const CurvedGenealogyPage = lazy(() => import("@/pages/study/CurvedGenealogyPage"));
const CircularGenealogyPage = lazy(() => import("@/pages/study/CircularGenealogyPage"));
const LongMemoryPage = lazy(() => import("@/pages/study/LongMemoryPage"));
const PeoplePage = lazy(() => import("@/pages/study/PeoplePage"));
const PersonPage = lazy(() => import("@/pages/PersonPage"));
const PersonRedirect = lazy(() => import("@/pages/PersonPage").then((m) => ({ default: m.PersonRedirect })));
const ProphetsPage = lazy(() => import("@/pages/study/ProphetsPage"));
const NamesPage = lazy(() => import("@/pages/study/NamesPage"));
// The owner's design review board: hidden, local preview only (it shows "not found" on the live site).
const DesignReviewPage = lazy(() => import("@/pages/review/DesignReviewPage"));
const ResearchPreviewPage = lazy(() => import("@/pages/research/ResearchPreviewPage"));
const ReadingSourcePage = lazy(() => import("@/pages/ReadingSourcePage"));
const LibraryWorkPage = lazy(() => import("@/pages/teachers/LibraryWorkPage"));
const CirclesPage = lazy(() => import("@/pages/study/circles/CirclesPage"));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" data-page-loading role="status" aria-live="polite">
      <span className="animate-pulse font-serif text-muted">Loading…</span>
    </div>
  );
}

function AppFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const page = <PageErrorBoundary resetKey={pathname}>{children}</PageErrorBoundary>;
  return pathname === "/mock/genealogy-circle-2" || pathname === "/mock/genealogy-circle" || pathname === "/mock/genealogy-curves" ? page : <Layout>{page}</Layout>;
}

function Apologetics2Redirect() {
  const location = useLocation();
  const pathname = location.pathname.replace(/^\/apologetics2(?=\/|$)/, "/apologetics").replace(/\/source-records(?=\/|$)/, "/sources");
  return <Navigate replace to={pathname + location.search + location.hash} />;
}

export default function App() {
  return (
    // Framer Motion animations follow the reader's "reduce motion" setting, like the CSS ones.
    <MotionConfig reducedMotion="user">
    <BrowserRouter>
      <PageTransitions>
      <CatalogProvider>
        <AppFrame>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/bible" element={<BiblePage />} />
              <Route path="/listen" element={<ListenPage />} />
              <Route path="/listen/asv" element={<AudioBiblePage />} />
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
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/contact/other-work" element={<OtherWorkPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/search/meaning" element={<MeaningSearchPage />} />
              <Route path="/topics/*" element={<TopicsPage />} />
              <Route path="/teachers/*" element={<TeachersPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/teachers/collections/:leaderId" element={<CirclesPage />} />
              <Route path="/resources/*" element={<ResourcesPage />} />
              <Route path="/mockups" element={<HomeMockupsPage />} />
              <Route path="/banner-emblems" element={<EmblemMockupsPage />} />
              <Route path="/versions" element={<VersionsPage />} />
              <Route path="/sources" element={<VersionsPage />} />
              <Route path="/study" element={<StudyPage />} />
              <Route path="/study/circles" element={<CirclesPage />} />
              <Route path="/study2" element={<StudyCollection />} />
              <Route path="/study/theology" element={<StudyBranch branch="theology" />} />
              <Route path="/study/creeds" element={<CreedsPage />} />
              <Route path="/study/creeds/:id" element={<CreedDocumentPage />} />
              <Route path="/study/hymns" element={<HymnsPage />} />
              <Route path="/study/hymns/:id" element={<HymnPage />} />
              <Route path="/study/manuscripts" element={<ManuscriptsPage />} />
              <Route path="/study/surviving-witnesses" element={<SurvivingWitnessesPage />} />
              <Route path="/study/passage-through-manuscripts" element={<PassageManuscriptsPage />} />
              <Route path="/study/israel-among-the-empires" element={<IsraelEmpiresPage />} />
              <Route path="/study/from-manuscript-to-printed-bible" element={<PrintRoomPage />} />
              <Route path="/study/world-of-jesus-and-apostles" element={<WorldStudyRedirect />} />
              <Route path="/study/world-of-jesus-apostles-complete" element={<WorldStudyRedirect />} />
              <Route path="/study/world-of-jesus-apostles" element={<MergedWorldPage />} />
              <Route path="/study/cities-through-their-layers" element={<CitiesLayersPage />} />
              <Route path="/study/how-the-canon-took-shape" element={<CanonPage />} />
              <Route path="/study/dead-sea-scrolls" element={<DeadSeaScrollsPage />} />
              <Route path="/study/discoveries-biblical-record" element={<DiscoveriesPage />} />
              <Route path="/study/from-discovery-to-history" element={<DiscoveriesPage />} />
              <Route path="/study/museum-archaeology" element={<MuseumArchaeologyPage />} />
              <Route path="/study/museum-archaeology/:slug" element={<MuseumPage />} />
              <Route path="/study/mesha-and-the-world-of-moab" element={<HistoricalStudyLanding study="mesha" />} />
              <Route path="/study/lachish-under-siege" element={<HistoricalStudyLanding study="lachish" />} />
              <Route path="/study/cyrus-restoration-and-return" element={<HistoricalStudyLanding study="cyrus" />} />
              <Route path="/study/academic" element={<StudyBranch branch="academic" />} />
              <Route path="/study/references" element={<ChartsPage />} />
              <Route path="/study/structure" element={<ChartsPage />} />
              <Route path="/study/gospels" element={<ChartsPage />} />
              <Route path="/study/versions" element={<ChartsPage />} />
              <Route path="/study/atlas/*" element={<AtlasPage />} />
              <Route path="/study/places/*" element={<AtlasRedirect />} />
              <Route path="/apologetics/*" element={<ApologeticsPage />} />
              <Route path="/apologetics2/*" element={<Apologetics2Redirect />} />
              <Route path="/study/harmony" element={<StudyRedirect />} />
              <Route path="/study/miracles" element={<MiraclesPage />} />
              <Route path="/study/letters/*" element={<LettersPage />} />
              <Route path="/mock/genealogy-curves" element={<CurvedGenealogyPage />} />
              <Route path="/mock/genealogy-circle-2" element={<CircularGenealogyPage familyBands />} />
              <Route path="/mock/genealogy-circle" element={<CircularGenealogyPage />} />
              <Route path="/study/long-memory" element={<LongMemoryPage />} />
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
              <Route path="/sources/reading/:id" element={<ReadingSourcePage />} />
              <Route path="/teachers/works/:id?" element={<LibraryWorkPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppFrame>
      </CatalogProvider>
      </PageTransitions>
      <CorrectionButton />
    </BrowserRouter>
    </MotionConfig>
  );
}
