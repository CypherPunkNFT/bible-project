// A small reader for the drafts' own Markdown: headings (#, ##, ###), paragraphs, block quotes, simple tables, lists,
// **bold** and *italic*. That is everything the 40 draft texts use; anything else shows as plain text.
import type { ReactNode } from "react";

function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <em key={key}>{part.slice(1, -1)}</em>;
    return part;
  });
}

const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());
const isDivider = (row: string) => /^\|?\s*:?-{2,}/.test(row.trim());

function table(rows: string[], key: string): ReactNode {
  const [head, ...rest] = rows;
  const body = rest.filter(row => !isDivider(row));
  return <div className="draft-reader-table" key={key}><table>
    <thead><tr>{cells(head).map((cell, i) => <th key={i}>{inline(cell, `${key}-h${i}`)}</th>)}</tr></thead>
    <tbody>{body.map((row, r) => <tr key={r}>{cells(row).map((cell, i) => <td key={i}>{inline(cell, `${key}-${r}-${i}`)}</td>)}</tr>)}</tbody>
  </table></div>;
}

/** Turns one draft's Markdown into page elements, block by block. */
export function renderDraftMarkdown(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  const takeWhile = (test: (line: string) => boolean) => { const taken: string[] = []; while (i < lines.length && test(lines[i])) taken.push(lines[i++]); return taken; };
  while (i < lines.length) {
    const line = lines[i], key = `b${i}`;
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (!line.trim()) { i++; continue; }
    if (heading) {
      const level = heading[1].length, content = inline(heading[2], key);
      blocks.push(level === 1 ? <h1 key={key}>{content}</h1> : level === 2 ? <h2 key={key}>{content}</h2> : <h3 key={key}>{content}</h3>);
      i++;
    } else if (line.startsWith(">")) {
      const quoted = takeWhile(l => l.startsWith(">")).map(l => l.replace(/^>\s?/, ""));
      blocks.push(<blockquote key={key}>{inline(quoted.join(" "), key)}</blockquote>);
    } else if (line.trim().startsWith("|")) {
      blocks.push(table(takeWhile(l => l.trim().startsWith("|")), key));
    } else if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = takeWhile(l => /^\s*([-*]|\d+\.)\s+/.test(l)).map((l, n) => <li key={n}>{inline(l.replace(/^\s*([-*]|\d+\.)\s+/, ""), `${key}-${n}`)}</li>);
      blocks.push(ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>);
    } else {
      const paragraph = takeWhile(l => !!l.trim() && !/^(#{1,3}\s|>|\s*\|)/.test(l) && !/^\s*([-*]|\d+\.)\s+/.test(l));
      if (paragraph.length === 0) { blocks.push(<p key={key}>{line}</p>); i++; continue; }
      blocks.push(<p key={key}>{inline(paragraph.join(" "), key)}</p>);
    }
  }
  return blocks;
}
