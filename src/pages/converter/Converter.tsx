// Section 01, the converter (design section 2 and its review). What is converted lives in the address
// (?kind=money&unit=talent-coin&amount=10000), read only through readChoice, which falls back to the defaults for anything
// it does not know, so a link never shows raw address text. Typing replaces the address entry; choosing a kind adds one.
// The day's wage is the reader's own, kept in this page only and never in the address or the browser's storage.
import { useEffect, useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { formatNumber } from "@/lib/site-format";
import { DEFAULT_UNIT, chosenSize, readChoice, type Choice } from "./choice";
import { DEFAULT_WAGE, formatAmount, modernUnitsOf, parseAmount, writeToday } from "./modern";
import { BIBLE_UNITS, CONFIDENCE_LABELS, KINDS, convert, unitsOf, type Kind } from "./units";
import { verseHref, verseReference } from "./verse";

export function Converter({ wage, onWage }: { wage: number; onWage: (wage: number) => void }) {
  const [params, setParams] = useSearchParams();
  const choice = readChoice(params);
  const { kind, unit, amount } = choice;
  const unitId = (unit.bible ?? unit.modern).id;
  const [text, setText] = useState(String(amount));
  const amountId = useId();
  const unitFieldId = useId();
  // A link or the back button changed the amount: show it, unless the field already says the same number.
  useEffect(() => { setText((current) => (parseAmount(current) === amount ? current : String(amount))); }, [amount]);
  const invalid = parseAmount(text) === null;

  const go = (next: { kind?: Kind; unit?: string; amount?: number }, replace: boolean) => {
    const nextKind = next.kind ?? kind;
    setParams(new URLSearchParams({ kind: nextKind, unit: next.unit ?? unitId, amount: String(next.amount ?? amount) }), { replace, preventScrollReset: true });
  };

  return <div className="cv-tool">
    <div className="cv-kinds" role="group" aria-label="What to convert">
      {KINDS.map((each) => <button key={each.key} type="button" aria-pressed={each.key === kind}
        onClick={() => each.key !== kind && go({ kind: each.key, unit: DEFAULT_UNIT[each.key], amount: 1 }, false)}>{each.title}</button>)}
    </div>
    <div className="cv-fields">
      <div className="cv-field">
        <label htmlFor={amountId}>Amount</label>
        <input id={amountId} type="text" inputMode="decimal" autoComplete="off" value={text} aria-invalid={invalid}
          aria-describedby={invalid ? `${amountId}-hint` : undefined}
          onChange={(event) => {
            setText(event.target.value);
            const value = parseAmount(event.target.value);
            if (value !== null) go({ amount: value }, true);
          }} />
        {invalid && <p id={`${amountId}-hint`} className="cv-hint">Type a number, such as 300 or 6.5.</p>}
      </div>
      <div className="cv-field">
        <label htmlFor={unitFieldId}>Unit</label>
        <select id={unitFieldId} value={unitId} onChange={(event) => go({ unit: event.target.value }, true)}>
          <optgroup label="In the Bible">
            {unitsOf(kind).map((each) => <option key={each.id} value={each.id}>{each.name}</option>)}
          </optgroup>
          {kind !== "money" && <optgroup label="Today">
            {modernUnitsOf(kind).map((each) => <option key={each.id} value={each.id}>{each.name}</option>)}
          </optgroup>}
        </select>
      </div>
      {kind === "money" && <WageField wage={wage} onWage={onWage} />}
    </div>
    <Result choice={choice} wage={wage} />
  </div>;
}

function WageField({ wage, onWage }: { wage: number; onWage: (wage: number) => void }) {
  const id = useId();
  const [text, setText] = useState(String(wage));
  const invalid = !parseAmount(text);
  const startWage = formatNumber(DEFAULT_WAGE, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return <div className="cv-field">
    <label htmlFor={id}>A day's wage today, in US dollars</label>
    <input id={id} type="text" inputMode="decimal" autoComplete="off" value={text} aria-invalid={invalid} aria-describedby={`${id}-note`}
      onChange={(event) => {
        setText(event.target.value);
        const value = parseAmount(event.target.value);
        if (value) onWage(value);
      }} />
    <p id={`${id}-note`} className="cv-hint">
      {invalid ? "Type an amount above zero, such as 120." : `Set it to what a day's work earns where you live. It starts at ${startWage} (8 hours at $15), stays on this page only, and is not part of a shared link.`}
    </p>
  </div>;
}

function Result({ choice, wage }: { choice: Choice; wage: number }) {
  const catalog = useCatalog();
  const { kind, unit, amount } = choice;
  const base = amount * chosenSize(unit);
  const [first, second] = writeToday(kind, base, wage);
  const named = unit.bible ? unit.bible.count(amount) : unit.modern.write(amount);
  const bible = unit.bible;
  const others = BIBLE_UNITS.filter((each) => each.kind === kind && each.id !== bible?.id);
  return <div className="cv-result">
    <p className="cv-answer" aria-live="polite">
      <span className="cv-from">{named}</span>
      <span className="cv-equals" aria-hidden="true">≈</span>
      <span className="cv-to">{first}</span>
      <span className="cv-to cv-to-2">{second}</span>
    </p>
    {kind === "money" && <p className="cv-quiet">The first figure is the work it stood for, counting a denarius as a labourer's day; the second is that work paid at your day's wage.</p>}
    {bible && <div className="cv-about">
      <p><strong>{bible.name}:</strong> {bible.equals}.{bible.alsoCalled && <> {`Also called: ${bible.alsoCalled}.`}</>}</p>
      <p className={`cv-sure cv-sure-${bible.confidence}`}>{CONFIDENCE_LABELS[bible.confidence]}</p>
      {bible.caution && <p className="cv-caution">{bible.caution}</p>}
      {bible.berean && <p className="cv-note">The Berean's note on <Link to={verseHref(catalog, bible.berean.verse)}>{verseReference(catalog, bible.berean.verse)}</Link>: <q>{bible.berean.text}</q></p>}
    </div>}
    <div className="cv-scroll" role="region" aria-label="The same amount in every unit" tabIndex={0}>
      <table className="cv-table">
        <caption>The same amount in every unit</caption>
        <thead><tr><th scope="col">Unit</th><th scope="col">Amount</th><th scope="col">How sure</th></tr></thead>
        <tbody>
          {others.map((each) => <tr key={each.id}>
            <th scope="row">{each.name}</th>
            <td>{formatAmount(convert(amount, unit.bible ?? unit.modern, each))}</td>
            <td>{CONFIDENCE_LABELS[each.confidence]}</td>
          </tr>)}
          {kind !== "money" && modernUnitsOf(kind).filter((each) => each.id !== unit.modern?.id).map((each) => <tr key={each.id}>
            <th scope="row">{each.name}</th>
            <td>{each.write(base / each.size)}</td>
            <td>Today's unit</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}

