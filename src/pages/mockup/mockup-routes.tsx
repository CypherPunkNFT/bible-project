// Mock-up pages: copies of real pages, opened at the page's name + "_mockup" (/home_mockup is the homepage), plus the
// drawing gallery at /mockups. They exist only on this computer's preview: on any other host (the live site) these
// routes are never added, so the pages cannot be opened there. A small "MOCK-UP" tag marks every one.
import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

const HomePageMockup = lazy(() => import("./HomePageMockup"));
const HomePageMockup2 = lazy(() => import("./HomePageMockup2"));
const HomeMockupsPage = lazy(() => import("@/pages/HomeMockupsPage"));
const StudyHubMockup = lazy(() => import("./StudyHubMockup"));
const QuizMockupPage = lazy(() => import("./QuizMockupPage"));
const WildernessMockupPage = lazy(() => import("./WildernessMockupPage"));
const QuizMoreMockupPage = lazy(() => import("./QuizMoreMockupPage"));
const QuestionsPanelsMockup = lazy(() => import("./QuestionsPage"));
const ThemesMockupPage = lazy(() => import("./ThemesMockupPage"));
const TestBannerMockupPage = lazy(() => import("./TestBannerMockupPage"));
const NearbyArtMockupPage = lazy(() => import("./NearbyArtMockupPage"));
const ChildrenMockupPage = lazy(() => import("./ChildrenMockupPage"));
const TestsTableMockup = lazy(() => import("./TestsTableMockup"));

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);
export const MOCKUPS_ENABLED = typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname);

export function mockupRoutes() {
  if (!MOCKUPS_ENABLED) return null;
  return [
    <Route key="home" path="/home_mockup" element={<><MockupTag /><HomePageMockup /></>} />,
    <Route key="home2" path="/home_mockup2" element={<><MockupTag /><HomePageMockup2 /></>} />,
    <Route key="study" path="/study_mockup" element={<><MockupTag /><StudyHubMockup /></>} />,
    <Route key="quiz" path="/quiz_mockup" element={<><MockupTag /><QuizMockupPage /></>} />,
    <Route key="wilderness" path="/wilderness_mockup" element={<><MockupTag /><WildernessMockupPage /></>} />,
    <Route key="quiz-more" path="/quiz_more_mockup" element={<><MockupTag /><QuizMoreMockupPage /></>} />,
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
    <Route key="gallery" path="/mockups" element={<HomeMockupsPage />} />,
  ];
}

function MockupTag() {
  return <div role="note" style={{ position: "fixed", left: 16, bottom: 16, zIndex: 9999, padding: "6px 12px", borderRadius: 999, background: "var(--accent)", color: "var(--page)", font: "600 11px Archivo, sans-serif", letterSpacing: ".18em", pointerEvents: "none" }}>MOCK-UP</div>;
}
