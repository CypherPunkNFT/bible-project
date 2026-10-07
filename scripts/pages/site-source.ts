// Reading helpers for the Site area's CONTENT.md extractors (site.ts and site-*.ts beside it).
// They read the page files with the TypeScript parser (through study-source.ts) and never change or render anything.
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { WEBSITE } from "./study-lib";
import { jsxRoots, type JsxNode } from "./study-source";

/** Elements whose whole text is one readable block (a heading, a paragraph, a list item, a button…). */
const BLOCK = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "dt", "dd", "th", "td", "summary", "figcaption", "caption", "label", "button", "option"]);
const HEADING = /^h[1-6]$/;
const readable = (text: string) => text.replace(/[…\s·/|→↗↑↓×—–-]/g, "").length > 1 && /[A-Za-z]/.test(text);

/**
 * Everything a component prints, as Markdown bullets in source order: headings in bold, each paragraph, list item or
 * button whole (so mixed text such as "Find your place.<br/><em>Enter the Word.</em>" stays one line), and the
 * placeholder and title attributes. Computed values show as "…"; repeats are dropped.
 */
export async function readableText(relative: string, insideFunction?: string): Promise<string[]> {
  return readableLines(await jsxRoots(relative, insideFunction));
}

/** readableText for JSX elements already found (e.g. one <section> of a page). */
export function readableLines(nodes: JsxNode[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (text: string, bold = false) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!readable(clean) || seen.has(clean)) return;
    seen.add(clean);
    out.push(bold ? `**${clean}**` : clean);
  };
  const walk = (node: JsxNode) => {
    // A component's title prop is a visible heading (<Block title="How it works.">); an HTML title is a tooltip.
    const title = node.attrs.title && !node.attrs.title.startsWith("…") ? node.attrs.title : "";
    if (title && /^[A-Z]/.test(node.tag)) add(title, true);
    else if (title) add(`(tooltip) ${title}`);
    if (node.attrs.placeholder && !node.attrs.placeholder.startsWith("…")) add(`(placeholder) ${node.attrs.placeholder}`);
    if (BLOCK.has(node.tag.replace(/^motion\./, ""))) return add(node.text, HEADING.test(node.tag.replace(/^motion\./, "")));
    // An element with words of its own beside its children (a link "Explore the study" with an arrow icon) is one line.
    const letters = (text: string) => text.replace(/[^\p{L}\p{N}]/gu, "");
    // (A list drawn by .map() shows as "…" in the parent's text, so then the children carry more words: walk into them.)
    if (letters(node.text).length > letters(node.children.map((child) => child.text).join("")).length) return add(node.text);
    node.children.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

/** readableText as a Markdown list under a small caption naming the file, for a "Wording" section. */
export async function wordingList(relative: string, insideFunction?: string): Promise<string> {
  const lines = await readableText(relative, insideFunction);
  const where = `${path.basename(relative)}${insideFunction ? ` (${insideFunction})` : ""}`;
  return lines.length ? `*From ${where}:*\n\n${lines.map((line) => `- ${line}`).join("\n")}` : "";
}

const files = new Map<string, Promise<ts.SourceFile>>();
function parse(relative: string): Promise<ts.SourceFile> {
  let pending = files.get(relative);
  if (!pending) {
    pending = readFile(path.join(WEBSITE, ...relative.split("/")), "utf8").then((text) => ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX));
    files.set(relative, pending);
  }
  return pending;
}

/** A literal's readable value: strings as written, templates with "…" for each computed part, anything else "…". */
function looseValue(node: ts.Expression): unknown {
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) return looseValue(node.expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map((span) => `…${span.literal.text}`).join("");
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((element) => looseValue(element));
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(node.properties.flatMap((property) => {
      if (!ts.isPropertyAssignment(property)) return [];
      const key = ts.isStringLiteral(property.name) ? property.name.text : property.name.getText();
      return [[key, looseValue(property.initializer)]];
    }));
  }
  return "…";
}

/** A constant (top-level, or inside the named function) read loosely: templates keep their fixed words, the rest "…". */
export async function looseConstant<T>(relative: string, name: string, insideFunction?: string): Promise<T> {
  const file = await parse(relative);
  let found: ts.Expression | undefined;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isVariableDeclaration(node) && node.name.getText() === name && node.initializer) found = node.initializer;
    else ts.forEachChild(node, visit);
  };
  const scope = insideFunction ? file.statements.find((s) => ts.isFunctionDeclaration(s) && s.name?.text === insideFunction) : file;
  if (scope) visit(scope);
  if (!found) throw new Error(`Site content: no constant ${name}${insideFunction ? ` in ${insideFunction}()` : ""} in ${relative}`);
  return looseValue(found) as T;
}

/**
 * Lists written straight into the JSX of a function, e.g. {[["Does it cost anything?", "No…"], …].map(…)}:
 * every array of arrays that holds text, in source order, each row reduced to its text cells.
 */
export async function inlineTables(relative: string, insideFunction: string): Promise<string[][][]> {
  const file = await parse(relative);
  const scope = file.statements.find((s) => (ts.isFunctionDeclaration(s) && s.name?.text === insideFunction) || (ts.isVariableStatement(s) && s.declarationList.declarations.some((d) => d.name.getText() === insideFunction)));
  if (!scope) throw new Error(`Site content: no function ${insideFunction} in ${relative}`);
  const tables: string[][][] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isArrayLiteralExpression(node) && node.elements.length && node.elements.every((e) => ts.isArrayLiteralExpression(e))) {
      const rows = node.elements.map((row) => (row as ts.ArrayLiteralExpression).elements.map((cell) => looseValue(cell)).filter((cell): cell is string => typeof cell === "string" && cell !== "…"));
      if (rows.every((row) => row.length)) tables.push(rows);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(scope);
  return tables;
}

/** The props of every <Tag …/> inside a function, read loosely (numbers stay numbers, computed values are "…"). */
export async function componentProps(relative: string, insideFunction: string, tag: string): Promise<Record<string, unknown>[]> {
  const file = await parse(relative);
  const scope = file.statements.find((s) => ts.isFunctionDeclaration(s) && s.name?.text === insideFunction);
  if (!scope) throw new Error(`Site content: no function ${insideFunction} in ${relative}`);
  const found: Record<string, unknown>[] = [];
  const visit = (node: ts.Node): void => {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText() === tag) {
      found.push(Object.fromEntries(node.attributes.properties.flatMap((p) => {
        if (!ts.isJsxAttribute(p) || !p.initializer) return [];
        const value = ts.isStringLiteral(p.initializer) ? p.initializer.text : ts.isJsxExpression(p.initializer) && p.initializer.expression ? looseValue(p.initializer.expression) : "…";
        return [[p.name.getText(), value]];
      })));
    }
    ts.forEachChild(node, visit);
  };
  visit(scope);
  return found;
}

/** Replace each "…" in order with the given values (for counts the page computes from data the extractor also reads). */
export function fill(text: string, ...values: (string | number)[]): string {
  // JSX broken over lines loses the spaces around {count}; put them back between a word and the number.
  return text.split("…").reduce((out, part, i) => {
    if (i === 0) return part;
    if (i > values.length) return `${out}…${part}`;
    const before = /\p{L}$/u.test(out) ? " " : "";
    const after = /^\p{L}/u.test(part) ? " " : "";
    return `${out}${before}${values[i - 1]}${after}${part}`;
  }, "");
}
