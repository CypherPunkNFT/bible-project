// The slide maker's choices: layout, font, background, slide shape, how many verses to a slide, text size, and three
// switches. Each group is a row of buttons (one pressed); a change goes straight into the address (options.ts).
import type { Choices as ChoiceSet } from "./options";
import { FONTS, LAYOUTS, PER_SLIDE, SHAPES, SIZES, THEMES } from "./templates";

interface Props { choices: ChoiceSet; onChange: (choices: ChoiceSet) => void }

function Group<T extends string>({ title, options, value, onPick, swatch }: {
  title: string;
  options: readonly { id: T; label: string; what?: string }[];
  value: T;
  onPick: (id: T) => void;
  swatch?: (id: T) => string | undefined;
}) {
  return (
    <fieldset className="ws-group">
      <legend>{title}</legend>
      <div className="ws-chips">
        {options.map((option) => (
          <button key={option.id} type="button" className="ws-chip" aria-pressed={option.id === value} title={option.what} onClick={() => onPick(option.id)}>
            {swatch && <span className="ws-swatch" style={{ background: swatch(option.id) }} aria-hidden="true" />}
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const swatchFor = (id: string) => {
  const theme = THEMES.find((item) => item.id === id);
  if (!theme) return undefined;
  if (theme.fill.kind === "solid") return `#${theme.fill.color}`;
  if (theme.fill.kind === "gradient") return `linear-gradient(135deg, #${theme.fill.from}, #${theme.fill.to})`;
  return "repeating-conic-gradient(#bbb 0 25%, #fff 0 50%) 0 0 / 8px 8px";
};

export function Choices({ choices, onChange }: Props) {
  const set = <K extends keyof ChoiceSet>(key: K, value: ChoiceSet[K]) => onChange({ ...choices, [key]: value });
  return (
    <section className="ws-choices" aria-label="Slide choices">
      <Group title="Layout" options={LAYOUTS} value={choices.layout} onPick={(id) => set("layout", id)} />
      <Group title="Font" options={FONTS} value={choices.font} onPick={(id) => set("font", id)} />
      <Group title="Background" options={THEMES} value={choices.theme} onPick={(id) => set("theme", id)} swatch={swatchFor} />
      <Group title="Slide shape" options={SHAPES} value={choices.shape} onPick={(id) => set("shape", id)} />
      <Group title="Verses on a slide" options={PER_SLIDE} value={choices.per} onPick={(id) => set("per", id)} />
      <Group title="Text size" options={SIZES} value={choices.size} onPick={(id) => set("size", id)} />
      <fieldset className="ws-group">
        <legend>Show</legend>
        <div className="ws-switches">
          <label><input type="checkbox" checked={choices.title} onChange={(event) => set("title", event.target.checked)} /> A title slide first</label>
          <label><input type="checkbox" checked={choices.numbers} onChange={(event) => set("numbers", event.target.checked)} /> Verse numbers</label>
          <label><input type="checkbox" checked={choices.footer} onChange={(event) => set("footer", event.target.checked)} /> The reference on each slide</label>
        </div>
      </fieldset>
    </section>
  );
}
