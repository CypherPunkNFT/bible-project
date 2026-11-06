// Draws a draft's parsed blocks (draft-parse.ts): paragraphs, sub-heads, verses with their reference, the tagged notes,
// label-and-text rows, the Consider / Reflect prompts, tables and lists. Neighbouring prompts share one row of boxes and
// neighbouring label rows share one list, so a section reads as a page rather than a stack of lines.
import type { Block, NoteTag } from "./draft-parse";
import { inline } from "./draft-inline";

const NOTE_LABELS: Record<NoteTag, string> = {
  open: "Left open", care: "Read with care", source: "From the sources", own: "In its own words",
  other: "Another reading", about: "About this view", invite: "An invitation",
};


const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());
const isDivider = (row: string) => /^\|?\s*:?-{2,}/.test(row.trim());

function Table({ rows }: { rows: string[] }) {
  const [head, ...rest] = rows;
  return <div className="ds-table"><table>
    <thead><tr>{cells(head).map((cell, i) => <th key={i}>{inline(cell)}</th>)}</tr></thead>
    <tbody>{rest.filter(row => !isDivider(row)).map((row, r) => <tr key={r}>{cells(row).map((cell, i) => <td key={i}>{inline(cell)}</td>)}</tr>)}</tbody>
  </table></div>;
}

function OneBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case "para": return <p>{inline(block.text)}</p>;
    case "heading": return <h3 className="ds-subhead">{inline(block.text)}</h3>;
    case "quote": return <figure className="ds-verse"><blockquote>{inline(block.text)}</blockquote>{block.cite && <figcaption>{block.cite}</figcaption>}</figure>;
    case "note": return <aside className={`ds-note ds-note-${block.tag}`}><span>{NOTE_LABELS[block.tag]}</span><p>{inline(block.text)}</p></aside>;
    case "table": return <Table rows={block.rows} />;
    case "list": { const items = block.items.map((item, i) => <li key={i}>{inline(item)}</li>); return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>; }
    default: return null;
  }
}

type Group = { kind: "prompts" | "fields"; blocks: Block[] } | { kind: "one"; block: Block };

function group(blocks: Block[]): Group[] {
  const groups: Group[] = [];
  for (const block of blocks) {
    const kind = block.kind === "prompt" ? "prompts" : block.kind === "field" ? "fields" : null;
    const last = groups[groups.length - 1];
    if (kind && last?.kind === kind) last.blocks.push(block);
    else groups.push(kind ? { kind, blocks: [block] } : { kind: "one", block });
  }
  return groups;
}

export function DraftBlocks({ blocks }: { blocks: Block[] }) {
  return <>{group(blocks).map((item, i) => {
    if (item.kind === "one") return <OneBlock key={i} block={item.block} />;
    if (item.kind === "prompts") return <div key={i} className="ds-prompts">{item.blocks.map((block, n) => block.kind === "prompt" && <div key={n} className="ds-prompt"><span>{block.label}</span><p>{inline(block.text)}</p></div>)}</div>;
    return <dl key={i} className="ds-fields">{item.blocks.map((block, n) => block.kind === "field" && <div key={n}><dt>{block.label}</dt><dd>{inline(block.text)}</dd></div>)}</dl>;
  })}</>;
}
