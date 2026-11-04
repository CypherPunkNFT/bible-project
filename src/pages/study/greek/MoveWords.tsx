// Section 01, the page's central comparison: the clause of John 3:16 in any of its six orders, with the same order in English beside it,
// and a switch that swaps the endings instead. The units are in the real reading order, and focus follows the unit the reader pressed.
import { useEffect, useRef } from "react";
import { D, DEFAULT_ORDER, englishReads, findOrder, G, moveToFront, unitsOf, unitText, type Unit } from "./model";
import { Cite, Gk, Head, Quote, Test, ThreeParts } from "./parts";

const ROLE: Record<Unit, string> = { v: "the verb", s: "who acts", o: "who receives" };
const SHORT: Record<Unit, string> = { v: "verb", s: "acts", o: "receives" };
const READS = {
  same: "English says the same, because the doer comes first.",
  opposite: "English now says the opposite. The Greek has not changed its meaning at all.",
  broken: "That is not a plain English sentence. The Greek still says the same thing.",
};

function sentenceCase(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

export function MoveWords({ orderValue, swapValue, onParam }: { orderValue: string | null; swapValue: string | null; onParam: (name: string, value: string | null) => void }) {
  const order = findOrder(orderValue), swapped = swapValue === "1";
  const units = unitsOf(order);
  const row = useRef<HTMLOListElement>(null);
  const refocus = useRef<Unit | null>(null);
  useEffect(() => {
    if (refocus.current) row.current?.querySelector<HTMLButtonElement>(`[data-unit="${refocus.current}"]`)?.focus();
    refocus.current = null;
  }, [order]);
  const setOrder = (next: string) => onParam("order", next === DEFAULT_ORDER ? null : next);
  const doer = unitText("s", swapped).english, receiver = unitText("o", swapped).english;
  const reads = englishReads(order);
  return <>
    <Head title={<>Move the words.<em> Nothing breaks.</em></>}
      lead={<>Five words from John 3:16, a clause of “For God so loved the world”. Press a word group to send it to the front, and watch what happens to the English beneath it.</>} />
    <div className="ng-move">
      <ol ref={row} className="ng-units" aria-label="The clause, in its present order">
        {units.map((unit) => { const text = unitText(unit, swapped); return <li key={unit}>
          <button type="button" data-unit={unit} onClick={() => { refocus.current = unit; setOrder(moveToFront(order, unit)); }} aria-label={`${text.say}, ${ROLE[unit]}. Send to the front.`}>
            <span lang="grc" className={`ng-unit-gk ${unit === "s" ? "ng-mark-N" : unit === "o" ? "ng-mark-A" : ""}`}>{text.greek}</span>
            <small>{text.english}</small><b>{ROLE[unit]}</b>
          </button>
        </li>; })}
      </ol>
      <div className="ng-readings" aria-live="polite">
        <div><p className="ng-kicker">What the Greek says</p><p className="ng-reading">{sentenceCase(doer)} loved {receiver}.</p></div>
        <div><p className="ng-kicker">The same order in English</p>
          <p className={`ng-reading ng-${reads}`}>{sentenceCase(units.map((u) => unitText(u, swapped).english).join(" "))}{reads === "broken" ? "?" : "."}</p>
          <p className="ng-verdict">{READS[reads]}</p></div>
      </div>
      <ul className="ng-orders" aria-label="All six orders">
        {D.moved.orders.map((o) => <li key={o.id}><button type="button" aria-pressed={o.id === order} onClick={() => setOrder(o.id)}>{unitsOf(o.id).map((u) => SHORT[u]).join(" · ")}{o.note && <small> ({o.note})</small>}</button></li>)}
      </ul>
      <div className="ng-swap">
        <button type="button" aria-pressed={swapped} onClick={() => onParam("swap", swapped ? null : "1")}>{swapped ? "Put the endings back" : "Now swap the endings instead"}</button>
        <p>{swapped ? <>Same places, with <Gk>ὁ κόσμος</Gk> and <Gk>τὸν θεόν</Gk> now. {D.moved.madeUp}</> : <>The change from <Gk>ὁ θεὸς</Gk> to <Gk>ὁ κόσμος</Gk> is what turns the sentence round. Moving the words never does.</>}</p>
      </div>
    </div>
    <Quote label={G.moved.label} />
    <ThreeParts {...D.records.order} />
    <Test kicker="Your turn" question={D.claims.order.question} options={D.claims.order.options} />
    <Cite ids={["stepTagnt", "levinsohn"]} />
  </>;
}
