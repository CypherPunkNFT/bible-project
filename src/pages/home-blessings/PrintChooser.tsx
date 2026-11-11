// Choosing a print (design 6.1, 6.2): the layout, Letter or A4, the personal fields the layout takes, and the cut or fold
// guide. What is typed lives in this component's memory only: never saved, never in the address, never sent. "Print a
// set" fills sheets of four cards with the items a family ticks, for a grace jar or a week of bedtime cards.
import { useId, useState } from "react";
import type { BlessingItem, BlessingPage, PrintLayout } from "@/data/home-blessings";
import type { Paper } from "@/pages/life-events/print-sheet";
import type { ShownSympathy } from "@/pages/sympathy/useSympathyPassages";
import { plural } from "@/lib/site-format";
import { FAMILY_LINE_MAX, NAME_HEADING_MAX, NAME_MAX } from "./message";
import { printText, themeOf, type PrintJob } from "./print-job";
import type { BlessingPrint } from "./useBlessingPrint";

export const LAYOUT_LABELS: Record<PrintLayout, string> = {
  wall: "Wall print",
  cards: "Cards, four to a sheet",
  "table-card": "Folded table card",
  colouring: "Colouring page",
  order: "Room-by-room order",
};

export const NO_PRINT_LINE = "Open this page in your browser to print.";

/** Which personal fields a layout takes on a page (design 6.2). */
export function fieldsFor(page: BlessingPage, layout: PrintLayout, forSomeone: boolean) {
  return {
    familyLine: layout === "wall" && page.group === "house",
    nameHeading: (page.forChildren || page.group === "scripture") && (layout === "wall" || layout === "cards" || layout === "colouring"),
    name: forSomeone && layout !== "order",
  };
}

function PaperChoice({ paper, setPaper }: { paper: Paper; setPaper: (paper: Paper) => void }) {
  const name = useId();
  return (
    <fieldset className="hb-choice">
      <legend>Paper</legend>
      <label><input type="radio" name={name} checked={paper === "letter"} onChange={() => setPaper("letter")} /> Letter</label>
      <label><input type="radio" name={name} checked={paper === "a4"} onChange={() => setPaper("a4")} /> A4</label>
    </fieldset>
  );
}

function TextField({ label, value, max, onChange }: { label: string; value: string; max: number; onChange: (value: string) => void }) {
  return (
    <label className="hb-field">
      {label}
      <input type="text" value={value} maxLength={max} autoComplete="off" spellCheck={false} translate="no" dir="auto" onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

interface ChooserProps {
  page: BlessingPage;
  item: BlessingItem;
  verses: ReadonlyMap<unknown, ShownSympathy>;
  printer: BlessingPrint;
}

/** The print choices for one item. */
export function PrintChooser({ page, item, verses, printer }: ChooserProps) {
  const layouts = item.layouts as PrintLayout[];
  const [layout, setLayout] = useState<PrintLayout>(layouts[0]);
  const [familyLine, setFamilyLine] = useState("");
  const [nameHeading, setNameHeading] = useState("");
  const [name, setName] = useState("");
  const [guides, setGuides] = useState(true);
  const groupName = useId();
  const fields = fieldsFor(page, layout, item.kind === "written" && Boolean(item.forSomeone));
  const print = () => {
    const job: PrintJob = {
      layout, paper: printer.paper, slug: page.slug, theme: themeOf(page), texts: [printText(item, verses)],
      familyLine: fields.familyLine ? familyLine : "", nameHeading: fields.nameHeading ? nameHeading : "", name: fields.name ? name : "", guides,
    };
    printer.request(job);
  };
  return (
    <div className="hb-print">
      {layouts.length > 1 && (
        <fieldset className="hb-choice">
          <legend>Layout</legend>
          {layouts.map((option) => (
            <label key={option}><input type="radio" name={groupName} checked={layout === option} onChange={() => setLayout(option)} /> {LAYOUT_LABELS[option]}</label>
          ))}
        </fieldset>
      )}
      {layouts.length === 1 && <p className="hb-hint">{LAYOUT_LABELS[layout]}</p>}
      <PaperChoice paper={printer.paper} setPaper={printer.setPaper} />
      {fields.familyLine && <TextField label="Family line (optional), such as “The Smith home”" value={familyLine} max={FAMILY_LINE_MAX} onChange={setFamilyLine} />}
      {fields.nameHeading && <TextField label="A heading above the words (optional), such as “For Lily”" value={nameHeading} max={NAME_HEADING_MAX} onChange={setNameHeading} />}
      {fields.name && <TextField label="Their name (left empty, the print has a line to write it)" value={name} max={NAME_MAX} onChange={setName} />}
      {(layout === "cards" || layout === "table-card") && (
        <label className="hb-check"><input type="checkbox" checked={guides} onChange={(event) => setGuides(event.target.checked)} /> {layout === "cards" ? "Cut guides" : "Fold guide"}</label>
      )}
      <button type="button" onClick={print}>Print now</button>
      <p className="hb-hint">Typed words stay on this page and are never saved or sent.</p>
    </div>
  );
}

/** "Print a set": several items as cards, four to a sheet, in page order. */
export function PrintSet({ page, verses, printer }: Omit<ChooserProps, "item">) {
  const choices = page.items.filter((item) => (item.layouts as PrintLayout[]).includes("cards") && !(item.kind === "written" && item.forSomeone));
  const [chosen, setChosen] = useState<Set<string>>(() => new Set());
  const [nameHeading, setNameHeading] = useState("");
  const [guides, setGuides] = useState(true);
  const fields = fieldsFor(page, "cards", false);
  const toggle = (id: string, on: boolean) => setChosen((current) => { const next = new Set(current); if (on) next.add(id); else next.delete(id); return next; });
  const picked = choices.filter((item) => chosen.has(item.id));
  const print = () => printer.request({
    layout: "cards", paper: printer.paper, slug: page.slug, theme: themeOf(page), texts: picked.map((item) => printText(item, verses)),
    familyLine: "", nameHeading: fields.nameHeading ? nameHeading : "", name: "", guides,
  });
  return (
    <section className="hb-set" aria-labelledby="hb-set-title">
      <h2 id="hb-set-title">Print a set</h2>
      <p>Tick several and print them together as cards, four to a sheet: a grace jar for the table, or a week of bedtime cards.</p>
      <fieldset className="hb-set-list">
        <legend>Cards to print</legend>
        {choices.map((item) => (
          <label key={item.id} className="hb-check">
            <input type="checkbox" checked={chosen.has(item.id)} onChange={(event) => toggle(item.id, event.target.checked)} /> {printText(item, verses).heading}
          </label>
        ))}
      </fieldset>
      <PaperChoice paper={printer.paper} setPaper={printer.setPaper} />
      {fields.nameHeading && <TextField label="A heading on every card (optional), such as “For Lily”" value={nameHeading} max={NAME_HEADING_MAX} onChange={setNameHeading} />}
      <label className="hb-check"><input type="checkbox" checked={guides} onChange={(event) => setGuides(event.target.checked)} /> Cut guides</label>
      {printer.printable
        ? <button type="button" disabled={!picked.length} onClick={print}>{plural(picked.length, "Print one card", "Print {n} cards")}</button>
        : <p className="hb-hint">{NO_PRINT_LINE}</p>}
    </section>
  );
}
