// The room-by-room order (design 4.4): nine stations, each a reading said by anyone, a short prayer said by the leader and
// "All: Amen.", with the verses the prayer rests on; then the Doxology and Numbers 6:24–26 said together. A family ticks
// the rooms they have and prints the order, which flows over as many pages as it needs.
import { useState } from "react";
import type { BlessingPage, Station } from "@/data/home-blessings";
import type { PageAnchors } from "./anchors";
import { RootedIn, VerseItem, type VerseState } from "./ItemPanel";
import { NO_PRINT_LINE } from "./PrintChooser";
import { printText, themeOf } from "./print-job";
import type { BlessingPrint } from "./useBlessingPrint";

function StationPanel({ station, anchors, verses }: { station: Station; anchors: PageAnchors["stations"][number]; verses: VerseState }) {
  const reading = verses.status === "ready" ? verses.verses.get(station.reading) : undefined;
  const aside = verses.status === "ready" && station.aside ? verses.verses.get(station.aside) : undefined;
  return (
    <section id={station.id} className="hb-station" aria-labelledby={`${station.id}-title`}>
      <div className="hb-panel">
        <h2 id={`${station.id}-title`}>{station.heading}{station.place && <span className="hb-place"> ({station.place})</span>}</h2>
        <h3>The reading</h3>
        {reading ? <ul className="hb-reading"><VerseItem verse={reading} id={anchors.reading} /></ul> : <div className="hb-loading" role="status">Loading the verse…</div>}
        <h3>The prayer</h3>
        <p className="hb-words hb-written"><span className="hb-mark">Leader: </span>{station.prayer}</p>
        <p className="hb-words hb-written"><span className="hb-mark">All: </span>Amen.</p>
        {aside && anchors.aside && <ul className="hb-aside"><VerseItem verse={aside} id={anchors.aside} /></ul>}
      </div>
      <RootedIn state={verses} passages={station.rootedIn} anchors={anchors.roots} titleId={`${station.id}-rooted`} />
    </section>
  );
}

function OrderPrint({ page, verses, printer }: { page: BlessingPage; verses: VerseState; printer: BlessingPrint }) {
  const stations = page.stations ?? [];
  const [ticked, setTicked] = useState<Set<string>>(() => new Set(stations.map((station) => station.id)));
  const toggle = (id: string, on: boolean) => setTicked((current) => { const next = new Set(current); if (on) next.add(id); else next.delete(id); return next; });
  const ready = verses.status === "ready" ? verses.verses : null;
  const print = () => {
    if (!ready) return;
    const chosen = stations.filter((station) => ticked.has(station.id)).map((station) => ({ station, reading: ready.get(station.reading)! }));
    printer.request({
      layout: "order", paper: printer.paper, slug: page.slug, theme: themeOf(page), texts: [], stations: chosen,
      closing: page.items.map((item) => printText(item, ready)), familyLine: "", nameHeading: "", name: "", guides: false,
    });
  };
  return (
    <section className="hb-set" aria-labelledby="hb-order-title">
      <h2 id="hb-order-title">Print the order</h2>
      <fieldset className="hb-set-list">
        <legend>Rooms to include</legend>
        {stations.map((station) => (
          <label key={station.id} className="hb-check">
            <input type="checkbox" checked={ticked.has(station.id)} onChange={(event) => toggle(station.id, event.target.checked)} /> {station.heading}
          </label>
        ))}
      </fieldset>
      <fieldset className="hb-choice">
        <legend>Paper</legend>
        <label><input type="radio" name="hb-order-paper" checked={printer.paper === "letter"} onChange={() => printer.setPaper("letter")} /> Letter</label>
        <label><input type="radio" name="hb-order-paper" checked={printer.paper === "a4"} onChange={() => printer.setPaper("a4")} /> A4</label>
      </fieldset>
      {printer.printable
        ? <button type="button" disabled={!ready || ticked.size === 0} onClick={print}>Print the order</button>
        : <p className="hb-hint">{NO_PRINT_LINE}</p>}
    </section>
  );
}

export function RoomByRoom({ page, anchors, verses, printer }: { page: BlessingPage; anchors: PageAnchors; verses: VerseState; printer: BlessingPrint }) {
  return (
    <>
      <OrderPrint page={page} verses={verses} printer={printer} />
      {(page.stations ?? []).map((station, index) => <StationPanel key={station.id} station={station} anchors={anchors.stations[index]} verses={verses} />)}
    </>
  );
}
