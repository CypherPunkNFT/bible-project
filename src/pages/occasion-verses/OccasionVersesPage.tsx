// /occasion-verses: the occasion verse picker, the one tool for every occasion's verses (design.md in
// docs/features/occasion-verses). Pick an occasion, read its Berean passages by part of the service, tick the ones you
// want into "Our list", copy or print it, and print a keepsake certificate where the occasion has one. The occasion and
// the list live only in the address; nothing is stored or sent. README.md beside this file.
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { birthdayDatesComplete, placeByKey, WEDDING_ORDER_NOTE, type CertificateKind, type Occasion } from "@/data/occasion-verses";
import { BirthdayDateField } from "@/pages/birthday-verses/BirthdayDateField";
import { useCatalog } from "@/lib/catalog";
import { plural } from "@/lib/site-format";
import { canPrint, defaultPaper, useFontsReady, usePrintSheet, type Paper } from "@/pages/life-events/print-sheet";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import { HelpStrip } from "@/pages/sympathy/HelpStrip";
import { SHEET_FACES } from "@/pages/sympathy/print-setup";
import { ReadersSheet } from "@/pages/sympathy/SympathySheet";
import { moveKey, needsCleaning, readAddress, toggleKey, writeAddress } from "./address";
import { CertificateMaker } from "./CertificateMaker";
import { CertificateSheet, type CertificateDetails } from "./CertificateSheet";
import { OccasionChooser } from "./OccasionChooser";
import { OurList } from "./OurList";
import type { ListEntry } from "./text";
import { PassageRows } from "./PassageRows";
import { labelOf, usePassageWords } from "./usePassageWords";
import "@/components/stations/stations.css";
import "@/pages/sympathy/sympathy.css";
import "@/pages/sympathy/sympathy-sheet.css";
import "./occasion-verses.css";
import { ToolsBackLink } from "@/components/tools-back/ToolsBackLink";

export const PRINT_ADDRESS = "bibleguide.io/occasion-verses";
const LIST_TITLE = "Bible readings";

type Sheet = { kind: "list" } | { kind: "certificate"; details: CertificateDetails };

const MARGINS: Record<Sheet["kind"], Record<Paper, string>> = {
  list: { letter: "0.75in", a4: "19mm" },
  certificate: { letter: "0.5in", a4: "12mm" },
};

/**
 * One print at a time (design 7): only the chosen sheet is mounted, the page rule is written for it, and the dialog opens
 * once the sheet is really on the page (`sheetNode`, set by the sheet's own element).
 */
function usePrinting(paper: Paper) {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [pending, setPending] = useState(false);
  const [sheetNode, setSheetNode] = useState<HTMLDivElement | null>(null);
  const { print } = usePrintSheet(paper, MARGINS[sheet?.kind ?? "list"][paper]);
  useEffect(() => {
    if (!pending || !sheetNode) return;
    setPending(false);
    print();
  }, [pending, sheetNode, print]);
  return { sheet, setSheetNode, printSheet: (next: Sheet) => { setSheet(next); setPending(true); } };
}

