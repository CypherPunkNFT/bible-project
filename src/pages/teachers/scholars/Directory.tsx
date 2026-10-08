// 07 · All the scholars (approved mock-up: design/scholars-directions/scholars/directory.js): a compact list in three
// columns, grouped by era. A small two-way switch re-groups the SAME rows by era or by the first letter of the surname:
// rows glide to their new places (transforms only), new headings fade in and the frame eases to its new height, so
// nothing on the page jumps. Every row opens the shared profile.
import { useLayoutEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { SectionHead } from "../shared/Frame";
import { reducedMotion } from "./marks/dom";
import { useScholars } from "./context";
import { buildGroups, type Mode } from "./directory/groups";
import { Groups } from "./directory/Rows";
import "./Directory.css";

const EASE = "cubic-bezier(.16, 1, .3, 1)", MOVE_MS = 600;
interface Before { rects: Map<string, DOMRect>; height: number }

export function Directory() {
  const { data, openProfile } = useScholars();
  const groups = useMemo(() => buildGroups(data), [data]);
  const [mode, setMode] = useState<Mode>("era");
  const frameRef = useRef<HTMLDivElement>(null), listRef = useRef<HTMLDivElement>(null);
  const before = useRef<Before | null>(null);
  const rowsNow = () => [...(listRef.current?.querySelectorAll<HTMLLIElement>("li[data-id]") ?? [])];

  const choose = (next: Mode) => {
    if (next === mode) return;
    if (!reducedMotion() && frameRef.current) {
      before.current = { rects: new Map(rowsNow().map((li) => [li.dataset.id ?? "", li.getBoundingClientRect()])), height: frameRef.current.offsetHeight };
    }
    setMode(next);
  };
  // Re-grouped rows slide from where they were (FLIP), the new headings fade in, and the frame eases between heights
  // (the columns inside are never squeezed, so their layout stays exact).
  useLayoutEffect(() => {
    const was = before.current, frame = frameRef.current, list = listRef.current;
    before.current = null;
    if (!was || !frame || !list) return;
    for (const li of rowsNow()) {
      const a = was.rects.get(li.dataset.id ?? ""), b = li.getBoundingClientRect();
      if (!a || (a.left === b.left && a.top === b.top)) continue;
      li.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: "none" }], { duration: MOVE_MS, easing: EASE });
    }
    list.querySelectorAll(".dir-gh").forEach((head) => {
      head.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: 180, easing: "ease-out", fill: "backwards" });
    });
    const toHeight = list.offsetHeight;
    if (was.height !== toHeight) {
      frame.getAnimations().forEach((a) => a.cancel());
      frame.animate([{ height: `${was.height}px` }, { height: `${toHeight}px` }], { duration: MOVE_MS, easing: EASE });
    }
  }, [mode]);

  const onListClick = (event: SyntheticEvent) => {
    const hit = (event.target as Element).closest<HTMLElement>("[data-scholar]");
    if (hit?.dataset.scholar) openProfile(hit.dataset.scholar, hit);
  };

  return <>
    <SectionHead num="07" kicker="Directory" title={<>All {data.scholars.length} <em>scholars</em></>}
      line="By era or from A to Z, with years, faith and field. Click any name for the full profile." />
    <div className="dir-tools">
      <ul className="dir-key">
        <li><span className="dir-use dir-use-in-use" />A live feature on this site uses their work</li>
        <li><span className="dir-use dir-use-held" />Their book is in the library, planned</li>
      </ul>
      <div className="dir-mode" role="group" aria-label="Group the list" data-mode={mode}>
        <i className="dir-thumb" aria-hidden="true" />
        <button type="button" aria-pressed={mode === "era"} onClick={() => choose("era")}>By era</button>
        <button type="button" aria-pressed={mode === "az"} onClick={() => choose("az")}>A to Z</button>
      </div>
    </div>
    <div ref={frameRef} className="dir-frame">
      <div ref={listRef} className="dir-list" onClick={onListClick}><Groups data={data} groups={groups[mode]} mode={mode} /></div>
    </div>
  </>;
}
