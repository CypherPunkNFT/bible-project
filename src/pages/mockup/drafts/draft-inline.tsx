import type { ReactNode } from "react";

const LINK = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/;

/** **bold**, *italic* and [text](https://…) links inside a draft's line of text. Links open in a new tab. */
export function inline(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/).filter(Boolean).map((part, i) => {
    const link = part.match(LINK);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}
