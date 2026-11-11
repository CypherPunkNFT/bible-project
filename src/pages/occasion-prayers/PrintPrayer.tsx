// "Print this prayer" (design 6.3): one prayer on a plain sheet, through the life-event print module as it is built to be
// used. The sheet is drawn outside the app by PrintPortal; usePrintSheet writes the page rule and opens the print dialog.
// The sheet flows with an ordinary page margin and makes no promise to fit one page exactly.
import { CROWN_ACKNOWLEDGEMENT } from "@/data/occasion-prayers";
import "./occasion-prayers-sheet.css";

export const BSB_LINE = "Scripture quotations are from the Berean Standard Bible (public domain).";

export interface PrayerSheetData {
  heading: string;
  label: string;
  text: string;
  /** The verses beneath it, with references; empty for an older prayer. */
  verses: { text: string; reference: string }[];
  /** An older prayer's source line. */
  source?: string;
  /** True for a 1662 text: the Crown acknowledgement prints in full. */
  crown: boolean;
}

export function PrayerSheet({ sheet }: { sheet: PrayerSheetData }) {
  return (
    <article className="op-sheet">
      <h1>{sheet.heading}</h1>
      <h2>{sheet.label}</h2>
      <p className="op-sheet-prayer" lang={sheet.source ? "en" : undefined}>{sheet.text}</p>
      {sheet.source && <p className="op-sheet-source">{sheet.source}</p>}
      {sheet.verses.length > 0 && (
        <section>
          <h3>Rooted in Scripture</h3>
          {sheet.verses.map((verse) => (
            <p key={verse.reference} className="op-sheet-verse"><span lang="en">{verse.text}</span> <cite>{verse.reference}</cite></p>
          ))}
        </section>
      )}
      <footer>
        {sheet.verses.length > 0 && <p>{BSB_LINE}</p>}
        {sheet.crown && <p>{CROWN_ACKNOWLEDGEMENT}</p>}
        <p>bibleguide.io/prayers</p>
      </footer>
    </article>
  );
}
