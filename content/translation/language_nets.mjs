// The build check's language nets (translation system, stage 4 job 9; SiteTranslation/system/HANDOFF.md), read from
// each page file's syntax tree with the site's own TypeScript. Run by build_nets.py, never by hand:
//   stdin:  {"files": {name: source}, "pageHead": "src/lib/page-head.ts", "languageFile": "src/lib/language.ts",
//            "formatModule": "src/lib/site-format.ts"}
//           (a name may start with "before:" for a file's older version; the rest of the name is its path)
//   stdout: {"processed": [names], "errors": {name: [message]}, "findings": [{net, file, line, key}],
//            "translatedData": {name: {line, prefixes} | {line, error}}, "plurals": [{file, line, one, many}]}
// Nets: plural (hand-written singular/plural choices, and site-format.ts's plural() given words not written out), format
// (number and date formats, and sorts, forced to a fixed language or left to the browser; site-format.ts's helpers read
// the site's language), title (tab titles and descriptions the translator never reaches), pieced (sentences built
// from pieces), datapath (texts shaped like a data path, judged by build_nets.py). Keys are built from the tree, with
// names and properties written {n}, so renaming a variable or reformatting a line does not make a finding new.
import { createRequire } from 'node:module';

const ts = createRequire(import.meta.url)('typescript');
const SITE_NAME = 'Bible Guide';
const GLOBALS = new Set(['Intl', 'document', 'window', 'navigator', 'Math', 'Number', 'Date', 'Object', 'Array', 'JSON', 'String', 'console']);
const FORMAT_METHODS = new Set(['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString']);
const INTL_FORMATS = new Set(['NumberFormat', 'DateTimeFormat', 'DisplayNames', 'PluralRules', 'RelativeTimeFormat', 'ListFormat', 'Collator']);
const FORMAT_MODULE = /(?:^|\/)site-format(?:\.ts)?$/; // an import of the site's own helpers (src/lib/site-format.ts)
const DATA_PATH = /^(?:\/data\/)?[\w.-]+(?:\/|\.json)/;
const MIME = /^(?:text|application|image|audio|video|font|multipart)\/[\w.+-]+(?:\s*;.*)?$/i;
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const WORD = /[A-Za-z]{2,}/;

const pathOf = (name) => name.replace(/^before:/, '');
const squeeze = (text) => text.replace(/\s+/g, ' ').trim();
const decode = (text) => text.replace(/&(#x?[0-9a-f]+|\w+);/gi, (all, code) => code[0] === '#'
  ? String.fromCodePoint(parseInt(code.slice(code[1] === 'x' || code[1] === 'X' ? 2 : 1), code[1] === 'x' || code[1] === 'X' ? 16 : 10))
  : ENTITIES[code.toLowerCase()] ?? all);
const isText = (node) => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node));
const hasWord = (text) => WORD.test(text.replaceAll(SITE_NAME, ''));
// A text that reads as a class name, an address or a selector rather than words.
const codeLike = (text) => /[\/?=#{}<>;]|:\/\/|var\(/.test(text) || /^(?:\s*(?:px|r?em|v[hw]|ms|deg|fr|ch|%)\s*)+$/.test(text)
  || text.trim().split(/\s+/).filter(Boolean).every((token) => /[-_:[\]]|^\d/.test(token));

function bare(node) {
  while (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)
    || ts.isTypeAssertionExpression(node) || (ts.isSatisfiesExpression && ts.isSatisfiesExpression(node)))) node = node.expression;
  return node;
}

