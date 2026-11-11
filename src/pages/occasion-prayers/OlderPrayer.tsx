// "An older prayer" (design 5.2 item 6): a verified historic text exactly as printed, in English whatever language the
// site is shown in (the Crown permission covers that English text), with its source, the one-line explanation of an old
// word, and Copy / Send / Print. It always comes after the site's own prayers and is offered, not urged (design 2.3).
import { HISTORIC_PRAYERS, type HistoricId, type Occasion } from "@/data/occasion-prayers";
import { historicCard, OLDER_ANCHOR } from "./message";
import type { PrayerSheetData } from "./PrintPrayer";
import { SendPrayer } from "./SendPrayer";

export function OlderPrayer({ occasion, id, onPrint }: { occasion: Occasion; id: HistoricId; onPrint?: (sheet: PrayerSheetData) => void }) {
  const prayer = HISTORIC_PRAYERS[id];
  const crown = prayer.rights === "bcp-1662-crown";
  const print = onPrint
    ? () => onPrint({ heading: occasion.heading, label: `An older prayer: ${prayer.title}`, text: prayer.text, verses: [], source: prayer.source, crown })
    : undefined;
  return (
    <section id={OLDER_ANCHOR} className="op-older" aria-labelledby="op-older-title">
      <h2 id="op-older-title">An older prayer</h2>
      <div className="op-panel">
        <h3>{prayer.title}</h3>
        <blockquote className="op-older-text" lang="en">{prayer.text}</blockquote>
        <p className="op-older-source">{prayer.source}</p>
        {prayer.explanation && <p className="op-context">{prayer.explanation}</p>}
        <SendPrayer card={historicCard(occasion, prayer)} onPrint={print} />
      </div>
    </section>
  );
}
