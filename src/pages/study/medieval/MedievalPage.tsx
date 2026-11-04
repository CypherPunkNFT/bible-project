// /study/the-medieval-church: about AD 500 to 1350, read by one question: who wrote this down, and how far did it reach? A line of years with decrees on
// one side and what is found near them on the other, then a map of baptisms, a balance of popes and kings, one article and the road to teaching it,
// and a walk through a parish. The verses and coast are scripts/build-medieval-study.py's; the claims and sources are the research record's. Each
// section keeps its own failure, the view lives in the address, and a chosen pair's record opens from the right.
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Claims } from "./Claims";
import { Closing } from "./Closing";
import { Landing } from "./Landing";
import { Mirror } from "./Mirror";
import { Mission } from "./Mission";
import { findField, findOpened, findPair, parseYear } from "./model";
import { Parish } from "./Parish";
import { MvSection } from "./parts";
import { Powers } from "./Powers";
import { School } from "./School";
import { PairSheet } from "./Sheet";
import "./medieval.css";

function scrollToHash(hash: string) {
  try {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(`The medieval church page: could not read the address's section "${hash}"`, error);
  }
}

export default function MedievalPage() {
  useEffect(() => {
    document.title = "The medieval church · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const opener = useRef<string | null>(null);
  const focusClose = useRef(false);
  const focusOpener = useRef(false);
  const openValue = params.get("open");
  const opened = findOpened(openValue);
  const field = findField(params.get("field"));
  // An open record wins over the address's chosen pair and field, so that the marks lit on the page always belong to the record beside them.
  const chosen = findPair(opened?.id ?? params.get("pair"), opened ? null : field);

  useEffect(() => {
    if (hash) scrollToHash(hash);
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (opened && focusClose.current) document.querySelector<HTMLElement>(".mv-root .ms-sheet.open .ms-sheet-close")?.focus();
    focusClose.current = false;
    if (!opened && focusOpener.current) {
      // The opener is found again by its key after the render: the one that was pressed may have been redrawn.
      const back = opener.current ? document.querySelector<HTMLElement>(`.mv-root [data-opener="${CSS.escape(opener.current)}"]`) : null;
      (back ?? document.querySelector<HTMLElement>(".mv-root #mirror h2"))?.focus();
    }
    focusOpener.current = false;
  }, [opened]);

  // React Router does not queue a second call made in the same handler, so every change is one call that may set several address values.
  const setMany = useCallback((values: Record<string, string | null>) => {
    setParams((p) => {
      const q = new URLSearchParams(p);
      for (const [name, value] of Object.entries(values)) { if (value) q.set(name, value); else q.delete(name); }
      return q;
    }, { replace: true, preventScrollReset: true });
  }, [setParams]);
  const open = useCallback((id: string) => {
    opener.current = (document.activeElement as HTMLElement | null)?.dataset?.opener ?? null;
    focusClose.current = true;
    setMany({ pair: id, open: `pair:${id}` });
  }, [setMany]);
  const close = useCallback(() => {
    focusOpener.current = true;
    setMany({ open: null });
  }, [setMany]);
  // Safari and Firefox on a Mac do not focus a pressed button, so note it before the press's handler reads the focus.
  const notePress = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-opener]");
    if (target) target.focus({ preventScroll: true });
  }, []);
  const resetKey = params.toString();

  return <div className="mv-root" onClickCapture={notePress}><div className="mv-wrap">
    <MvSection id="landing"><Landing /></MvSection>
    <MvSection id="mirror" resetKey={resetKey}><Mirror chosen={chosen} field={field} openValue={openValue} onChange={setMany} onOpen={open} /></MvSection>
    <MvSection id="mission" resetKey={resetKey}><Mission stationId={params.get("station")} addressYear={parseYear(params.get("year"))} onChange={setMany} /></MvSection>
    <MvSection id="powers" resetKey={resetKey}><Powers roundId={params.get("round")} onChange={setMany} /></MvSection>
    <MvSection id="school" resetKey={resetKey}><School partId={params.get("part")} onChange={setMany} /></MvSection>
    <MvSection id="parish" resetKey={resetKey}><Parish spotId={params.get("at")} onChange={setMany} /></MvSection>
    <MvSection id="claims"><Claims /></MvSection>
    <MvSection id="stops"><Closing /></MvSection>
  </div><MvSection id="sheet" resetKey={resetKey}><PairSheet pair={opened} onClose={close} /></MvSection></div>;
}
