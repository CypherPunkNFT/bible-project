import type { LibraryPerson } from "../catalogue/library";
import { usedEntry } from "../site-evidence";
// The directory's groups and rows: an era heading with its count, or a surname letter; each row gives years, faith and
// field, and a mark when the site uses their work (filled: a live feature; ring: in the library). Every entry is listed,
// in rows across the columns, drawn a window of rows at a time as the frame scrolls (owner's scroll rule, 2026-11-17:
// no "Show more"); the CSS columns this list used could not be drawn a row at a time.
import { memo, useMemo, type CSSProperties } from "react";
import { WindowedRows } from "@/components/WindowedRows";
import type { ScholarsData } from "@/data/teachers/pages-types";
import { dateLabel } from "../population";
import { faithOf, toneOf } from "../built/labels";
import { USE_LABEL, type Group, type Mode } from "./groups";
import { formatNumber } from "@/lib/site-format";

const Row = memo(function Row({ data, s, row }: { data: ScholarsData; s: LibraryPerson; row: number }) {
  const st = usedEntry(s) ? "in-use" : (s.population ? s.population.counts.publicRecords+s.population.counts.localCopies+s.population.counts.intakeRecords>0 : s.records>0) ? "held" : undefined;
  const field = s.scholar?.field ?? Object.keys(s.fields)[0];
  return <li data-id={s.id} data-row={row}>
    <button type="button" data-scholar={s.id} style={{ "--tone": `var(${field ? toneOf(field as keyof ScholarsData["fields"]) : "--muted"})` } as CSSProperties}>
      <i className="dir-dot" aria-hidden="true" /><span className="dir-nm">{s.name}</span><span className="dir-yr">{dateLabel(s)}</span>
      <span className="dir-meta">{s.scholar ? faithOf(data, s.scholar) : "Faith unrecorded"} · {field ? data.fields[field as keyof ScholarsData["fields"]] : "Subject unassigned"}</span>
      {st ? <span className={`dir-use dir-use-${st} dir-mark`} title={USE_LABEL[st]} aria-label={USE_LABEL[st]} /> : <span className="dir-mark" aria-hidden="true" />}
    </button>
  </li>;
});

type Item = { kind: "head"; key: string; label: string; total: number; first: boolean } | { kind: "person"; key: string; s: LibraryPerson };
const itemKey = (item: Item) => item.key;
const isHead = (item: Item) => item.kind === "head";

export function Groups({ data, groups, mode }: { data: ScholarsData; groups: Group[]; mode: Mode }) {
  const items = useMemo(() => groups.flatMap((g, i): Item[] => [{ kind: "head", key: `${mode}-${g.key}`, label: g.label, total: g.people.length, first: i === 0 },
    ...g.people.map((s) => ({ kind: "person" as const, key: s.id, s }))]), [groups, mode]);
  return <WindowedRows as="ul" className="dir-list" items={items} itemKey={itemKey} fullRow={isHead} estimate={54} dataVersion={items} renderItem={(item, row) => item.kind === "person"
    ? <Row key={item.key} data={data} s={item.s} row={row} />
    : <li key={item.key} data-row={row} className={`dir-head dir-head-${mode}${item.first ? " is-first" : ""}`}>{mode === "era"
      ? <h3 className="dir-gh">{item.label}<span>{formatNumber(item.total)}</span></h3>
      : <span className="dir-gh dir-letter">{item.label}</span>}</li>} />;
}
