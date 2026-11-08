// /games/live-quiz: the leader's page of the live youth-group quiz (docs/features/live-quiz/design.md), loaded by the
// games hub (../registry.ts). Setup until a room is created; then the live room, found again after a reload from this
// browser's storage. Players join on their phones at /play (PlayPage.tsx).
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadQuestionBank } from "@/lib/data";
import { useAsync } from "@/lib/useAsync";
import { LeaderRoom } from "./LeaderRoom";
import { saveHost, savedHost, type SavedHost } from "./saved";
import { Setup } from "./Setup";
import "../games.css";
import "./live-quiz.css";

function useNarrowScreen() {
  const [narrow, setNarrow] = useState(() => window.innerWidth < 900);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return narrow;
}

export default function LiveQuizGame() {
  useEffect(() => { document.title = "Live Bible Quiz · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const [host, setHost] = useState<SavedHost | null>(() => savedHost());
  const [attempt, setAttempt] = useState(0);
  const bank = useAsync(loadQuestionBank, `live-quiz-bank-${attempt}`);
  const narrow = useNarrowScreen();
  const ready = bank.status === "ready" ? bank.value : null;

  const leave = () => { saveHost(null); setHost(null); };
  const created = (room: SavedHost) => { saveHost(room); setHost(room); };

  return <div className="lq-page">
    <div className="lq-wrap">
      <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
      {host ? <LeaderRoom host={host} bank={ready} onLeave={leave} /> : <>
        <p className="lq-kick">Live quiz</p>
        <h1 className="lq-title">A Bible quiz for the whole room</h1>
        <p className="lq-lead">Show this screen on a projector; players join on their phones — no app, no account. Faster right answers score more, and every answer comes with its verse.</p>
        {narrow && <p className="lq-warn">The leader screen is made for a laptop on a projector. It still works here, for trying it out.</p>}
        {bank.status === "loading" && <p className="lq-note">Loading the questions…</p>}
        {bank.status === "error" && <div className="lq-error" role="alert">
          <p>The questions could not be loaded.</p>
          <button type="button" className="lq-button lq-quiet" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
        </div>}
        {ready && <Setup bank={ready} onCreated={created} />}
      </>}
    </div>
  </div>;
}