function OccasionHeader({ occasion }: { occasion: Occasion }) {
  return (
    <header className="ov-occasion-head">
      <h2>{occasion.heading}</h2>
      <p className="ov-intro">{occasion.intro}</p>
      {occasion.slug === "wedding" && <p className="ov-note">{WEDDING_ORDER_NOTE}</p>}
      {occasion.helpStrip && <HelpStrip />}
      {occasion.explainer && (
        <details className="ov-explainer">
          <summary>{occasion.explainer.title}</summary>
          {occasion.explainer.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </details>
      )}
      {occasion.more.length > 0 && <ul className="ov-more">{occasion.more.map((link) => <li key={link.href}><Link to={link.href}>{link.title}</Link></li>)}</ul>}
    </header>
  );
}

export default function OccasionVersesPage() {
  const catalog = useCatalog();
  const [params] = useSearchParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const address = useMemo(() => readAddress(params), [params]);
  const { occasion, keys } = address;

  // An address with anything the picker would drop is rewritten without it, replacing the history entry.
  useEffect(() => {
    if (needsCleaning(search, address)) navigate({ search: writeAddress(address) }, { replace: true, preventScrollReset: true });
  }, [search, address, navigate]);

  const setKeys = (next: string[]) => navigate({ search: writeAddress({ occasion, keys: next }) }, { replace: true, preventScrollReset: true });
  const chosen = useMemo(() => new Set(keys), [keys]);
  const listPlaces = useMemo(() => keys.flatMap((key) => placeByKey(key) ?? []), [keys]);
  const occasionPassages = useMemo(() => occasion?.sections.flatMap((section) => section.passages) ?? [], [occasion]);
  const wanted = useMemo(() => [...occasionPassages, ...listPlaces.map((place) => place.passage)], [occasionPassages, listPlaces]);
  const words = usePassageWords(wanted);

  const [paper, setPaper] = useState<Paper>(() => defaultPaper());
  const [newPage, setNewPage] = useState(true);
  const printable = useMemo(() => canPrint(), []);
  const fontsReady = useFontsReady(SHEET_FACES);
  const { sheet, setSheetNode, printSheet } = usePrinting(paper);
  const waiting = fontsReady ? null : "Waiting for the fonts…";

  const entries: ListEntry[] = listPlaces.map((place) => ({
    key: place.key, reference: labelOf(catalog, place.passage).reference, part: place.section.title, text: words.words.get(place.key),
  }));
  const certificatePassages = occasionPassages.map((passage) => {
    const label = labelOf(catalog, passage);
    return { passage, label, text: words.words.get(label.key) };
  });
  const someFailed = wanted.some((passage) => words.failed.has(labelOf(catalog, passage).key));

  return (
    <div className="st-page ov-page mx-auto max-w-5xl px-4 sm:px-6">
      <header>
        <ToolsBackLink />
        <h1>Occasion verse picker</h1>
        <p className="ov-lede">Bible verses for weddings, baptisms, confirmations, birthdays, new babies, graduations, funerals and every big day in between, in the Berean Standard Bible. Choose an occasion, see its passages by the part of the service they suit, gather the ones you want into a list to copy or print, and print a keepsake certificate for a baptism, a dedication, a profession of faith or a wedding.</p>
        {keys.length > 0 && <a href="#our-list" className="ov-jump">{plural(keys.length, "Our list ({n})", "Our list ({n})")}</a>}
      </header>

      <OccasionChooser current={occasion} keys={keys} />

      <div className="ov-layout">
        <div className="ov-main">
          {occasion ? <>
            <OccasionHeader occasion={occasion} />
            {someFailed && <p className="ov-problem" role="alert">Some passages could not be loaded. Check your connection. <button type="button" className="ov-link" onClick={words.retry}>Try again</button></p>}
            <PassageRows occasion={occasion} words={words} chosen={chosen} onToggle={(key) => setKeys(toggleKey(keys, key))} />
            {occasion.slug === "birthday" && birthdayDatesComplete() && <BirthdayDateField chosen={chosen} onToggle={(key) => setKeys(toggleKey(keys, key))} />}
            {occasion.certificate && (
              <CertificateMaker key={occasion.slug} occasion={occasion as Occasion & { certificate: CertificateKind }} passages={certificatePassages}
                paper={paper} onPaper={setPaper} waiting={waiting} onPrint={printable ? (details) => printSheet({ kind: "certificate", details }) : null} />
            )}
          </> : <p className="ov-small">Choose an occasion above to see its passages.</p>}
        </div>
        <OurList entries={entries} move={(key, step) => setKeys(moveKey(keys, key, step))} remove={(key) => setKeys(keys.filter((item) => item !== key))}
          paper={paper} onPaper={setPaper} newPage={newPage} onNewPage={setNewPage} waiting={waiting} onPrint={printable ? () => printSheet({ kind: "list" }) : null} />
      </div>

      <aside className="ov-notes">
        <h2>About these passages</h2>
        <ul>
          <li>The wedding, baptism, baby, graduation and other life-event passages come from the site's verse packs, and the funeral and sympathy passages from its funeral and sympathy pages. Each occasion links to its full page, where you can make a card.</li>
          <li>Every passage is quoted from the Berean Standard Bible, with a line on why it fits and an honest note where a verse is often read out of its setting.</li>
          <li>The address holds the occasion and your list, so you can bookmark it or send it to your pastor. Nothing is stored or sent anywhere, and names typed for a certificate never leave this page.</li>
        </ul>
      </aside>

      {sheet?.kind === "list" && (
        <PrintPortal label="occasion-verses-list"><div ref={setSheetNode} className="ov-sheet-holder">
          <ReadersSheet paper={paper} title={LIST_TITLE} address={PRINT_ADDRESS} newPage={newPage}
            entries={entries.map((entry) => ({ key: entry.key, part: entry.part, reference: entry.reference, text: entry.text ?? "" }))} />
        </div></PrintPortal>
      )}
      {sheet?.kind === "certificate" && (
        <PrintPortal label="occasion-verses-certificate"><div ref={setSheetNode} className="ov-sheet-holder"><CertificateSheet details={sheet.details} paper={paper} /></div></PrintPortal>
      )}
    </div>
  );
}
