// MOCK-UP: the test page the questions page's banner opens, at /study/questions/test on this computer's preview only.
// A placeholder until the owner and Claude design the real one (owner, 2026-10-22: "give that real care and real
// thought"). It keeps what was chosen on the questions page, so the way back returns to the same filters.
import { ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import "./questions-page.css";

export default function QuestionsTestPage() {
  const [params] = useSearchParams();
  const query = params.toString();
  return <div className="qp">
    <section className="qp-test-banner" aria-labelledby="qp-test-title">
      <div className="qp-test-copy">
        <p className="qp-eyebrow"><span></span>Study · Questions · Test</p>
        <h2 id="qp-test-title">The test page <em>is being designed.</em></h2>
        <p>This is where a real test will be taken, one question at a time, from the books and topics you choose.</p>
      </div>
      <div className="qp-test-action">
        <Link className="qp-test-go" to={`/study/questions${query ? `?${query}` : ""}`}><ArrowLeft size={17} strokeWidth={1.6} aria-hidden />Back to the questions</Link>
      </div>
    </section>
  </div>;
}
