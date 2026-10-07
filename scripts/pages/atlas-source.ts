// Reads Atlas content straight from the page code, for the generated CONTENT.md files (see atlas.ts).
// Two jobs, both read-only on the app's files:
//  - loadConstants(): some of the Atlas wording is kept in constants a component file does not export
//    (exporting them would break the site's lint rule for component files). This copies just those
//    declarations, plus the imports they use, into a throwaway module in the system temp folder and loads it.
//  - fixedWording(): the wording written directly into a component's markup (headings, buttons, notes).
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

export const WEBSITE = path.resolve(import.meta.dirname, "..", "..");
const SRC = path.join(WEBSITE, "src");

/** This runs under Bun (bun run pages:content); its resolver is used so imports resolve exactly as Bun loads them. */
const bun = (globalThis as unknown as { Bun: { resolveSync(specifier: string, from: string): string } }).Bun;

const parse = (file: string, text: string) => ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/** Resolve an import as the site's build would (the "@/" prefix means src/), to an absolute path. */
function resolveImport(spec: string, fromFile: string): string {
  if (spec.startsWith("@/")) return bun.resolveSync(`./${spec.slice(2)}`, SRC);
  return bun.resolveSync(spec, path.dirname(fromFile));
}

function identifiersIn(node: ts.Node, found = new Set<string>()): Set<string> {
  if (ts.isIdentifier(node)) found.add(node.text);
  node.forEachChild((child) => void identifiersIn(child, found));
  return found;
}

function importLine(statement: ts.ImportDeclaration, used: Set<string>, fromFile: string): string | null {
  const clause = statement.importClause;
  if (!clause || clause.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier)) return null;
  const parts: string[] = [];
  if (clause.name && used.has(clause.name.text)) parts.push(clause.name.text);
  const bindings = clause.namedBindings;
  if (bindings && ts.isNamespaceImport(bindings) && used.has(bindings.name.text)) parts.push(`* as ${bindings.name.text}`);
  if (bindings && ts.isNamedImports(bindings)) {
    const named = bindings.elements
      .filter((element) => !element.isTypeOnly && used.has(element.name.text))
      .map((element) => (element.propertyName ? `${element.propertyName.text} as ${element.name.text}` : element.name.text));
    if (named.length) parts.push(`{ ${named.join(", ")} }`);
  }
  if (!parts.length) return null;
  const target = resolveImport(statement.moduleSpecifier.text, fromFile).split(path.sep).join("/");
  return `import ${parts.join(", ")} from ${JSON.stringify(target)};`;
}

/**
 * Load top-level constants from a site file, exported or not. Only the named declarations and the imports they
 * use are copied, so the rest of the component (maps, styles, browser code) is never loaded. Names in `stubs`
 * are set to null instead of imported.
 */
export async function loadConstants(relativeFile: string, names: string[], stubs: string[] = []): Promise<Record<string, unknown>> {
  const file = path.join(WEBSITE, relativeFile);
  const source = parse(file, await readFile(file, "utf8"));
  const declarations = source.statements.filter(
    (statement): statement is ts.VariableStatement =>
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.some((declaration) => ts.isIdentifier(declaration.name) && names.includes(declaration.name.text)),
  );
  const declared = new Set(declarations.flatMap((statement) => statement.declarationList.declarations.map((d) => d.name.getText(source))));
  const missing = names.filter((name) => !declared.has(name));
  if (missing.length) throw new Error(`${relativeFile}: expected top-level constants ${missing.join(", ")}, found none by that name (renamed?)`);
  const used = new Set<string>();
  declarations.forEach((statement) => identifiersIn(statement, used));
  // Imported values the content does not need (e.g. map bounds) can be stubbed so their module is not loaded.
  stubs.forEach((name) => used.delete(name));
  const imports = source.statements
    .filter(ts.isImportDeclaration)
    .map((statement) => importLine(statement, used, file))
    .filter((line): line is string => line !== null);
  const body = declarations.map((statement) => statement.getText(source).replace(/^export\s+/, ""));
  const module = [...imports, ...stubs.map((name) => `const ${name} = null;`), ...body, `export { ${names.join(", ")} };`, ""].join("\n");
  const dir = path.join(os.tmpdir(), "bible-pages-atlas");
  const temp = path.join(dir, `${path.basename(file, path.extname(file))}-${createHash("sha256").update(module).digest("hex").slice(0, 12)}.tsx`);
  await mkdir(dir, { recursive: true });
  await writeFile(temp, module, "utf8");
  try {
    return (await import(pathToFileURL(temp).href)) as Record<string, unknown>;
  } finally {
    await rm(temp, { force: true });
  }
}