/** The node written with names and properties as {n}, quotes and spacing made uniform. */
function shape(node) {
  node = bare(node);
  if (!node) return '';
  if (isText(node)) return JSON.stringify(node.text);
  if (ts.isNumericLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return '`' + node.head.text + node.templateSpans.map((span) => '${' + shape(span.expression) + '}' + span.literal.text).join('') + '`';
  if (ts.isIdentifier(node)) return GLOBALS.has(node.text) || node.text === 'undefined' ? node.text : '{n}';
  if (ts.isPropertyAccessExpression(node)) {
    const object = shape(node.expression);
    return GLOBALS.has(object) ? `${object}.${node.name.text}` : '{n}';
  }
  if (ts.isElementAccessExpression(node) || node.kind === ts.SyntaxKind.ThisKeyword) return '{n}';
  if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
    const callee = bare(node.expression);
    const object = ts.isPropertyAccessExpression(callee) ? bare(callee.expression) : null;
    const wrapped = object && (ts.isBinaryExpression(object) || ts.isConditionalExpression(object)) ? `(${shape(object)})` : object && shape(object);
    const name = ts.isIdentifier(callee) ? callee.text : object ? `${wrapped}.${callee.name.text}` : shape(callee);
    return `${ts.isNewExpression(node) ? 'new ' : ''}${name}(${(node.arguments ?? []).map(shape).join(', ')})`;
  }
  if (ts.isBinaryExpression(node)) return `${shape(node.left)} ${node.operatorToken.getText()} ${shape(node.right)}`;
  if (ts.isConditionalExpression(node)) return `${shape(node.condition)} ? ${shape(node.whenTrue)} : ${shape(node.whenFalse)}`;
  if (ts.isPrefixUnaryExpression(node)) return ts.tokenToString(node.operator) + shape(node.operand);
  if (ts.isVoidExpression(node)) return 'void ' + shape(node.expression);
  if (ts.isArrayLiteralExpression(node)) return '[' + node.elements.map(shape).join(', ') + ']';
  if (ts.isObjectLiteralExpression(node)) return '{…}';
  if (ts.isJsxElement(node) || ts.isJsxFragment(node) || ts.isJsxSelfClosingElement(node)) return `<${squeeze(jsxWords(node))}>`;
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return '=>';
  return node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword ? node.getText() : '{n}';
}

/** The words a piece of code would show: its texts, template text, JSX text and text arguments. */
function shownText(node) {
  node = bare(node);
  if (!node) return '';
  if (isText(node)) return node.text;
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(' ');
  if (ts.isJsxElement(node) || ts.isJsxFragment(node) || ts.isJsxSelfClosingElement(node)) return jsxWords(node);
  if (ts.isCallExpression(node)) return node.arguments.filter((argument) => isText(bare(argument))).map((argument) => bare(argument).text).join(' ');
  return '';
}

function jsxWords(node) {
  const words = [];
  const visit = (child) => {
    if (ts.isJsxText(child)) words.push(decode(child.text));
    else if (ts.isJsxExpression(child) && isText(bare(child.expression))) words.push(bare(child.expression).text);
    ts.forEachChild(child, visit);
  };
  visit(node);
  return words.join(' ');
}

const wordy = (node) => { const text = shownText(node); return hasWord(text) && !codeLike(text); };
const ending = (node) => isText(bare(node)) && /^(?:s|es|)$/.test(bare(node).text);

/** `n === 1`, `n > 1`, `n < 2` and the like: a test of whether a count is one. */
function countTest(node) {
  node = bare(node);
  if (!node || !ts.isBinaryExpression(node)) return false;
  const op = node.operatorToken.kind, K = ts.SyntaxKind, left = bare(node.left), right = bare(node.right);
  const literal = (side, value) => side && ts.isNumericLiteral(side) && side.text === value;
  const equality = [K.EqualsEqualsEqualsToken, K.EqualsEqualsToken, K.ExclamationEqualsEqualsToken, K.ExclamationEqualsToken].includes(op);
  return (literal(right, '1') && (equality || op === K.GreaterThanToken || op === K.LessThanEqualsToken))
    || (literal(left, '1') && (equality || op === K.LessThanToken || op === K.GreaterThanEqualsToken))
    || (literal(right, '2') && (op === K.LessThanToken || op === K.GreaterThanEqualsToken))
    || (literal(left, '2') && (op === K.GreaterThanToken || op === K.LessThanEqualsToken));
}

