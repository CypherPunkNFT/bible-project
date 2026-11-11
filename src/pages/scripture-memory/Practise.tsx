// Scripture memory: the open passage (design §6, shelf 02): its step, today's faded text, peeking, and the four actions.
// The text loads from the Berean when the passage is opened; a failed load offers Try again and turns the actions off.
import { forwardRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { useAsync } from "@/lib/useAsync";
import { verseReference } from "@/lib/verses";
import { FadedVerse } from "./FadedVerse";
import { KNOWN } from "./fade";
import { STEP_TEXT, stepLabel } from "./steps";
import { doneToday, isKnown, type MemoryVerse } from "./progress";
import { loadPassage, readerHref } from "./verse";

interface PractiseProps {
  verse: MemoryVerse;
  day: number;
  onSaid: () => void;
  onBack: () => void;
  onStartOver: () => void;
  onRemove: () => void;
}

export const Practise = forwardRef<HTMLHeadingElement, PractiseProps>(function Practise({ verse, day, onSaid, onBack, onStartOver, onRemove }, heading) {
  const catalog = useCatalog();
  const [attempt, setAttempt] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const state = useAsync(() => loadPassage(catalog, verse.from, verse.to), `scripture-memory:${verse.from}-${verse.to}:${attempt}`);
  const reference = verseReference(catalog, verse.from, verse.to);
  const ready = state.status === "ready" && state.value.ok;

  return <div className="sm-practise">
    <div className="sm-practise-head">
      <h3 ref={heading} tabIndex={-1}>{reference}</h3>
      <p className="sm-step"><span className="sm-meter" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((n) => <span key={n} className={n < verse.stage ? "is-on" : ""} />)}</span>{stepLabel(verse.stage)}</p>
    </div>
    <p className="sm-quiet">{STEP_TEXT[Math.min(verse.stage, KNOWN)].label}</p>
    {state.status === "loading" && <p className="sm-quiet">Loading the verse…</p>}
    {state.status === "error" && <p className="sm-bad">This verse couldn't load. Check your connection.
      <button type="button" className="sm-link" onClick={() => setAttempt((n) => n + 1)}>Try again</button></p>}
    {state.status === "ready" && !state.value.ok && <p className="sm-bad">{state.value.error}</p>}
    {ready && state.status === "ready" && state.value.ok && <>
      <button type="button" className="sm-link sm-show" aria-pressed={showAll} onClick={() => setShowAll((value) => !value)}>
        {showAll ? "Hide the words again" : "Show every word"}
      </button>
      <FadedVerse text={state.value.text} from={verse.from} to={verse.to} stage={verse.stage} showAll={showAll} />
      <p className="sm-quiet sm-tight">Berean Standard Bible · <Link to={readerHref(catalog, verse.from, verse.to)}>Read it in context</Link></p>
    </>}
    <div className="sm-actions">
      <button type="button" className="sm-primary" disabled={!ready} onClick={onSaid}>
        {isKnown(verse) ? "I said it again today" : "I said it today"}
      </button>
      <button type="button" className="sm-secondary" disabled={verse.stage === 0} onClick={onBack}>Step back</button>
      <button type="button" className="sm-secondary" disabled={verse.stage === 0 && verse.last === 0} onClick={onStartOver}>Start over</button>
      <button type="button" className="sm-link" onClick={onRemove}>Remove from my verses</button>
    </div>
    <p className="sm-quiet">{doneToday(verse, day)
      ? "Done for today. One step per calendar day: come back tomorrow for the next one."
      : isKnown(verse) ? "Say it from memory, then tap the button to mark today." : "Say it aloud, then tap the button to take today's step."}</p>
  </div>;
});
