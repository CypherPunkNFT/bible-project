// Reads fixed wording that lives only inside the Study pages' .tsx files (headers, card text, credits), straight from
// the source with the TypeScript parser. Nothing in the site is changed or rendered; dynamic parts show as "…".
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { WEBSITE } from "./study-lib";

/** One JSX element: its tag, its plain attributes, its readable text, and the elements inside it. */
export interface JsxNode {
  tag: string;
  attrs: Record<string, string>;
  text: string;
  children: JsxNode[];
}

const sources = new Map<string, Promise<ts.SourceFile>>();
function parse(relative: string): Promise<ts.SourceFile> {
  let pending = sources.get(relative);
  if (!pending) {
    pending = readFile(path.join(WEBSITE, ...relative.split("/")), "utf8").then((text) => ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX));
    sources.set(relative, pending);
  }
  return pending;
}

const tidy = (text: string) => text.replace(/\s+/g, " ").replace(/ ([.,;:!?)’”])/g, "$1").replace(/([(“‘]) /g, "$1").trim();

/** Readable text of an expression inside JSX: string literals as written, JSX flattened, anything computed as "…". */
function expressionText(node: ts.Expression): string {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isParenthesizedExpression(node)) return expressionText(node.expression);
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return elementOf(node).text;
  if (ts.isConditionalExpression(node)) return `${expressionText(node.whenTrue)} / ${expressionText(node.whenFalse)}`;
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return expressionText(node.right);
  if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map((span) => `…${span.literal.text}`).join("");
  return "…";
}

function tagName(node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment): string {
  if (ts.isJsxFragment(node)) return "";
  const opening = ts.isJsxElement(node) ? node.openingElement : node;
  return opening.tagName.getText();
}

function attributesOf(node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment): Record<string, string> {
  if (ts.isJsxFragment(node)) return {};
  const opening = ts.isJsxElement(node) ? node.openingElement : node;
  const attrs: Record<string, string> = {};
  for (const property of opening.attributes.properties) {
    if (!ts.isJsxAttribute(property)) continue;
    const name = property.name.getText();
    const value = property.initializer;
    if (!value) attrs[name] = "true";
    else if (ts.isStringLiteral(value)) attrs[name] = value.text;
    else if (ts.isJsxExpression(value) && value.expression) attrs[name] = tidy(expressionText(value.expression));
    else if (ts.isJsxElement(value) || ts.isJsxSelfClosingElement(value) || ts.isJsxFragment(value)) attrs[name] = elementOf(value).text;
  }
  return attrs;
}

function elementOf(node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment): JsxNode {
  const children: JsxNode[] = [];
  const pieces: string[] = [];
  const kids = ts.isJsxSelfClosingElement(node) ? [] : node.children;
  for (const kid of kids) {
    // Text on one line keeps its spaces ("{count} people"); text broken over lines is trimmed as React does.
    if (ts.isJsxText(kid)) pieces.push(kid.text.includes("\n") ? kid.text.split("\n").map((line) => line.trim()).filter(Boolean).join(" ") : kid.text);
    else if (ts.isJsxExpression(kid)) {
      if (!kid.expression) continue;
      pieces.push(expressionText(kid.expression));
      collect(kid.expression, children);
    } else {
      const child = elementOf(kid);
      children.push(child);
      pieces.push(` ${child.text} `);
    }
  }
  return { tag: tagName(node), attrs: attributesOf(node), text: tidy(pieces.join("")), children };
}

/** The outermost JSX elements found anywhere under a node, in source order. */
function collect(root: ts.Node, into: JsxNode[]): JsxNode[] {
  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) into.push(elementOf(node));
    else ts.forEachChild(node, visit);
  };
  visit(root);
  return into;
}

/** Every JSX element in a file (outermost first, each with its nested children). */
export async function jsxRoots(relative: string, insideFunction?: string): Promise<JsxNode[]> {
  const file = await parse(relative);
  if (!insideFunction) return collect(file, []);
  const target = file.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === insideFunction);
  if (!target) throw new Error(`Study content: no function ${insideFunction} in ${relative}`);
  return collect(target, []);
}