const helperForm = (node) => ts.isConditionalExpression(node) && countTest(node.condition)
  && ts.isIdentifier(bare(node.whenTrue)) && ts.isIdentifier(bare(node.whenFalse));

/** Whether a branch writes its count through site-format.ts's plural(): the test then only chooses between two
 * messages ("Told in {n} books" or "Passage"), and plural() gives the count its grammar. */
function holdsPlural(node, central) {
  let found = false;
  const visit = (child) => {
    if (found) return;
    if (ts.isCallExpression(child) && ts.isIdentifier(child.expression) && child.expression.text === 'plural' && central.has('plural')) found = true;
    else ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

function pluralChoice(node, central) {
  if (ts.isConditionalExpression(node)) {
    if (holdsPlural(node.whenTrue, central) || holdsPlural(node.whenFalse, central)) return false;
    const counted = countTest(node.condition);
    const endings = ending(node.whenTrue) && ending(node.whenFalse) && bare(node.whenTrue).text !== bare(node.whenFalse).text;
    return endings || (counted && (wordy(node.whenTrue) || wordy(node.whenFalse))) || helperForm(node);
  }
  return ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
    && countTest(node.left) && ending(node.right) && bare(node.right).text !== '';
}

/** The names of functions holding the `n === 1 ? one : many` choice (the pages' own plural helpers). */
function helperNames(sourceFile) {
  const names = [];
  const visit = (node) => {
    if (helperForm(node)) {
      let up = node.parent;
      while (up && !ts.isFunctionDeclaration(up) && !(ts.isVariableDeclaration(up) && up.initializer && ts.isArrowFunction(up.initializer))) up = up.parent;
      if (up?.name && ts.isIdentifier(up.name) && /^[a-z]/.test(up.name.text)) names.push(up.name.text); // not a component
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return names;
}

function parentSkippingBrackets(node) {
  let up = node.parent;
  while (up && ts.isParenthesizedExpression(up)) up = up.parent;
  return up;
}

/** The names a file imports from site-format.ts: its plural() is the right way, never a hand-written helper. */
function centralNames(sourceFile) {
  const names = new Set();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !isText(statement.moduleSpecifier) || !FORMAT_MODULE.test(statement.moduleSpecifier.text)) continue;
    const bound = statement.importClause?.namedBindings;
    if (bound && ts.isNamedImports(bound)) bound.elements.forEach((element) => names.add(element.name.text));
  }
  return names;
}

/** site-format.ts's plural(n, one, many[, "word"]): its two forms are one message the collector registers, so both
 * must be written out as texts ("{n} book", "{n} books"), and the count's style too when given. Anything else is a
 * finding. */
function centralPlural(node, add, plurals, sourceFile, name) {
  const [, one, many, as] = node.arguments.map(bare);
  if ((node.arguments.length === 3 || (node.arguments.length === 4 && isText(as))) && isText(one) && isText(many)) {
    plurals.push({ file: name, line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1, one: one.text, many: many.text });
  } else add('plural', node, shape(node));
}

function pluralNet(node, add, helpers, central) {
  if (pluralChoice(node, central)) {
    const up = parentSkippingBrackets(node);
    if (!(up && ts.isConditionalExpression(up) && up.condition !== node && pluralChoice(up, central))) add('plural', node, shape(node));
  } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && helpers.has(node.expression.text)
    && node.arguments.some((argument) => isText(bare(argument)) && hasWord(bare(argument).text))) {
    add('plural', node, shape(node));
  }
}

/** Constants a file gives a literal value (`const LOCALE = "en-US"`), so a name can be read through. */
function constants(sourceFile) {
  const found = new Map();
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && node.parent.flags & ts.NodeFlags.Const) {
      const value = bare(node.initializer);
      if (isText(value) || ts.isArrayLiteralExpression(value) || ts.isTemplateExpression(value)) found.set(node.name.text, value);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

const resolved = (node, known) => { node = bare(node); return node && ts.isIdentifier(node) && known.has(node.text) ? known.get(node.text) : node; };

/** "fixed" for a locale written into the code, "browser" for none (the browser's own language), else null. */
function localeKind(argument, known) {
  const node = resolved(argument, known);
  if (!node || (ts.isIdentifier(node) && node.text === 'undefined') || ts.isVoidExpression(node) || ts.isObjectLiteralExpression(node)) return 'browser';
  if (ts.isPropertyAccessExpression(node) && /^navigator\.languages?$/.test(node.getText().replace(/^window\./, ''))) return 'browser';
  if (isText(node)) return 'fixed';
  if (ts.isArrayLiteralExpression(node)) return node.elements.length === 0 ? 'browser' : node.elements.every((item) => isText(bare(item))) ? 'fixed' : null;
  return null;
}

function formatNet(node, add, known) {
  if (!ts.isCallExpression(node) && !ts.isNewExpression(node)) return;
  const callee = bare(node.expression);
  if (!ts.isPropertyAccessExpression(callee)) return;
  const method = FORMAT_METHODS.has(callee.name.text);
  const intl = ts.isIdentifier(callee.expression) && callee.expression.text === 'Intl' && INTL_FORMATS.has(callee.name.text);
  if (callee.name.text === 'localeCompare') { // a sort in the browser's language, or a fixed one: compareText()
    if (localeKind(node.arguments?.[1], known)) add('format', node, shape(node));
    return;
  }
  if (!method && !intl) return;
  const up = parentSkippingBrackets(node);
  if (intl && up && ts.isPropertyAccessExpression(up) && up.name.text === 'resolvedOptions') return; // a time-zone lookup
  if (localeKind(node.arguments?.[0], known)) add('format', node, shape(node));
}

function isDocumentTitle(node) {
  node = bare(node);
  const owner = (expression) => bare(expression).getText().replace(/\s/g, '').replace(/^window\./, '') === 'document';
  if (ts.isPropertyAccessExpression(node)) return node.name.text === 'title' && owner(node.expression);
  return ts.isElementAccessExpression(node) && isText(bare(node.argumentExpression)) && bare(node.argumentExpression).text === 'title' && owner(node.expression);
}

/** A title written in the code: anything but a plain name or property (a title kept or built elsewhere) or the site's
 * own name (the default put back when a page closes). */
function writtenTitle(value, known) {
  const node = resolved(value, known);
  if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) return false;
  return !(isText(node) && node.text === SITE_NAME);
}

function titleNet(node, add, known) {
  const K = ts.SyntaxKind;
  if (ts.isBinaryExpression(node) && [K.EqualsToken, K.PlusEqualsToken].includes(node.operatorToken.kind) && isDocumentTitle(node.left)) {
    if (node.operatorToken.kind === K.PlusEqualsToken || writtenTitle(node.right, known)) add('title', node, shape(resolved(node.right, known)));
    return;
  }
  // A page's own description: setAttribute("content", "...") or setMeta(..., "content", "..."), or meta.content = "...".
  let value = null;
  if (ts.isCallExpression(node)) {
    const args = node.arguments, at = args.findIndex((item) => isText(bare(item)) && bare(item).text === 'content');
    if (at >= 0 && at + 1 < args.length && /setAttribute|setMeta/.test(node.expression.getText())) value = args[at + 1];
  } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === K.EqualsToken && ts.isPropertyAccessExpression(bare(node.left)) && bare(node.left).name.text === 'content') {
    value = node.right;
  }
  const text = value && resolved(value, known);
  if (text && (isText(text) || ts.isTemplateExpression(text)) && hasWord(shownText(text)) && !codeLike(shownText(text))) add('title', node, shape(text));
}

