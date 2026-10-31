// Mock-up pages: copies of real pages, opened at the page's name + "_mockup" (/home_mockup is the homepage), plus the
// drawing gallery at /mockups. They exist only on this computer's preview: on any other host (the live site) these
// routes are never added, so the pages cannot be opened there. A small "MOCK-UP" tag marks every one.
import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const HomePageMockup = lazy(() => import("./HomePageMockup"));
const HomePageMockup2 = lazy(() => import("./HomePageMockup2"));
const HomePageMockup3 = lazy(() => import("./HomePageMockup3"));
const HomePageMockup4 = lazy(() => import("./HomePageMockup4"));
const HomePageMockup5 = lazy(() => import("./HomePageMockup5"));
const HomePageMockup6 = lazy(() => import("./HomePageMockup6"));
const HomePageMockup7 = lazy(() => import("./HomePageMockup7"));
const HomePageMockup8 = lazy(() => import("./HomePageMockup8"));
const HomePageMockup9 = lazy(() => import("./HomePageMockup9"));
const DoorwaysMockupPage = lazy(() => import("./doorways/DoorwaysMockupPage"));
const HomeMockupsPage = lazy(() => import("@/pages/HomeMockupsPage"));
const StudyHubMockup = lazy(() => import("./StudyHubMockup"));
const QuizMockupPage = lazy(() => import("./QuizMockupPage"));
const WildernessMockupPage = lazy(() => import("./WildernessMockupPage"));
const QuizMoreMockupPage = lazy(() => import("./QuizMoreMockupPage"));
const QuizDoorMockupPage = lazy(() => import("./QuizDoorMockupPage"));
const QuestionsPanelsMockup = lazy(() => import("../QuestionsPage"));
const ThemesMockupPage = lazy(() => import("./ThemesMockupPage"));
const TestBannerMockupPage = lazy(() => import("./TestBannerMockupPage"));
const NearbyArtMockupPage = lazy(() => import("./NearbyArtMockupPage"));
const ChildrenMockupPage = lazy(() => import("./ChildrenMockupPage"));
const TestsTableMockup = lazy(() => import("./TestsTableMockup"));
const LearningMockupPage = lazy(() => import("./LearningMockupPage"));
const LearningMockupTitlePage = lazy(() => import("./LearningMockupPage").then((m) => ({ default: m.LearningMockupTitlePage })));
const ConnectionsHubMockup = lazy(() => import("./connections/ConnectionsHubMockup"));
const ConnectionsEntityMockup = lazy(() => import("./connections/ConnectionsEntityMockup"));
const MosesConnectedMockup = lazy(() => import("./connections/MosesConnectedMockup"));
const PersonConnectionsMockup = lazy(() => import("./connections/PersonConnectionsMockup"));
const PrivacyMockup = lazy(() => import("./legal/PrivacyMockup"));
const StudyConnectionsMockup = lazy(() => import("@/pages/study/connections/ConnectionsPage"));
const StudyVersionsMockup = lazy(() => import("@/pages/study/versions/EditionsPage"));
const SupportMockup = lazy(() => import("./legal/SupportMockup"));
const StructureMockup = lazy(() => import("./structure/StructureMockup"));
const TheologyCardsMockup = lazy(() => import("./theology-cards/TheologyCardsMockup"));

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);
export const MOCKUPS_ENABLED = typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname);

