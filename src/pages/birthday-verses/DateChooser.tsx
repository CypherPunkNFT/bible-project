// Month and Day selects (design 6.1, 7.5): a birthday without a year, so 29 February is always there and no browser's
// date field asks for a year nobody needs. The day list follows the month. Used by the hub and the occasion picker.
import { useId } from "react";
import { MONTH_SLUGS, dateKey, dayOf, daysIn, monthOf } from "./dates";
import { monthName } from "./format";

export function DateChooser({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const id = useId();
  const month = monthOf(value);
  const day = dayOf(value);
  const days = Array.from({ length: daysIn(month) }, (_, index) => index + 1);
  const chooseMonth = (next: number) => onChange(dateKey(next, Math.min(day, daysIn(next))));
  return (
    <div className="bv-chooser">
      <label htmlFor={`${id}-month`}>
        <span>Month</span>
        <select id={`${id}-month`} value={month} onChange={(event) => chooseMonth(Number(event.target.value))}>
          {MONTH_SLUGS.map((_, index) => <option key={index} value={index + 1}>{monthName(index + 1)}</option>)}
        </select>
      </label>
      <label htmlFor={`${id}-day`}>
        <span>Day</span>
        <select id={`${id}-day`} value={day} onChange={(event) => onChange(dateKey(month, Number(event.target.value)))}>
          {days.map((number) => <option key={number} value={number}>{number}</option>)}
        </select>
      </label>
    </div>
  );
}
