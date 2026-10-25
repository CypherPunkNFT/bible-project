// MOCK-UP: the study hub's third section, "03 / Test what you know", leading to the questions page (/study/questions).
// It takes the place of the hub's closing "Begin with a question" section in StudyHubMockup.tsx. Built like sections
// 01 and 02 (owner, 2026-10-24: "a section just like 01 and 02, white and yellow … the same format as all the rest"):
// the same heading, then one card made like the Writers of Scripture card (hub.css's people-feature), laid out wide
// with the words on the left and the drawing on the right.
import { Icon, StudyLink } from "@/pages/study/hub/shared";
import "./quiz-door.css";

export function QuizDoor() {
  return <section className="hub-section quiz-section" id="questions" aria-labelledby="questions-title">
    <div className="section-heading"><div><p className="eyebrow">03 / Test what you know</p><h2 id="questions-title">How well do you<br /><em>know the Bible?</em></h2></div><p>Ask a question, find its answer, then remember the passage behind it.</p></div>
    <article className="people-feature quiz-feature">
      <div className="feature-kicker"><span>Questions &amp; answers</span><span>Ask → Answer → Remember</span></div>
      <div className="quiz-feature-body">
        <div className="quiz-feature-words">
          <h3>Questions &amp; Answers</h3>
          <p>Thousands of questions asked in Sunday schools, catechism classes and Bible quizzes, each with its answer and the passage behind it.</p>
        </div>
        <div className="quiz-art" aria-hidden="true"><QuizArt /></div>
      </div>
      <div className="people-footer">
        <ul className="door-subjects"><li>Bible quizzes</li><li>Sunday school lessons</li><li>Catechisms</li></ul>
        <StudyLink className="feature-link" to="/study/questions"><span>Explore the questions</span><span className="door-arrow"><Icon name="arrow"/></span></StudyLink>
      </div>
    </article>
  </section>;
}

function QuizArt() {
  return <svg viewBox="0 0 580 250" fill="none">
    <ellipse cx="290" cy="132" rx="215" ry="88" stroke="currentColor" opacity=".08"/>
    <path d="M88 204H492" stroke="currentColor" opacity=".18"/>
    <g className="quiz-cards">
      <rect x="196" y="52" width="196" height="140" rx="9" transform="rotate(-7 294 122)" fill="var(--art-ground)" stroke="currentColor" opacity=".35"/>
      <rect x="196" y="52" width="196" height="140" rx="9" transform="rotate(4 294 122)" fill="var(--art-ground)" stroke="currentColor" opacity=".5"/>
      <g className="quiz-front">
        <rect x="190" y="46" width="208" height="150" rx="10" fill="var(--art-ground)" stroke="currentColor" strokeWidth="1.3"/>
        <text x="214" y="98" className="quiz-mark">?</text>
        <g stroke="currentColor" opacity=".45"><path d="M252 72H372"/><path d="M252 82H352"/><path d="M252 92H330"/></g>
        <g stroke="currentColor"><circle cx="220" cy="125" r="6" opacity=".45"/><path d="M234 125H330" opacity=".3"/><circle cx="220" cy="148" r="6" fill="currentColor" fillOpacity=".16"/><path d="M216.5 148l2.5 2.5 5-5" strokeWidth="1.4"/><path d="M234 148H352" opacity=".6"/><circle cx="220" cy="171" r="6" opacity=".45"/><path d="M234 171H318" opacity=".3"/></g>
      </g>
    </g>
    <g stroke="currentColor" opacity=".4"><path d="M106 70H168M412 92H468M294 212V228"/><circle cx="106" cy="70" r="3" fill="var(--art-ground)"/><circle cx="468" cy="92" r="3" fill="var(--art-ground)"/><circle cx="294" cy="229" r="3" fill="var(--art-ground)"/></g>
    <text x="74" y="56" className="art-label">ASK</text><text x="440" y="78" className="art-label">ANSWER</text><text x="294" y="249" textAnchor="middle" className="art-label">REMEMBER</text>
  </svg>;
}
