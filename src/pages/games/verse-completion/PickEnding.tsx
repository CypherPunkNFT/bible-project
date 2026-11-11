// Pick at Easy and Medium: choose the right ending from three (design §5.1). The endings are the kit's answer cards:
// dealt in with a stagger, lifted on hover and focus, pressed on tap. One tap; then the chosen card settles right
// (tint, tick) or wrong (tint, dashed edge, a shake) while the right one is ticked and the rest fade.
import { AnswerCard, type AnswerState } from "../kit";

export function PickEnding({ options, right, chosen, onChoose }: { options: readonly string[]; right: number; chosen: number | null; onChoose: (index: number) => void }) {
  return <div className="vc-endings" role="group" aria-label="Choose the ending">
    {options.map((option, i) => {
      const state: AnswerState = chosen === null ? "idle" : i === right ? "right" : i === chosen ? "wrong" : "faded";
      return <AnswerCard key={i} index={i} state={state} className="vc-ending" disabled={chosen !== null} onClick={() => onChoose(i)}>
        <span>{option}</span>
        {chosen !== null && i === right && <span className="sr-only"> (the right ending)</span>}
        {chosen !== null && i === chosen && i !== right && <span className="sr-only"> (your choice, not right)</span>}
      </AnswerCard>;
    })}
  </div>;
}
