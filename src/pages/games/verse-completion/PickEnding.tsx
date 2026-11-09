// Pick at Easy and Medium: choose the right ending from three (design §5.1). One tap; then the right one is ticked and
// a wrong choice crossed, and the card shows the whole passage.
import { Check, X } from "lucide-react";

export function PickEnding({ options, right, chosen, onChoose }: { options: readonly string[]; right: number; chosen: number | null; onChoose: (index: number) => void }) {
  return <div className="vc-endings" role="group" aria-label="Choose the ending">
    {options.map((option, i) => {
      const state = chosen === null ? "" : i === right ? "is-right" : i === chosen ? "is-wrong" : "is-other";
      return <button key={i} type="button" className={`vc-ending ${state}`} disabled={chosen !== null} onClick={() => onChoose(i)}>
        {chosen !== null && i === right && <Check size={16} aria-hidden="true" />}
        {chosen !== null && i === chosen && i !== right && <X size={16} aria-hidden="true" />}
        <span>{option}</span>
        {chosen !== null && i === right && <span className="sr-only"> (the right ending)</span>}
        {chosen !== null && i === chosen && i !== right && <span className="sr-only"> (your choice, not right)</span>}
      </button>;
    })}
  </div>;
}
