// The page's print sheets (design 6.1): `request` draws a print job into the print portal and opens the print dialog once
// the sheet's fonts are ready, through the shared life-event print module. Fixed sheets have no page margin; the
// room-by-room order flows with an ordinary one. Printing is offered only where canPrint() says the browser can.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { canPrint, defaultPaper, useFontsReady, usePrintSheet, type Paper } from "@/pages/life-events/print-sheet";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import type { PrintJob } from "./print-job";
import { JobSheets } from "./sheets/Sheets";

const SHEET_FACES = ['400 1em "Literata Variable"', 'italic 400 1em "Literata Variable"', '400 1em "Archivo Variable"', '600 1em "Archivo Variable"'];

export const pageMargin = (job: Pick<PrintJob, "layout" | "paper"> | null): string =>
  job?.layout === "order" ? (job.paper === "letter" ? "0.75in" : "19mm") : "0";

export interface BlessingPrint {
  printable: boolean;
  /** The paper the visitor last chose, starting from their browser's language (Letter or A4). */
  paper: Paper;
  setPaper: (paper: Paper) => void;
  request: (job: PrintJob) => void;
  portal: ReactNode;
}

export function useBlessingPrint(label: string): BlessingPrint {
  const printable = useMemo(() => canPrint(), []);
  const [paper, setPaper] = useState<Paper>(() => defaultPaper());
  const [job, setJob] = useState<PrintJob | null>(null);
  const [pending, setPending] = useState(false);
  const fontsReady = useFontsReady(SHEET_FACES);
  const { print } = usePrintSheet(job?.paper ?? paper, pageMargin(job));
  useEffect(() => {
    if (!pending || !job || !fontsReady) return;
    setPending(false);
    print();
  }, [pending, job, fontsReady, print]);
  const request = (next: PrintJob) => { setJob(next); setPending(true); };
  // Always mounted, so its container already exists when a print is chosen and the dialog sees the sheet drawn.
  const portal = <PrintPortal label={label}>{job && <JobSheets job={job} />}</PrintPortal>;
  return { printable, paper, setPaper, request, portal };
}
