// /games/quiz: the homepage's twelve-question quiz (src/pages/home/HomeQuiz.tsx), unchanged, on a page of its own so the
// games hub can link straight to it. .qv-page gives it the colour it takes from the homepage (quiz-versions.css), as the
// quiz mock-ups do; home-hub.css brings the shared homepage type (eyebrow, page width).
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { HomeQuiz } from "@/pages/home/HomeQuiz";
import "@/components/home/home-hub.css";
import "../games.css";

export default function QuizGame() {
  useEffect(() => { document.title = "Bible Quiz · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  return <div className="qv-page gm-quiz">
    <div className="home-wrap">
      <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
      <h1 className="sr-only">Bible quiz</h1>
    </div>
    <HomeQuiz />
  </div>;
}
