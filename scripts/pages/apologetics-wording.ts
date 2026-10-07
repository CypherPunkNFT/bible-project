// Fixed wording written into the Apologetics page code (hero, headings, hints, the small card lists), read straight
// from the .tsx source with the TypeScript parser. Nothing is rendered; values filled in from content show as "…".
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { WEBSITE } from "./study-lib";
import { jsxRoots, type JsxNode } from "./study-source";

export const PAGE_FILE = "src/pages/ApologeticsPage.tsx";
export const LIBRARY_FILE = "src/pages/ReformedLibraryPage.tsx";
const ATTRIBUTES = ["eyebrow", "title", "lead", "link", "placeholder", "label"];
const PROPERTIES = ["title", "text", "description"];

const readable = (text: string) => text.replace(/[…\s·/|→↗↑↓×—–-]/g, "").length > 1 && /[A-Za-z]/.test(text);
const clean = (text: string) => text.replace(/\s+/g, " ").trim();

async function functionNode(file: string, name: string): Promise<ts.Node> {
  const text = await readFile(path.join(WEBSITE, ...file.split("/")), "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found = source.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name);
  if (!found) throw new Error(`Apologetics content: no function ${name} in ${file} (renamed? update scripts/pages/apologetics.ts)`);
  return found;
}

/** String values of title/text/description properties in object literals (the card lists mapped into JSX). */
async function objectStrings(file: string, name: string): Promise<string[]> {
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node) && PROPERTIES.includes(node.name.getText()) && ts.isStringLiteralLike(node.initializer)) found.push(node.initializer.text);
    ts.forEachChild(node, visit);
  };
  visit(await functionNode(file, name));
  return found;
}

/** Every readable piece of fixed wording in the named functions of a file, in source order, without repeats. */
export async function fixedWording(file: string, functions: string[]): Promise<string[]> {
  const seen = new Set<string>();
  const add = (text: string | undefined) => {
    const value = clean(text ?? "");
    if (readable(value)) seen.add(value);
  };
  const walk = (node: JsxNode): void => {
    if (!node.children.length || node.children.every((child) => !child.text)) add(node.text);
    for (const name of ATTRIBUTES) if (node.attrs[name] && !node.attrs[name].includes("…")) add(node.attrs[name]);
    node.children.forEach(walk);
  };
  for (const name of functions) {
    (await jsxRoots(file, name)).forEach(walk);
    (await objectStrings(file, name)).forEach(add);
  }
  return [...seen];
}

/** A Markdown section listing a page's fixed wording. */
export async function wordingSection(file: string, functions: string[]): Promise<string> {
  const items = await fixedWording(file, functions);
  return [
    "## Fixed wording on the page",
    "",
    `Written into the page code (${file}, ${functions.join(", ")}), in the order it appears. "…" marks a value filled in from the content above.`,
    "",
    ...items.map((item) => `- ${item}`),
  ].join("\n");
}
