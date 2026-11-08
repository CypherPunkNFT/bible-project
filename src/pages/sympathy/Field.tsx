// One text field of the card maker, with its limit shown and enforced. What is typed is the visitor's own: drawn under
// translate="no" (so a name like Grace or Joy is never translated) and kept only in the page's memory.
import { useId } from "react";

export function Field({ label, value, limit, onChange, multiline = false, list }: {
  label: string; value: string; limit: number; onChange: (value: string) => void; multiline?: boolean; list?: string;
}) {
  const id = useId();
  const full = value.length >= limit;
  const common = {
    id, value, maxLength: limit, translate: "no" as const, dir: "auto", "aria-describedby": `${id}-limit`,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value.slice(0, limit)),
  };
  return (
    <div className="sy-field">
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea rows={4} {...common} /> : <input type="text" list={list} {...common} />}
      <small id={`${id}-limit`} className={full ? "sy-field-full" : undefined} aria-live="polite">
        {full ? `That is the most this field takes: ${limit} characters.` : `Up to ${limit} characters.`}
      </small>
    </div>
  );
}
