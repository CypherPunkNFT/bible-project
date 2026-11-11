// An occasion's passages, section by section (design 3, 9): each section's heading, then each passage with its reference
// linked to the reader, its Berean words, why it fits, any honest context, its labels and an "Add to our list" box.
// Drawn with the site's useRowWindow: about 50 rows above and below the screen, more as the reader scrolls, no "load
// more" button. Section headings are rows too, with their own row keys.
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Occasion, OccasionPassage, OccasionSection } from "@/data/occasion-verses";
import { CHOSEN_BIBLE } from "@/lib/last-read";
import { useCatalog } from "@/lib/catalog";
import { useRowWindow } from "@/lib/useRowWindow";
import { labelOf, type PassageLabel, type PassageWords } from "./usePassageWords";

const ROW_ESTIMATE = 150;

type Row =
  | { kind: "heading"; id: string; section: OccasionSection }
  | { kind: "passage"; id: string; passage: OccasionPassage; label: PassageLabel };

function rowsOf(occasion: Occasion, label: (passage: OccasionPassage) => PassageLabel): Row[] {
  return occasion.sections.flatMap((section): Row[] => [
    { kind: "heading", id: `section:${section.id}`, section },
    ...section.passages.map((passage): Row => {
      const shown = label(passage);
      return { kind: "passage", id: `passage:${section.id}:${shown.key}`, passage, label: shown };
    }),
  ]);
}

function Labels({ passage }: { passage: OccasionPassage }) {
  if (!passage.believer && !passage.later) return null;
  return (
    <p className="ov-labels">
      {passage.believer && <span className="ov-label" title="This verse speaks of a Christian's hope after death. Choose it knowingly.">For a believer</span>}
      {passage.later && <span className="ov-label" title="A verse of future joy that can hurt in the first days after a death.">Often better a few weeks on</span>}
    </p>
  );
}

function PassageItem({ row, words, chosen, onToggle, index }: {
  row: Extract<Row, { kind: "passage" }>; words: PassageWords; chosen: boolean; onToggle: (key: string) => void; index: number;
}) {
  const { passage, label } = row;
  const text = words.words.get(label.key);
  return (
    <li data-row={index} className="ov-passage">
      {passage.group && <p className="ov-group">{passage.group}</p>}
      <Link to={label.readHref} state={CHOSEN_BIBLE} className="ov-ref">{label.reference}</Link>
      {text !== undefined ? <blockquote className="scripture ov-text" lang="en" translate="no">{text}</blockquote>
        : words.failed.has(label.key) ? <p className="ov-wait">These words could not be loaded.</p>
          : <p className="ov-wait">Opening the Berean Standard Bible…</p>}
      <p className="ov-note">{passage.note}</p>
      {passage.context && <p className="ov-context">{passage.context}</p>}
      <Labels passage={passage} />
      <label className="ov-add">
        <input type="checkbox" checked={chosen} onChange={() => onToggle(label.key)} />
        <span>Add to our list</span>
      </label>
    </li>
  );
}

export function PassageRows({ occasion, words, chosen, onToggle }: {
  occasion: Occasion; words: PassageWords; chosen: ReadonlySet<string>; onToggle: (key: string) => void;
}) {
  const catalog = useCatalog();
  const rows = useMemo(() => rowsOf(occasion, (passage) => labelOf(catalog, passage)), [occasion, catalog]);
  const [container, setContainer] = useState<HTMLOListElement | null>(null);
  const rowIndex = useMemo(() => new Map(rows.map((row, index) => [row.id, index])), [rows]);
  const rowKey = useCallback((index: number) => rows[index].id, [rows]);
  const rowOfAnchor = useCallback((key: string) => rowIndex.get(key), [rowIndex]);
  const { start, end, before, after } = useRowWindow({
    rowCount: rows.length, rowKey, anchorKey: rowKey, rowOfAnchor, estimate: ROW_ESTIMATE, gap: 0, scroller: "window", container, dataVersion: occasion.slug,
  });
  const drawn = Array.from({ length: Math.max(0, end - start + 1) }, (_, offset) => start + offset);
  return (
    <ol ref={setContainer} className="ov-rows" aria-label="Passages" style={{ paddingTop: before, paddingBottom: after }}>
      {drawn.map((index) => {
        const row = rows[index];
        if (row.kind === "heading") {
          return (
            <li key={row.id} data-row={index} className="ov-section">
              <h3>{row.section.title}</h3>
              {row.section.what && <p>{row.section.what}</p>}
            </li>
          );
        }
        return <PassageItem key={row.id} row={row} index={index} words={words} chosen={chosen.has(row.label.key)} onToggle={onToggle} />;
      })}
    </ol>
  );
}