/** Depth-first search through JSX trees. */
export function findAll(nodes: JsxNode[], match: (node: JsxNode) => boolean): JsxNode[] {
  const found: JsxNode[] = [];
  const walk = (node: JsxNode) => {
    if (match(node)) found.push(node);
    node.children.forEach(walk);
  };
  nodes.forEach(walk);
  return found;
}
export const byTag = (tag: string) => (node: JsxNode) => node.tag === tag;
export const byClass = (name: string) => (node: JsxNode) => (node.attrs.className ?? "").split(" ").includes(name);
export const first = (nodes: JsxNode[], match: (node: JsxNode) => boolean) => findAll(nodes, match)[0];

/**
 * The fixed interface wording in a component file: each element's readable text (buttons, hints, headings, captions)
 * and its placeholder/title/label attributes, in source order, without repeats. Computed values show as "…".
 */
export async function wording(relative: string, insideFunction?: string): Promise<string[]> {
  const seen = new Set<string>();
  const add = (text: string | undefined) => {
    const clean = tidy(text ?? "");
    if (clean.replace(/[…\s·/|→↗↑↓×—–-]/g, "").length > 1 && /[A-Za-z]/.test(clean)) seen.add(clean);
  };
  const walk = (node: JsxNode) => {
    if (!node.children.length || node.children.every((child) => !child.text)) add(node.text);
    for (const name of ["placeholder", "title", "label"]) if (node.attrs[name] && !node.attrs[name].includes("…")) add(node.attrs[name]);
    node.children.forEach(walk);
  };
  (await jsxRoots(relative, insideFunction)).forEach(walk);
  return [...seen];
}

/**
 * A constant whose value is plain literal data (arrays, objects, strings, numbers), exported or not: top-level, or
 * declared inside the named function. With `loose`, computed parts (names, calls) come back as "…" instead of failing.
 */
export async function literalConstant<T>(relative: string, name: string, options: { insideFunction?: string; loose?: boolean } = {}): Promise<T> {
  const file = await parse(relative);
  let found: ts.Expression | undefined;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (ts.isVariableDeclaration(node) && node.name.getText() === name && node.initializer) found = node.initializer;
    else ts.forEachChild(node, visit);
  };
  const scope = options.insideFunction ? file.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === options.insideFunction) : file;
  if (scope) visit(scope);
  if (!found) throw new Error(`Study content: no constant ${name}${options.insideFunction ? ` in ${options.insideFunction}()` : ""} in ${relative}`);
  return literalValue(found, `${relative} ${name}`, options.loose) as T;
}

/** The value of a JSX attribute (e.g. figures={[...]}) on the first element with that tag in a function, read loosely. */
export async function attributeLiteral<T>(relative: string, insideFunction: string, tag: string, attribute: string): Promise<T> {
  const file = await parse(relative);
  let found: ts.Expression | undefined;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText() === tag) {
      const property = node.attributes.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText() === attribute);
      if (property && ts.isJsxAttribute(property) && property.initializer && ts.isJsxExpression(property.initializer)) found = property.initializer.expression;
    }
    ts.forEachChild(node, visit);
  };
  const scope = file.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === insideFunction);
  if (scope) visit(scope);
  if (!found) throw new Error(`Study content: no ${tag} ${attribute}= in ${insideFunction}() in ${relative}`);
  return literalValue(found, `${relative} ${tag} ${attribute}`, true) as T;
}

function literalValue(node: ts.Expression, where: string, loose = false): unknown {
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) return literalValue(node.expression, where, loose);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return -Number(node.operand.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((element) => literalValue(element as ts.Expression, where, loose));
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(node.properties.map((property) => {
      if (ts.isShorthandPropertyAssignment(property) && loose) return [property.name.text, "…"];
      if (!ts.isPropertyAssignment(property)) throw new Error(`Study content: ${where} holds a computed object member`);
      const key = ts.isStringLiteral(property.name) ? property.name.text : property.name.getText();
      return [key, literalValue(property.initializer, where, loose)];
    }));
  }
  if (loose) return "…";
  throw new Error(`Study content: ${where} is not plain literal data (found ${ts.SyntaxKind[node.kind]})`);
}
