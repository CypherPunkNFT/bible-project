// The page's one print sheet (design 6.3): `request` draws the chosen prayer into the print portal and opens the print
// dialog once the sheet's fonts are ready. The button is hidden where canPrint() says the browser cannot print.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { canPrint, defaultPaper, useFontsReady, usePrintSheet } from "@/pages/life-events/print-sheet";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import { PrayerSheet, type PrayerSheetData } from "./PrintPrayer";

const SHEET_FACES = ['400 1em "Literata Variable"', '400 1em "Archivo Variable"', '600 1em "Archivo Variable"'];

export function usePrayerPrint(label: string): { printable: boolean; request: (sheet: PrayerSheetData) => void; portal: ReactNode } {
  const printable = useMemo(() => canPrint(), []);
  const paper = useMemo(() => defaultPaper(), []);
  const fontsReady = useFontsReady(SHEET_FACES);
  const { print } = usePrintSheet(paper, paper === "letter" ? "0.75in" : "19mm");
  const [sheet, setSheet] = useState<PrayerSheetData | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!pending || !sheet || !fontsReady) return;
    setPending(false);
    print();
  }, [pending, sheet, fontsReady, print]);
  const request = (next: PrayerSheetData) => { setSheet(next); setPending(true); };
  // Always mounted, so its container already exists when a prayer is chosen and the print sees the sheet drawn.
  const portal = <PrintPortal label={label}>{sheet && <PrayerSheet sheet={sheet} />}</PrintPortal>;
  return { printable, request, portal };
}