export interface Wording {
  kind: string;
  text: string;
}

const KIND: Record<string, string> = {
  h1: "Page heading", h2: "Heading", h3: "Heading", h4: "Heading", p: "Text", li: "List item",
  button: "Button", Link: "Link", NavLink: "Link", a: "Link", label: "Label",
};

/** The fixed phrases an expression can produce (several for a condition), or none when it depends on the data. */
function alternatives(expression: ts.Expression | undefined): string[] | null {
  if (!expression) return null;
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return [expression.text];
  if (ts.isParenthesizedExpression(expression)) return alternatives(expression.expression);
  if (ts.isConditionalExpression(expression)) {
    const yes = alternatives(expression.whenTrue);
    const no = alternatives(expression.whenFalse);
    if (yes && no) return [...yes, ...no];
  }
  return null;
}

/** A string the expression always produces, [a / b] for a choice of phrases, or "…" when it depends on the data. */
function expressionText(expression: ts.Expression | undefined): { text: string; literal: boolean } {
  if (!expression) return { text: "", literal: false };
  const options = alternatives(expression);
  if (!options) return { text: "…", literal: false };
  return { text: options.length === 1 ? options[0] : `[${options.join(" / ")}]`, literal: true };
}

function flatten(children: ts.NodeArray<ts.JsxChild>): string {
  return children
    .map((child) => {
      if (ts.isJsxText(child)) return child.text.replace(/\s+/g, " ");
      if (ts.isJsxExpression(child)) return expressionText(child.expression).text;
      if (ts.isJsxElement(child)) return flatten(child.children);
      if (ts.isJsxSelfClosingElement(child) && child.tagName.getText() === "br") return " ";
      return "";
    })
    .join("")
    .replace(/\s+/g, " ")
    .replace(/(… ?)+…/g, "…")
    .trim();
}

const hasOwnWords = (element: ts.JsxElement) =>
  element.children.some(
    (child) =>
      (ts.isJsxText(child) && /[A-Za-z]/.test(child.text)) ||
      (ts.isJsxExpression(child) && expressionText(child.expression).literal && /[A-Za-z]/.test(expressionText(child.expression).text)),
  );

function collect(node: ts.Node, out: Wording[]): void {
  if (ts.isJsxElement(node) && hasOwnWords(node)) {
    const tag = node.openingElement.tagName.getText();
    out.push({ kind: KIND[tag] ?? "Label", text: flatten(node.children) });
    return;
  }
  if (ts.isJsxAttribute(node) && ["placeholder", "title"].includes(node.name.getText()) && node.initializer && ts.isStringLiteral(node.initializer)) {
    out.push({ kind: node.name.getText() === "placeholder" ? "Search box hint" : "Hover hint", text: node.initializer.text });
  }
  node.forEachChild((child) => collect(child, out));
}

/**
 * The wording written directly into a component's markup, in source order. With `functions`, only those
 * components are read. Data-driven parts show as "…"; a choice between two fixed phrases shows as [a / b].
 */
export async function fixedWording(relativeFile: string, functions?: string[]): Promise<Wording[]> {
  const file = path.join(WEBSITE, relativeFile);
  const source = parse(file, await readFile(file, "utf8"));
  const roots = functions
    ? functions.map((name) => {
        const found = source.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name);
        if (!found) throw new Error(`${relativeFile}: expected a component named ${name}, found none (renamed?)`);
        return found;
      })
    : [source];
  const out: Wording[] = [];
  roots.forEach((root) => collect(root, out));
  const seen = new Set<string>();
  return out.filter((entry) => entry.text && !seen.has(`${entry.kind}|${entry.text}`) && seen.add(`${entry.kind}|${entry.text}`));
}
