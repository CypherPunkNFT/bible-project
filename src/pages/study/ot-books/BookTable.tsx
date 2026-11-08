// 06 Every book: thirty-nine books in thirty-six rows, a list and never a grid of cells, sortable by the English or the
// Hebrew order. Each row opens in place to its five fields; the open row lives in the address, so a theology study can link
// straight to one book's line.
import { DATA, R, orderedRows, rowSlug, type Order, type TableRow } from "./model";
import { Head, Para, Txt } from "./parts";

type Props = { order: Order; row: TableRow | null; onChange: (values: Record<string, string | null>) => void };

const FIELDS: [keyof TableRow, string][] = [["says", "What the book says"], ["tradition", "The traditional view"], ["date", "Date, as that view gives it"],
  ["setting", "Setting"], ["differ", "Where those who hold Scripture true differ"]];
/** A row's bare references ("(1:1)") mean its own book; a row of two books ("1 and 2 Kings") cannot say which. */
const BIBLE_NAMES = new Set(DATA.books);

function Row({ row, open, onToggle }: { row: TableRow; open: boolean; onToggle: () => void }) {
  const book = BIBLE_NAMES.has(row.book) ? row.book : undefined, id = `row-${rowSlug(row.book)}`;
  return <li id={`book-${rowSlug(row.book)}`} className={open ? "on" : ""}>
    <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>
      <b>{row.book}</b><span className="ob-part">{row.part}</span>{!open && <span className="ob-row-says"><Txt text={row.says} book={book} /></span>}
    </button>
    {open && <dl id={id} className="ob-fields">{FIELDS.map(([key, label]) => <div key={key}><dt>{label}</dt><dd><Txt text={row[key]} book={book} /></dd></div>)}</dl>}
  </li>;
}

function groups(rows: TableRow[], order: Order): [string, TableRow[]][] {
  if (order === "english") return [["", rows]];
  const list: [string, TableRow[]][] = [];
  for (const row of rows) {
    if (list[list.length - 1]?.[0] !== row.part) list.push([row.part, []]);
    list[list.length - 1][1].push(row);
  }
  return list;
}

export function BookTable({ order, row, onChange }: Props) {
  return <>
    <Head num="06" kicker="Every book" headline={R.table.headline}><Para text={R.table.lead} /></Head>
    <div className="ob-order" role="group" aria-label="Order of the books">
      {(["english", "hebrew"] as const).map((o) => <button key={o} type="button" aria-pressed={order === o} className={order === o ? "on" : ""}
        onClick={() => onChange({ order: o === "english" ? null : o })}>{o === "english" ? "English Bibles' order" : "Hebrew Bible's order"}</button>)}
    </div>
    <div className="ob-table">{groups(orderedRows(order), order).map(([part, rows]) => <div key={part || "all"}>
      {part && <h3 className="ob-part-head">{part}</h3>}
      <ol>{rows.map((r) => <Row key={r.book} row={r} open={row?.book === r.book} onToggle={() => onChange({ row: row?.book === r.book ? null : rowSlug(r.book) })} />)}</ol>
    </div>)}</div>
    <Para className="ob-caption" text={R.table.order} />
    <Para className="ob-caption" text={R.table.note} />
  </>;
}
