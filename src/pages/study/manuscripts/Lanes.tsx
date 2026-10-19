// "Through time" (the approved "through time (lanes)" section; mock-up js/lanes.js), drawn by lanes-chart.ts. The line below
// the chart names the copy pointed at; "All traditions" folds an opened lane back.
import { useEffect, useMemo, useRef, useState } from "react";
import type { MsRecord } from "@/lib/manuscripts";
import { mountLanes } from "./lanes-chart";
import { lanesData } from "./lanes-layout";
import { useMs } from "./context";
import { booksText, holderText, sigla } from "./model";
import { Icon } from "./parts";


const BASE_ALL = "Choose a tradition to open it across the whole chart.";
const BASE_OPEN = "Point at a copy to read it; choose it to open the record. The thin line shows the full range of its date.";

export function Lanes() {
  const { index, openRecord } = useMs();
  const svg = useRef<SVGSVGElement>(null), box = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<typeof mountLanes> | null>(null);
  const [open, setOpen] = useState(false);
  const [say, setSay] = useState<{ record: MsRecord | null; open: boolean }>({ record: null, open: false });
  const lanes = useMemo(() => lanesData(index.data.records), [index]);

  useEffect(() => {
    if (!svg.current || !box.current) return;
    const svgEl = svg.current;
    chart.current = mountLanes(svgEl, box.current, lanes, {
      onFocus: (record, isOpen) => setSay({ record, open: isOpen }),
      onOpenChange: setOpen,
      onChoose: (record) => openRecord(record.i, svgEl),
    });
    return () => chart.current?.destroy();
  }, [lanes, openRecord]);

  const r = say.record;
  return <>
    <div className="ln-bar"><button type="button" className="ln-back" hidden={!open} onClick={() => chart.current?.close()}><Icon name="arrowLeft" size={14} /><span>All traditions</span></button></div>
    <div ref={box} className="ln-scroll"><svg ref={svg} className="ln" role="img" tabIndex={0} aria-label="Dated manuscripts by tradition, 250 BC to AD 1500. Up and down arrows choose a tradition, Enter opens it; left and right move between copies; Escape returns to all traditions." /></div>
    <p className="ms-say ln-say" aria-live="polite">{r
      ? <><b>{r.n}</b> · {[sigla(r), r.d, booksText(index, r), holderText(index, r)].filter(Boolean).join(" · ")} <span className="ms-say-go">Choose to open</span></>
      : say.open ? BASE_OPEN : BASE_ALL}</p>
  </>;
}