/** Every text in the file that names pages (page-head.ts): all of it reaches the tab title or description. */
function pageHeadNet(node, add) {
  if (!isText(node) && !ts.isTemplateExpression(node)) return;
  const up = parentSkippingBrackets(node), text = shownText(node);
  if (!hasWord(text) || text === SITE_NAME || /^\//.test(text) || text.includes('://')) return;
  if (up && ((ts.isPropertyAssignment(up) && up.name === node) || ts.isCaseClause(up) || ts.isImportDeclaration(up)
    || ts.isExportDeclaration(up) || ts.isLiteralTypeNode(up))) return;
  if (up && ts.isBinaryExpression(up) && /^[!=]==?$/.test(up.operatorToken.getText())) return;
  add('title', node, shape(node));
}

const insideLog = (node) => {
  for (let up = node.parent; up && !ts.isStatement(up); up = up.parent) {
    if (ts.isNewExpression(up) && /Error$/.test(up.expression.getText())) return true;
    if (ts.isCallExpression(up) && /^console\./.test(up.expression.getText())) return true;
  }
  return ts.isThrowStatement(node.parent);
};

function containsJsx(node) {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return true;
  return ts.forEachChild(node, containsJsx) ?? false;
}

/** Text and {values} side by side in one run of a JSX element's children: the translator gets each piece alone. */
function jsxRuns(node, add) {
  let run = [];
  const flush = () => {
    const pieces = run.map((child) => ts.isJsxText(child) ? { text: decode(child.text), node: child }
      : isText(bare(child.expression)) ? { text: bare(child.expression).text, node: child } : { value: true, node: child });
    const worded = pieces.find((piece) => piece.text !== undefined && hasWord(piece.text));
    if (worded && pieces.some((piece) => piece.value)) {
      const raw = worded.node.getText();
      add('pieced', worded.node, squeeze(pieces.map((piece) => piece.value ? '{n}' : piece.text).join('')),
        worded.node.getStart() + (raw.length - raw.trimStart().length));
    }
    run = [];
  };
  for (const child of node.children) {
    const jsxInside = ts.isJsxExpression(child) && child.expression && containsJsx(child.expression);
    if (ts.isJsxText(child) || (ts.isJsxExpression(child) && child.expression && !jsxInside)) run.push(child);
    else if (!(ts.isJsxExpression(child) && !child.expression)) flush(); // a {/* comment */} breaks nothing
  }
  flush();
}

/** "Showing " + n + " results": the collector registers the pieces, never the whole line with its value. */
function concatenation(node, add) {
  const K = ts.SyntaxKind, op = ts.isBinaryExpression(node) ? node.operatorToken.kind : null;
  if (op !== K.PlusToken && op !== K.PlusEqualsToken) return;
  const up = parentSkippingBrackets(node);
  if (op === K.PlusToken && up && ts.isBinaryExpression(up) && up.operatorToken.kind === K.PlusToken) return;
  if (insideLog(node) || (up && ts.isBinaryExpression(up) && isDocumentTitle(up.left)) || isDocumentTitle(node.left)) return;
  const parts = [];
  const flatten = (part) => {
    part = bare(part);
    if (ts.isBinaryExpression(part) && part.operatorToken.kind === K.PlusToken) { flatten(part.left); flatten(part.right); } else parts.push(part);
  };
  if (op === K.PlusEqualsToken) parts.push(node.left);
  flatten(op === K.PlusEqualsToken ? node.right : node);
  const fixed = parts.filter((part) => isText(part)).map((part) => part.text).join(' ');
  if (hasWord(fixed) && !codeLike(fixed) && parts.some((part) => !isText(part) && !ts.isNumericLiteral(part))) {
    add('pieced', node, squeeze(parts.map((part) => isText(part) ? part.text : '{n}').join('')));
  }
}

function datapathNet(node, add) {
  const text = isText(node) ? node.text : ts.isTemplateExpression(node) ? node.head.text : null;
  if (text && DATA_PATH.test(text) && !MIME.test(text) && !(text.startsWith('/') && !text.startsWith('/data/'))) add('datapath', node, text);
}

/** TRANSLATED_DATA's prefixes, read from the tree so a type, `as const` or line breaks do not hide them. */
function translatedData(sourceFile) {
  let found = null;
  const visit = (node) => {
    if (!found && ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'TRANSLATED_DATA') {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      const list = bare(node.initializer);
      if (!list || !ts.isArrayLiteralExpression(list)) found = { line, error: 'is not a list written in place' };
      else if (!list.elements.every((item) => isText(bare(item)))) found = { line, error: 'holds something other than plain texts' };
      else found = { line, prefixes: list.elements.map((item) => bare(item).text) };
    }
    if (!found) ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

const translateNo = (node) => ts.isJsxElement(node) && node.openingElement.attributes.properties.some((attribute) =>
  ts.isJsxAttribute(attribute) && attribute.name.getText() === 'translate' && attribute.initializer
  && isText(attribute.initializer) && attribute.initializer.text === 'no');

function walkFile(name, sourceFile, request, helpers, findings, plurals) {
  const known = constants(sourceFile), pageHead = pathOf(name) === request.pageHead;
  const central = centralNames(sourceFile), formatModule = pathOf(name) === request.formatModule;
  const add = (net, node, key, position = node.getStart(sourceFile)) =>
    findings.push({ net, file: name, line: sourceFile.getLineAndCharacterOfPosition(position).line + 1, key });
  const visit = (node, skipped) => {
    skipped = skipped || translateNo(node);
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && central.has(node.expression.text)) {
      if (node.expression.text === 'plural') centralPlural(node, add, plurals, sourceFile, name);
    } else if (!formatModule) {
      pluralNet(node, add, helpers, central);
      formatNet(node, add, known);
    }
    titleNet(node, add, known);
    if (pageHead) pageHeadNet(node, add);
    if (!skipped && (ts.isJsxElement(node) || ts.isJsxFragment(node))) jsxRuns(node, add);
    if (!skipped) concatenation(node, add);
    datapathNet(node, add);
    ts.forEachChild(node, (child) => visit(child, skipped));
  };
  visit(sourceFile, false);
}

/** The parser for a file by its extension: plain JavaScript (.js, .mjs) is not read as TypeScript. */
function scriptKind(path) {
  if (path.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (path.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (path.endsWith('.js') || path.endsWith('.mjs')) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function run(request) {
  const parsed = Object.entries(request.files).map(([name, source]) => [name, ts.createSourceFile(pathOf(name), source,
    ts.ScriptTarget.Latest, true, scriptKind(pathOf(name)))]);
  const helpers = new Set(parsed.filter(([name]) => !name.startsWith('before:')).flatMap(([, file]) => helperNames(file)));
  const result = { processed: [], errors: {}, findings: [], translatedData: {}, helpers: [...helpers].sort(), plurals: [] };
  for (const [name, sourceFile] of parsed) {
    const diagnostics = sourceFile.parseDiagnostics ?? [];
    if (diagnostics.length) result.errors[name] = diagnostics.slice(0, 3).map((item) =>
      `line ${sourceFile.getLineAndCharacterOfPosition(item.start).line + 1}: ${ts.flattenDiagnosticMessageText(item.messageText, ' ')}`);
    walkFile(name, sourceFile, request, helpers, result.findings, name.startsWith('before:') ? [] : result.plurals);
    const list = pathOf(name) === request.languageFile ? translatedData(sourceFile) : null;
    if (list) result.translatedData[name] = list;
    result.processed.push(name);
  }
  return result;
}

const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    process.stdout.write(Buffer.from(JSON.stringify(run(JSON.parse(Buffer.concat(chunks).toString('utf8')))), 'utf8'));
  } catch (error) {
    process.stderr.write(`language_nets.mjs failed: ${error.stack ?? error}\n`);
    process.exitCode = 3;
  }
});
