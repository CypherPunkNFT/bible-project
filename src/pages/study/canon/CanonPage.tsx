// /study/how-the-canon-took-shape: "The canon takes shape", drawn as the owner-approved mock-up direction D, "One story"
// (design/canon-directions/?d=d): its sections in its order, each opened by its line of the story, its markup and its own
// CSS (generated into mockup-canon.css by scripts/build-canon-styles.py). The text is the research file's; what the
// mock-up adds (spans, places, lanes, questions, pictures) is design/canon-directions/build-data.py's canon-data.json.
// Any record or picture chosen anywhere opens the record sheet from the right.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Compare, Practice, Sources } from "./Closing";
import { Investigations } from "./Investigations";
import { Landing } from "./Landing";
import { byId, CN } from "./model";
import { Evidence, Shelf, Trail } from "./Opening";
import { CnSection } from "./parts";
import { Places } from "./Places";
import { Registers } from "./Registers";
import { CanonSheet, type Opened } from "./Sheet";
import { Timeline } from "./Timeline";
import "./canon.css";

// Each section's line of the story: how it follows from the one before.
const STORY: Record<string, string> = {
  shelf: "Every list on this page is about books. Start with the books themselves, as they survive.",
  evidence: "A surviving book shows what was copied. Being copied, read, quoted, recommended or listed are different claims; keep them apart.",
  trail: "Now hold one writing still and watch which of those claims each witness makes about it.",
  timeline: "Those witnesses are spread over eighteen centuries. Put each back in its own time.",
  map: "And in its own place: the lists come from different cities and churches, not one centre.",
  registers: "Three writers within one generation show how far apart the boundaries could be.",
  investigations: "Three cases, looked at closely, show where a boundary becomes visible and where the evidence runs out.",
  compare: "The question is still live: churches and Judaism today hold different collections.",
  practice: "Your turn. Weigh a piece of evidence and say how far it can take you.",
  sources: "Everything above rests on these sources. Check them.",
};
const SECTIONS = [["shelf", Shelf], ["evidence", Evidence], ["trail", Trail], ["timeline", Timeline], ["map", Places], ["registers", Registers],
  ["investigations", Investigations], ["compare", Compare], ["practice", Practice], ["sources", Sources]] as const;

export default function CanonPage() {
  useEffect(() => {
    document.title = "The canon takes shape · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  const [sheet, setSheet] = useState<{ opened: Opened | null; open: boolean }>({ opened: null, open: false });
  const returnFocus = useRef<HTMLElement | SVGElement | null>(null), justOpened = useRef(false);
  const show = useCallback((opened: Opened, from?: HTMLElement | SVGElement | null) => {
    if (opened.kind === "picture") {
      const { q } = opened, p = CN.pictured.find((x) => x.q === q);
      if (!p) { console.error(`record sheet: no pictured codex "${q}" in canon-data.json`); return; }
      if (p.record) opened = { kind: "record", id: p.record };
    }
    if (opened.kind === "record" && !byId.has(opened.id)) { console.error(`record sheet: no record "${opened.id}" in the research file`); return; }
    returnFocus.current = from ?? (document.activeElement as HTMLElement | null);
    justOpened.current = true;
    setTimeout(() => { justOpened.current = false; }, 0);
    setSheet({ opened, open: true });
  }, []);
  const close = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);
  const page = useCallback((id: string) => setSheet({ opened: { kind: "record", id }, open: true }), []);

  // data-open="<record id>" opens a record; data-picture="<Wikidata id>" opens a pictured codex. The map's marks are
  // role=button groups, so Enter and Space open them too.
  const trigger = (target: EventTarget) => (target as Element).closest<HTMLElement | SVGElement>("[data-open],[data-picture]");
  const openFrom = (t: HTMLElement | SVGElement) => show(t.dataset.open ? { kind: "record", id: t.dataset.open } : { kind: "picture", q: t.dataset.picture ?? "" }, t);
  const onClick = (e: MouseEvent) => { const t = trigger(e.target); if (t && !t.closest(".cn-sheet")) { e.preventDefault(); openFrom(t); } };
  const onKeyDown = (e: KeyboardEvent) => {
    const t = trigger(e.target);
    if (t instanceof SVGElement && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openFrom(t); }
  };

  // Ways in from other pages: ?record=<id> opens that record's sheet; #<section> scrolls to it once the page is drawn.
  const [params] = useSearchParams(), { hash } = useLocation();
  useEffect(() => {
    const id = params.get("record");
    if (id) show({ kind: "record", id });
    else if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    // Only on arrival: the sheet and the scroll are the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let number = 0;
  return <div className="cn-root" onClick={onClick} onKeyDown={onKeyDown}>
    <div className="wrap t-page ms-page cn-page cn-d">
      <CnSection id="landing"><Landing /></CnSection>
      {SECTIONS.map(([id, Body]) => {
        const num = String(++number).padStart(2, "0");
        return <CnSection key={id} id={id} story={STORY[id]}><Body num={num} /></CnSection>;
      })}
    </div>
    <CanonSheet opened={sheet.opened} open={sheet.open} onClose={close} onPage={page} returnFocus={returnFocus} justOpened={justOpened} />
  </div>;
}
