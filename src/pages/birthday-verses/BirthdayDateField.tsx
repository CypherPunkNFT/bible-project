// "Your verse for your birthday" inside the occasion picker's Birthday occasion (docs/features/birthday-verses/design.md
// 7.5): the same Month and Day selects as the hub, the date's reference and note, the picker's own "Add to our list",
// and a link to the date's page and card. The date is never put in the picker's address.
import { useState } from "react";
import { Link } from "react-router-dom";
import { passageKey } from "@/data/sympathy";
import { useCatalog } from "@/lib/catalog";
import { DateChooser } from "./DateChooser";
import { datePath, todayOf } from "./dates";
import { birthdayPassage, passageReference } from "./verse";
import "./birthday-verses.css";

export function BirthdayDateField({ chosen, onToggle }: { chosen: ReadonlySet<string>; onToggle: (key: string) => void }) {
  const catalog = useCatalog();
  const [date, setDate] = useState(() => todayOf(new Date()));
  const passage = birthdayPassage(date);
  if (!passage) return null;
  const key = passageKey(passage);
  return (
    <section className="ov-birthday-date" aria-labelledby="ov-birthday-date-title">
      <h3 id="ov-birthday-date-title">Your verse for your birthday</h3>
      <DateChooser value={date} onChange={setDate} />
      <p className="ov-birthday-verse"><strong>{passageReference(catalog, passage)}</strong> <span>{passage.note}</span></p>
      <label className="ov-add">
        <input type="checkbox" checked={chosen.has(key)} onChange={() => onToggle(key)} />
        <span>Add to our list</span>
      </label>
      <p><Link to={datePath(date)}>Open this date's page and card</Link></p>
    </section>
  );
}
