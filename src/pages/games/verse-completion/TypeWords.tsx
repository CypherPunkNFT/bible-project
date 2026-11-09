// Type with whole words: write the rest of the verse and press Check (design §5.2). Show next word fills in the
// earliest word still short of credit; that word then always scores zero. Enter checks, Shift+Enter starts a new line.
import { useRef, useState } from "react";
import { matchAnswer, withNextWord, type AnswerContext, type Result } from "./match";
import { MAX_CHARS } from "./passage";

export function TypeWords({ context, onDone, onDontKnow }: { context: Omit<AnswerContext, "hinted">; onDone: (result: Result, hinted: number) => void; onDontKnow: () => void }) {
  const [answer, setAnswer] = useState("");
  const [hinted, setHinted] = useState<ReadonlySet<number>>(new Set());
  const done = useRef(false);
  const full = { ...context, hinted };
  const nextWord = withNextWord(answer, full);

  const check = () => {
    if (done.current) return;
    done.current = true;
    if (!answer.trim()) { onDontKnow(); return; }
    onDone(matchAnswer(answer, full), hinted.size);
  };
  const hint = () => {
    if (!nextWord) return;
    setAnswer(nextWord.answer.slice(0, MAX_CHARS));
    setHinted(new Set([...hinted, nextWord.index]));
  };

  return <div className="vc-type">
    <label className="vc-label" htmlFor="vc-answer">Type the rest of the verse</label>
    <textarea id="vc-answer" className="vc-input" rows={3} value={answer} maxLength={MAX_CHARS} autoFocus
      autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="done"
      onChange={(event) => setAnswer(event.target.value.slice(0, MAX_CHARS))}
      onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); check(); } }} />
    <div className="vc-actions">
      <button type="button" className="vc-primary" onClick={check}>Check</button>
      <button type="button" className="vc-secondary" onClick={hint} disabled={!nextWord}>Show next word</button>
      <button type="button" className="vc-link" onClick={() => { if (!done.current) { done.current = true; onDontKnow(); } }}>I don't know</button>
    </div>
    {hinted.size > 0 && <p className="vc-note">{`Words shown: ${hinted.size}`}</p>}
  </div>;
}
