// Draws a line of the study's wording that carries emphasis (evidence.ts) as React elements: <em>, <cite>, <strong>, <b>,
// <br> and <a href="https://…">. Anything else stays plain text, so no raw HTML ever reaches the page.
import { Fragment, type ReactNode } from "react";

const TAG = /<(\/?)(em|cite|strong|b|br|a)((?:\s+[a-z-]+="[^"]*")*)\s*\/?>/g;
const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"" };
const decode = (text: string) => text.replace(/&(?:amp|lt|gt|quot);/g, (m) => ENTITIES[m]);

interface Node { tag: string; href?: string; children: ReactNode[] }

function build(source: string): ReactNode[] {
  const root: Node = { tag: "root", children: [] }, stack: Node[] = [root];
  let at = 0, key = 0;
  const push = (child: ReactNode) => stack[stack.length - 1].children.push(child);
  for (const match of source.matchAll(TAG)) {
    const [whole, closing, tag, attrs] = match, index = match.index ?? 0;
    if (index > at) push(decode(source.slice(at, index)));
    at = index + whole.length;
    if (tag === "br") { push(<br key={key++} />); continue; }
    if (!closing) {
      const href = /href="(https:\/\/[^"]+)"/.exec(attrs)?.[1];
      stack.push({ tag, href, children: [] });
      continue;
    }
    const node = stack.pop();
    if (!node || node.tag !== tag) throw new Error(`Rich text: </${tag}> does not close the open <${node?.tag ?? "nothing"}> in "${source}"`);
    const kids = node.children;
    const element = tag === "a"
      ? <a key={key++} href={node.href} target="_blank" rel="noopener noreferrer">{kids}</a>
      : tag === "em" ? <em key={key++}>{kids}</em> : tag === "cite" ? <cite key={key++}>{kids}</cite>
        : tag === "strong" ? <strong key={key++}>{kids}</strong> : <b key={key++}>{kids}</b>;
    push(element);
  }
  if (stack.length > 1) throw new Error(`Rich text: <${stack[stack.length - 1].tag}> is never closed in "${source}"`);
  if (at < source.length) push(decode(source.slice(at)));
  return root.children;
}

/** One string of the study's wording, with its inline emphasis drawn. */
export function Rich({ text }: { text: string }) {
  return <>{build(text).map((child, i) => <Fragment key={i}>{child}</Fragment>)}</>;
}
