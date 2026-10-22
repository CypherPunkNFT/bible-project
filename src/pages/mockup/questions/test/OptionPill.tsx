// The mock-up's switcher: a pill floating at the bottom of the screen that swaps the whole page between options A to D.
import type { PageOption } from "./options-list";

export function OptionPill({ options, current, onChoose }: { options: PageOption[]; current: string; onChoose: (id: string) => void }) {
  return <nav className="to-pill" aria-label="Mock-up: four versions of this page">
    <span className="to-pill-label">Mock-up</span>
    {options.map((o) => <button key={o.id} type="button" aria-pressed={o.id === current} onClick={() => onChoose(o.id)}>
      <b>{o.id.toUpperCase()}</b><span>{o.name}</span>
    </button>)}
  </nav>;
}