export function mockupRoutes() {
  if (!MOCKUPS_ENABLED) return null;
  return [
    <Route key="home" path="/home_mockup" element={<><MockupTag /><HomePageMockup /></>} />,
    <Route key="home2" path="/home_mockup2" element={<><MockupTag /><HomePageMockup2 /></>} />,
    // Four openings on a floating pill, with the sun, the manuscript art and the gold marquee (owner, 2026-10-30). No MOCK-UP tag: a mock-up shows only the real page (owner, 2026-10-28).
    <Route key="home3" path="/home_mockup3" element={<HomePageMockup3 />} />,
    // Newly drawn openings with the marquee at the very bottom of the screen (owner, 2026-10-30).
    <Route key="home4" path="/home_mockup4" element={<HomePageMockup4 />} />,
    // Six more openings with new drawings; the marquee takes a different shape in each (owner, 2026-10-30: "lets get very creative").
    <Route key="home5" path="/home_mockup5" element={<HomePageMockup5 />} />,
    // Four symmetrical openings in one gold-line look: ring, gate, four corners, the city (owner, 2026-10-30).
    <Route key="home6" path="/home_mockup6" element={<HomePageMockup6 />} />,
    // Four openings drawn from Scripture: the tabernacle, the lampstand, the vine, two pillars (owner, 2026-10-30).
    <Route key="home7" path="/home_mockup7" element={<HomePageMockup7 />} />,
    <Route key="home8" path="/home_mockup8" element={<HomePageMockup8 />} />,
    // The homepage's opening on phones, five ways, swapped by the pill at the bottom; looked at in the browser's own phone view (owner, 2026-10-31).
    <Route key="home9" path="/home_mockup9" element={<HomePageMockup9 />} />,
    <Route key="home-mobile" path="/home_mobile_mockups" element={<HomePageMockup9 />} />,
    // The six doorway squares' drawings, five of each, title only (owner, 2026-10-31).
    <Route key="doorways" path="/doorways_mockup" element={<DoorwaysMockupPage />} />,
    <Route key="study" path="/study_mockup" element={<><MockupTag /><StudyHubMockup /></>} />,
    <Route key="quiz" path="/quiz_mockup" element={<><MockupTag /><QuizMockupPage /></>} />,
    <Route key="wilderness" path="/wilderness_mockup" element={<><MockupTag /><WildernessMockupPage /></>} />,
    <Route key="quiz-more" path="/quiz_more_mockup" element={<><MockupTag /><QuizMoreMockupPage /></>} />,
    // The Study page's 03 section once per drawing for its Questions & Answers card (owner, 2026-10-24).
    <Route key="quiz-door" path="/quiz_door_mockup" element={<><MockupTag /><QuizDoorMockupPage /></>} />,
    // The questions page with a list under each section (owner, 2026-10-23); the page itself stays at /study/questions.
    <Route key="questions" path="/questions_mockup" element={<><MockupTag /><QuestionsPanelsMockup /></>} />,
    // The setup bars moved into the test page as its four options (2026-10-22); the old address leads there.
    <Route key="test-setup" path="/test_setup_mockup" element={<Navigate to="/study/questions/test" replace />} />,
    // The theme menu in three versions (owner, 2026-10-23); the menu itself stays on the test and questions pages.
    <Route key="themes" path="/themes_mockup" element={<><MockupTag /><ThemesMockupPage /></>} />,
    // The questions page's test banner in four versions, the settings where the button was (owner, 2026-10-23).
    <Route key="test-banner" path="/test_banner_mockup" element={<><MockupTag /><TestBannerMockupPage /></>} />,
    // The children's tests page in four directions (owner, 2026-10-23).
    <Route key="children" path="/children_mockup" element={<><MockupTag /><ChildrenMockupPage /></>} />,
    // Every test in one table: the whole Bible, each book and each theme, by level (owner, 2026-10-23).
    <Route key="tests" path="/tests_mockup" element={<><MockupTag /><TestsTableMockup /></>} />,
    <Route key="close-to-home" path="/close_to_home_mockup" element={<><MockupTag /><NearbyArtMockupPage /></>} />,
    <Route key="learning" path="/learning_mockup" element={<><MockupTag /><LearningMockupPage /></>} />,
    <Route key="learning-title" path="/learning_mockup/:titleId" element={<><MockupTag /><LearningMockupTitlePage /></>} />,
    // The connections graph, stage 2 of Plans/KNOWLEDGE-GRAPH.md: a way in, then one field per person, place or topic (owner, 2026-10-24).
    <Route key="connections" path="/connections_mockup" element={<><MockupTag /><ConnectionsHubMockup /></>} />,
    <Route key="connections-one" path="/connections_mockup/:kind/:id" element={<><MockupTag /><ConnectionsEntityMockup /></>} />,
    // The connections woven into the person pages (owner, 2026-10-25): Moses's page with a "Connected in Scripture"
    // section, and every person's full connections as a sub-page of their page.
    <Route key="moses-connected" path="/people_mockup/moses" element={<><MockupTag /><MosesConnectedMockup /></>} />,
    <Route key="person-connections" path="/people_mockup/:id/connections" element={<><MockupTag /><PersonConnectionsMockup /></>} />,
    // Connections in Scripture as one page, without the two chart cards (owner, 2026-10-29). No MOCK-UP tag: a mock-up shows only
    // what the real page would (owner, 2026-10-28).
    <Route key="study-connections" path="/study/connections_mockup" element={<StudyConnectionsMockup />} />,
    // Versions & languages as one page: timeline, then coverage, no cards and no "Choose an edition" (owner, 2026-10-29).
    <Route key="study-versions" path="/study/versions_mockup" element={<StudyVersionsMockup />} />,
    <Route key="privacy" path="/privacy_mockup" element={<><MockupTag /><PrivacyMockup /></>} />,
    <Route key="support" path="/support_mockup" element={<><MockupTag /><SupportMockup /></>} />,
    // The Structure collection as one section: parts, then books that open to their chapters and AI summaries, in
    // place of the Chapter atlas (owner, 2026-10-29). No MOCK-UP tag: a mock-up shows only the real page (owner, 2026-10-28).
    <Route key="structure" path="/study/structure_mockup" element={<StructureMockup />} />,
    // Two Scripture & Theology cards four ways each, as the real card: The shape of the Bible's titles, Versions &
    // languages' drawings (owner, 2026-10-29).
    <Route key="theology-cards" path="/study/theology_cards_mockup" element={<TheologyCardsMockup />} />,
    <Route key="gallery" path="/mockups" element={<HomeMockupsPage />} />,
  ];
}

function MockupTag() {
  return <div role="note" style={{ position: "fixed", left: 16, bottom: 16, zIndex: 9999, padding: "6px 12px", borderRadius: 999, background: "var(--accent)", color: "var(--page)", font: "600 11px Archivo, sans-serif", letterSpacing: ".18em", pointerEvents: "none" }}>MOCK-UP</div>;
}
