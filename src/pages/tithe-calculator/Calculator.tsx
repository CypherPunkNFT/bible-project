// Sections 01 and 02 of /tithe-calculator (design sections 3 and 8): the fields and the figures, and the same income at
// other percentages. Everything typed lives in the page's own state only: no form element (Enter can never send it to
// the address), no field names, no storage. The figures are not a live region; one status sentence, there from the
// start, is rewritten once typing pauses, so a screen reader is not told every keystroke.
import { useEffect, useId, useState } from "react";
import { numberFormat } from "@/lib/site-format";
import { CURRENCIES, formatMoney, formatPercent, giving, isPeriod, type Entry } from "./giving";

const QUICK_PERCENTS = [5, 10, 15, 20] as const;
const TABLE_PERCENTS = [5, 10, 12, 15, 20, 25] as const;
const ANNOUNCE_AFTER_MS = 700;

/** "USD ($)": the code, and the currency's own sign where it has a different one. */
function currencyLabel(code: string): string {
  try {
    const sign = numberFormat({ style: "currency", currency: code, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((part) => part.type === "currency")?.value;
    return sign && sign !== code ? `${code} (${sign})` : code;
  } catch {
    return code;
  }
}

export function Calculator({ entry, onEntry, amount, percent }: { entry: Entry; onEntry: (entry: Entry) => void; amount: number | null; percent: number | null }) {
  const id = useId();
  const set = (change: Partial<Entry>) => onEntry({ ...entry, ...change });
  const amountBad = entry.amountText.trim() !== "" && amount === null;
  const percentBad = percent === null;
  return <div className="tc-tool">
    <div className="tc-fields">
      <div className="tc-field">
        <label htmlFor={`${id}-amount`}>Income</label>
        <input id={`${id}-amount`} type="text" inputMode="decimal" autoComplete="off" dir="ltr" value={entry.amountText}
          aria-invalid={amountBad} aria-describedby={`${id}-amount-note`} onChange={(event) => set({ amountText: event.target.value })} />
        <p id={`${id}-amount-note`} className="tc-hint">
          {amountBad ? "Type an amount above zero in figures, such as 2500 or 2,500.50." : amount !== null ? `Counted as ${formatMoney(amount, entry.currency)}.` : "What you receive, in figures."}
        </p>
      </div>
      <div className="tc-field">
        <label htmlFor={`${id}-period`}>How often</label>
        <select id={`${id}-period`} value={entry.period} onChange={(event) => isPeriod(event.target.value) && set({ period: event.target.value })}>
          <option value="week">Every week</option>
          <option value="two-weeks">Every two weeks</option>
          <option value="half-month">Twice a month</option>
          <option value="month">Every month</option>
          <option value="year">Every year</option>
        </select>
      </div>
      <div className="tc-field">
        <label htmlFor={`${id}-currency`}>Currency</label>
        <select id={`${id}-currency`} value={entry.currency} onChange={(event) => set({ currency: event.target.value })}>
          {CURRENCIES.map((code) => <option key={code} value={code} translate="no">{currencyLabel(code)}</option>)}
          <option value="">No currency sign</option>
        </select>
      </div>
    </div>
    <div className="tc-field tc-percent">
      <span className="tc-label" id={`${id}-percent-label`}>Percentage to give</span>
      <div className="tc-quick" role="group" aria-labelledby={`${id}-percent-label`}>
        {QUICK_PERCENTS.map((each) => <button key={each} type="button" aria-pressed={percent === each} onClick={() => set({ percentText: String(each) })}>
          <bdi>{formatPercent(each)}</bdi>{each === 10 && <span className="tc-tenth">a tenth</span>}
        </button>)}
        <label className="tc-other">
          <span>Or type a percentage</span>
          <input type="text" inputMode="decimal" autoComplete="off" dir="ltr" value={entry.percentText} aria-invalid={percentBad}
            aria-describedby={percentBad ? `${id}-percent-note` : undefined} onChange={(event) => set({ percentText: event.target.value })} />
        </label>
      </div>
      {percentBad && <p id={`${id}-percent-note`} className="tc-hint tc-bad">Type a percentage above 0 and up to 100, with at most two decimals, such as 10 or 12.5.</p>}
    </div>
    <p className="tc-quiet">Christians answer differently whether to give from income before or after tax. Type the figure you have decided on.</p>
    <Result entry={entry} amount={amount} percent={percent} />
  </div>;
}

function Result({ entry, amount, percent }: { entry: Entry; amount: number | null; percent: number | null }) {
  const sums = amount !== null && percent !== null ? giving(amount, entry.period, percent) : null;
  const money = (value: number) => formatMoney(value, entry.currency);
  const summary = sums && percent !== null
    ? `Giving ${formatPercent(percent)} comes to ${money(sums.perWeek)} a week, ${money(sums.perMonth)} a month and ${money(sums.perYear)} a year.`
    : "";
  const [announced, setAnnounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setAnnounced(summary), ANNOUNCE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [summary]);
  const showPay = entry.period === "two-weeks" || entry.period === "half-month";
  return <div className="tc-result">
    <p className="tc-sr" role="status">{announced}</p>
    {!sums ? <p className="tc-prompt">{entry.amountText.trim() === "" ? "Type your income to see what your giving comes to." : "Correct the field marked above to see the figures."}</p> : <>
      <dl className="tc-figures" data-testid="tc-figures">
        <div><dt>Each week</dt><dd><bdi>{money(sums.perWeek)}</bdi></dd></div>
        <div><dt>Each month</dt><dd><bdi>{money(sums.perMonth)}</bdi></dd></div>
        <div><dt>Each year</dt><dd><bdi>{money(sums.perYear)}</bdi></dd></div>
        {showPay && <div><dt>Each pay</dt><dd><bdi>{money(sums.perPay)}</bdi></dd></div>}
      </dl>
      <p className="tc-quiet">{`From a yearly income of ${money(sums.yearlyIncome)}.`}</p>
      <p className="tc-quiet tc-tight">A month here is a twelfth of a year, about 4.33 weeks. Each figure is rounded on its own, so twelve months may differ from the year by a cent.</p>
    </>}
  </div>;
}

/** Section 02: the same income at other percentages, the chosen one among them and marked. */
export function PercentTable({ entry, amount, percent }: { entry: Entry; amount: number | null; percent: number | null }) {
  if (amount === null) return <p className="tc-prompt">Type your income above to compare percentages.</p>;
  const rows = [...new Set([...TABLE_PERCENTS, ...(percent === null ? [] : [percent])])].sort((a, b) => a - b);
  const money = (value: number) => formatMoney(value, entry.currency);
  return <div className="tc-scroll" role="region" aria-label="Giving at other percentages" tabIndex={0}>
    <table className="tc-table">
      <caption>Giving at other percentages</caption>
      <thead><tr><th scope="col">Percentage</th><th scope="col">Each week</th><th scope="col">Each month</th><th scope="col">Each year</th></tr></thead>
      <tbody>
        {rows.map((each) => {
          const sums = giving(amount, entry.period, each);
          const chosen = each === percent;
          return <tr key={each} className={chosen ? "tc-chosen" : undefined}>
            <th scope="row"><bdi>{formatPercent(each)}</bdi>{chosen && <span className="tc-yours">Your choice</span>}</th>
            <td><bdi>{money(sums.perWeek)}</bdi></td>
            <td><bdi>{money(sums.perMonth)}</bdi></td>
            <td><bdi>{money(sums.perYear)}</bdi></td>
          </tr>;
        })}
      </tbody>
    </table>
  </div>;
}
