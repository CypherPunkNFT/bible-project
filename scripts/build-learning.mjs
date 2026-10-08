// Builds the learning materials: each workbook source in content/learning/<id>.json becomes a print-quality PDF in
// A4 and US Letter (public/learning/<id>-a4.pdf, <id>-letter.pdf), a cover picture (public/learning/<id>.png), and a
// row in src/data/resources/learning.json. Local and free: an HTML print template rendered by Playwright's page.pdf()
// in Edge. The text block is the same size on both papers, so both editions have the same page numbers. Every page of
// the A4 edition is also saved as a JPEG about 1000 px wide (public/learning/<id>/pages/pNN.jpg) for the site's page
// viewer, and the row records them with the workbook's outline (parts, sessions and the page each one opens on).
//   node scripts/build-learning.mjs          -> every workbook
//   node scripts/build-learning.mjs <id>     -> one workbook
// It runs scripts/check-learning.mjs first and stops if the check fails. How to add a workbook:
// Research/Resources/LEARNING.md.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { CONTENT, SITE, checkWorkbook, codesIn, formatRef, loadCatalog, loadKjv, loadWorkbooks, refVerses } from "./check-learning.mjs";

const OUT = path.join(SITE, "public", "learning");
const INDEX = path.join(SITE, "src", "data", "resources", "learning.json");
const PAPER = { a4: { w: 210, h: 297, name: "A4" }, letter: { w: 215.9, h: 279.4, name: "US Letter" } };
const BOX = { w: 146, h: 226 }; // the text block in mm; fits inside both papers with generous margins
const LINES = { observe: 3, interpret: 4, reflect: 5 }; // ruled lines under each question, by kind
const KIND = { observe: "Observe", interpret: "Interpret", reflect: "Reflect" };
const PART_NAMES = { 1: "Part one", 2: "Part two", 3: "Part three" };
const SHOT_WIDTH = 1000; // px: the page images for the site's page viewer
const SHOT_QUALITY = 80; // JPEG quality: text stays crisp at a small size

const font = (pkg, file) => readFileSync(path.join(SITE, "node_modules", "@fontsource-variable", pkg, "files", file)).toString("base64");
const art = (name) => readFileSync(path.join(CONTENT, "art", `${name}.svg`), "utf8").trim();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Our prose to HTML: escaped; "quotes" and apostrophes made typographic; **bold** and *italic*. */
function prose(text) {
  return esc(text)
    .replace(/"([^"]+)"/g, "“$1”").replace(/'/g, "’")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/(\d)-(\d)/g, "$1–$2");
}
const scripture = (text) => esc(text.replace(/¶\s*/g, "").replace(/'/g, "’"));

function fontFaces() {
  const lit = font("literata", "literata-latin-opsz-normal.woff2");
  const litI = font("literata", "literata-latin-opsz-italic.woff2");
  const arc = font("archivo", "archivo-latin-wght-normal.woff2");
  return `
@font-face { font-family: "Literata"; src: url(data:font/woff2;base64,${lit}) format("woff2"); font-weight: 200 900; font-style: normal; }
@font-face { font-family: "Literata"; src: url(data:font/woff2;base64,${litI}) format("woff2"); font-weight: 200 900; font-style: italic; }
@font-face { font-family: "Archivo"; src: url(data:font/woff2;base64,${arc}) format("woff2"); font-weight: 100 900; font-style: normal; }`;
}

function css(paper) {
  return `${fontFaces()}
@page { size: ${paper.w}mm ${paper.h}mm; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #000; }
body { font: 10.4pt/1.52 "Literata", Georgia, serif; font-variation-settings: "opsz" 12; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: ${paper.w}mm; height: ${paper.h}mm; display: flex; align-items: center; justify-content: center; break-after: page; overflow: hidden; position: relative; }
.page:last-child { break-after: auto; }
.box { width: ${BOX.w}mm; height: ${BOX.h}mm; display: flex; flex-direction: column; }
.run { height: 9mm; display: flex; justify-content: space-between; align-items: flex-start; font: 600 6.6pt/1 "Archivo", sans-serif; letter-spacing: .16em; text-transform: uppercase; color: #555; }
.body { flex: 1; overflow: hidden; display: flow-root; }
.folio { height: 9mm; display: flex; align-items: flex-end; justify-content: center; font: 500 7.6pt/1 "Archivo", sans-serif; letter-spacing: .08em; color: #333; }
.opener .run, .bare .run, .bare .folio { visibility: hidden; }
.sans { font-family: "Archivo", sans-serif; }
.label { font: 600 7pt/1.3 "Archivo", sans-serif; letter-spacing: .18em; text-transform: uppercase; }
.refs { font: 400 7.6pt/1.45 "Archivo", sans-serif; letter-spacing: .02em; color: #444; margin-top: 1.2mm; }
h2 { font-weight: 500; font-variation-settings: "opsz" 48; font-size: 19pt; line-height: 1.15; margin: 0 0 5mm; letter-spacing: -.005em; }
h3 { margin: 0 0 3mm; padding-bottom: 1.6mm; border-bottom: .4pt solid #000; }
p { margin: 0 0 3.4mm; }
.block { padding-bottom: .2mm; }
.para { margin-bottom: 4.2mm; } .para p { margin: 0; }
/* cover */
.cover .box { justify-content: space-between; text-align: center; }
.cover .kicker { margin-top: 8mm; }
.cover h1 { font-weight: 400; font-variation-settings: "opsz" 72; font-size: 56pt; line-height: 1; margin: 18mm 0 0; letter-spacing: -.01em; }
.cover .sub { font-style: italic; font-size: 22pt; line-height: 1.2; margin-top: 4mm; font-variation-settings: "opsz" 36; }
.cover .rule { width: 18mm; border-top: .5pt solid #000; margin: 9mm auto 0; }
.cover .tag { margin: 7mm auto 0; max-width: 100mm; font-size: 11pt; }
.cover .art { width: 128mm; margin: 0 auto; }
.cover .art svg { width: 100%; height: auto; display: block; }
.cover .foot { margin-bottom: 4mm; }
.cover .foot .label { color: #333; }
.cover .fine { font: 400 7.4pt/1.5 "Archivo", sans-serif; color: #555; margin-top: 2mm; letter-spacing: .02em; }
/* contents */
.toc { margin-top: 2mm; }
.toc .row { display: flex; align-items: baseline; gap: 2mm; padding: 2.2mm 0; border-bottom: .3pt solid #bbb; }
.toc .row .n { width: 9mm; font: 600 8pt/1 "Archivo", sans-serif; color: #444; }
.toc .row .t { flex: 1; } .toc .row .t small { display: block; font: 400 7.6pt/1.4 "Archivo", sans-serif; color: #555; margin-top: .6mm; }
.toc .row .p { font: 500 8.6pt/1 "Archivo", sans-serif; }
.toc .part { margin-top: 6mm; color: #333; }
/* sessions */
.opener-block { text-align: center; padding-top: 6mm; }
.opener-block .art { width: 58mm; margin: 0 auto 7mm; }
.opener-block .art svg { width: 100%; height: auto; display: block; }
.opener-block .num { font: 600 7.4pt/1 "Archivo", sans-serif; letter-spacing: .22em; text-transform: uppercase; margin-bottom: 3mm; }
.opener-block h2 { font-size: 27pt; margin: 0 0 3mm; }
.opener-block .part { color: #444; margin-bottom: 9mm; }
.readbox { border-top: .5pt solid #000; border-bottom: .5pt solid #000; padding: 3.4mm 0 3.6mm; margin: 0 14mm 9mm; }
.readbox .label { margin-bottom: 1.6mm; }
.readbox .what { font-size: 12.5pt; font-variation-settings: "opsz" 24; }
.key { margin: 0 0 4.6mm; padding-left: 5mm; border-left: .8pt solid #000; }
.key q { quotes: none; display: block; font-style: italic; font-size: 10.8pt; line-height: 1.5; }
.key .refs { margin-top: .8mm; color: #333; }
.qhead .note { font: 400 7.6pt/1.45 "Archivo", sans-serif; color: #444; margin: -1mm 0 4mm; }
.q { margin-bottom: 3.4mm; }
.q .top { display: flex; gap: 3mm; align-items: baseline; }
.q .qn { font: 600 9pt/1 "Archivo", sans-serif; min-width: 5mm; }
.q .kind { font: 600 6.2pt/1 "Archivo", sans-serif; letter-spacing: .16em; text-transform: uppercase; color: #555; margin-left: 2mm; white-space: nowrap; }
.q .refs { margin-left: 8mm; margin-top: .4mm; }
.q .text { flex: 1; }
.lines { margin-left: 8mm; }
.lines div { height: 8.6mm; border-bottom: .45pt solid #8c8c8c; }
.notes { margin-top: 2mm; } .notes .label { color: #444; } .notes .lines { margin-left: 0; }
/* intro, sources */
.timeline { margin: 3mm 0 7mm; } .timeline svg { width: 100%; height: auto; display: block; }
.src { margin-bottom: 4mm; } .src .refs { margin-top: .6mm; }
.site-page { display: flex; justify-content: space-between; align-items: baseline; gap: 4mm; padding: 1.6mm 0; border-bottom: .3pt solid #bbb; }
.site-page code { font: 400 8pt/1.4 "Archivo", sans-serif; color: #333; }
.small { font-size: 9pt; line-height: 1.5; }
#flow { position: absolute; left: -10000mm; top: 0; width: ${BOX.w}mm; }
`;
}

/** The cover drawing: the river, the bush and the mountain on one horizon, one for each forty. */
function coverArt() {
  const inner = (name) => art(name).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const at = (name, x) => `<g transform="translate(${x} 0)">${inner(name)}</g>`;
  const label = (x, text) => `<text x="${x}" y="98" text-anchor="middle" font-family="Archivo, sans-serif" font-size="6.4" letter-spacing="1.6" fill="#000" stroke="none">${text}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 104" fill="none" stroke="#000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
${at("water", 0)}${at("bush", 120)}${at("nebo", 240)}
<path d="M4 84 H356" stroke-width=".5"/>
${label(60, "FORTY")}${label(180, "FORTY")}${label(300, "FORTY")}</svg>`;
}

/** The three forties as a line: birth, flight, the bush, death, with the verses that give each age. */
function timeline() {
  const xs = [10, 120, 230, 340];
  const ticks = xs.map((x) => `<path d="M${x} 40 V50"/>`).join("");
  const age = ["0", "40", "80", "120"].map((a, i) => `<text x="${xs[i]}" y="34" text-anchor="middle" class="tl-a">${a}</text>`).join("");
  const under = [["Born", "Exodus 2:2"], ["Flees to Midian", "Acts 7:23"], ["The bush", "Acts 7:30 · Exodus 7:7"], ["Dies on Nebo", "Deuteronomy 34:7"]]
    .map(([t, r], i) => `<text x="${xs[i]}" y="62" text-anchor="${i === 0 ? "start" : i === 3 ? "end" : "middle"}" class="tl-t">${t}</text><text x="${xs[i]}" y="71" text-anchor="${i === 0 ? "start" : i === 3 ? "end" : "middle"}" class="tl-r">${r}</text>`).join("");
  const parts = [["Egypt", "Session 1"], ["Midian", "Session 2"], ["The wilderness", "Sessions 3–8"]]
    .map(([p, s], i) => `<text x="${(xs[i] + xs[i + 1]) / 2}" y="12" text-anchor="middle" class="tl-p">${p}</text><text x="${(xs[i] + xs[i + 1]) / 2}" y="21" text-anchor="middle" class="tl-r">${s}</text>`).join("");
  return `<svg class="tl" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 76" fill="none" stroke="#000" stroke-width=".8">
<style>.tl text{stroke:none;fill:#000;font-family:Archivo,sans-serif}.tl .tl-a{font-size:9px;font-weight:600}.tl .tl-t{font-size:7.4px}.tl .tl-r{font-size:6.2px;fill:#444}.tl .tl-p{font-family:Literata,serif;font-style:italic;font-size:10px}</style>
<path d="M10 45 H340"/>${ticks}${age}${under}${parts}</svg>`;
}

const refList = (refs, catalog) => refs.map((r) => formatRef(r, catalog)).join("; ");

/** Every verse the references cover, joined into the fewest unbroken runs, in Bible order: "Exodus 1:7–22; 2:1–25". */
function mergedRefs(refs, catalog) {
  const order = [...KJV.keys()];
  const ids = [...new Set(refs.flatMap((r) => refVerses(r, catalog, KJV)))].sort((a, b) => a - b);
  const runs = [];
  for (const id of ids) {
    const last = runs.at(-1);
    if (last && order[order.indexOf(last[1]) + 1] === id && Math.floor(id / 1e6) === Math.floor(last[1] / 1e6)) last[1] = id;
    else runs.push([id, id]);
  }
  const codes = new Map([...catalog.byCode.values()].map((b) => [b.num, b.code]));
  const cv = (id) => `${Math.floor((id % 1e6) / 1e3)}:${id % 1e3}`;
  return runs.map(([a, b]) => {
    const code = codes.get(Math.floor(a / 1e6));
    const ref = a === b ? `${code} ${cv(a)}` : Math.floor(a / 1e3) === Math.floor(b / 1e3) ? `${code} ${cv(a)}-${b % 1e3}` : `${code} ${cv(a)}-${cv(b)}`;
    return formatRef(ref, catalog);
  }).join("; ");
}

function sessionBlocks(book, s, catalog) {
  const part = book.parts.find((p) => p.part === s.part);
  const run = `Session ${s.number} · ${s.title}`;
  const blocks = [];
  blocks.push(`<div class="block opener-block" data-break="page" data-run="${esc(run)}" data-opener="1" data-toc="s${s.number}">
  <div class="art">${art(s.art)}</div>
  <div class="num">Session ${s.number}</div>
  <h2>${esc(s.title)}</h2>
  <div class="label part">${esc(part.label)} · ${esc(part.place)}</div>
  <div class="readbox"><div class="label">Read</div><div class="what">${esc(refList(s.read, catalog))}</div></div>
</div>`);
  s.summary.forEach((p, i) => {
    const head = i === 0 ? `<h3 class="label">In brief</h3>` : "";
    blocks.push(`<div class="block para">${head}<p>${prose(p.text)}</p><div class="refs">${esc(refList(p.refs, catalog))}</div></div>`);
  });
  s.keyVerses.forEach((k, i) => {
    const head = i === 0 ? `<h3 class="label">Key verses</h3>` : "";
    blocks.push(`<div class="block">${head}<div class="key"><q>${scripture(k.text)}</q><div class="refs">${esc(formatRef(k.ref, catalog))} · KJV</div></div></div>`);
  });
  s.questions.forEach((q, i) => {
    const head = i === 0 ? `<div class="qhead"><h3 class="label">Questions written by this site</h3><div class="note">Each answer is in the verses named under the question.</div></div>` : "";
    const lines = "<div></div>".repeat(LINES[q.kind]);
    const last = i === s.questions.length - 1 ? ` data-notes="1"` : "";
    const first = i === 0 ? ` data-toc="q${s.number}"` : ""; // the page where a session's questions start
    blocks.push(`<div class="block"${last}${first}>${head}<div class="q"><div class="top"><span class="qn">${i + 1}</span><span class="text">${prose(q.text)}<span class="kind">${KIND[q.kind]}</span></span></div><div class="refs">${esc(refList(q.refs, catalog))}</div><div class="lines">${lines}</div></div></div>`);
  });
  return blocks;
}

function frontBlocks(book, catalog) {
  const blocks = [];
  blocks.push(`<div class="block" data-break="page" data-run="How to use this workbook" data-toc="use"><h2>How to use this workbook</h2>${book.howToUse.map((p) => `<p>${prose(p)}</p>`).join("")}</div>`);
  blocks.push(`<div class="block" data-break="page" data-run="${esc(book.intro.title)}" data-toc="intro"><h2>${esc(book.intro.title)}</h2><div class="timeline">${timeline()}</div></div>`);
  for (const p of book.intro.paragraphs) blocks.push(`<div class="block para"><p>${prose(p.text)}</p><div class="refs">${esc(refList(p.refs, catalog))}</div></div>`);
  book.intro.keyVerses.forEach((k, i) => {
    blocks.push(`<div class="block">${i === 0 ? `<h3 class="label">In Stephen’s words</h3>` : ""}<div class="key"><q>${scripture(k.text)}</q><div class="refs">${esc(formatRef(k.ref, catalog))} · KJV</div></div></div>`);
  });
  return blocks;
}

function sourceBlocks(book, catalog) {
  const blocks = [`<div class="block" data-break="page" data-run="Sources" data-toc="sources"><h2>Sources</h2><p class="small">Scripture is quoted from the King James Version (1769 text), word for word as the site’s reader gives it. The summaries and questions were written by this site from the pages below and checked against the text on ${esc(book.checked)}: every reference exists, and every quotation matches the King James Version word for word.</p><h3 class="label">The passages</h3></div>`];
  for (const s of book.sessions) {
    const cited = [...s.summary.flatMap((p) => p.refs), ...s.keyVerses.map((k) => k.ref), ...s.questions.flatMap((q) => q.refs)];
    blocks.push(`<div class="block src"><div><strong>Session ${s.number}, ${esc(s.title)}.</strong> Read ${esc(refList(s.read, catalog))}.</div><div class="refs">Verses cited: ${esc(mergedRefs(cited, catalog))}</div></div>`);
  }
  const intro = [...book.intro.paragraphs.flatMap((p) => p.refs), ...book.intro.keyVerses.map((k) => k.ref)];
  blocks.push(`<div class="block src"><div><strong>${esc(book.intro.title)}.</strong></div><div class="refs">Verses cited: ${esc(mergedRefs(intro, catalog))}</div></div>`);
  blocks.push(`<div class="block"><h3 class="label" style="margin-top:4mm">The site’s pages it was drawn from</h3>${book.builtFrom.map((p) => `<div class="site-page"><span>${esc(p.title)}</span><code>${esc(p.path)}</code></div>`).join("")}<p class="small" style="margin-top:4mm">These pages give the full story with every verse, the places on the map, and the questions scholars have argued over, which this workbook leaves aside.</p></div>`);
  return blocks;
}

function contents(book) {
  const rows = [["use", "", "How to use this workbook", ""], ["intro", "", book.intro.title, "Acts 7"]];
  let html = rows.map(([id, n, t, sub]) => tocRow(id, n, t, sub)).join("");
  for (const part of book.parts) {
    html += `<div class="label part">${PART_NAMES[part.part]} · ${esc(part.label)} · ${esc(part.place)}</div>`;
    for (const s of book.sessions.filter((x) => x.part === part.part)) html += tocRow(`s${s.number}`, String(s.number), s.title, refList(s.read, CATALOG));
  }
  html += `<div style="height:4mm"></div>${tocRow("sources", "", "Sources", "")}`;
  return `<section class="page bare front"><div class="box"><div class="run"></div><div class="body"><h2>Contents</h2><div class="toc">${html}</div></div><div class="folio"></div></div></section>`;
}
const tocRow = (id, n, t, sub) => `<div class="row"><span class="n">${n}</span><span class="t">${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ""}</span><span class="p" data-toc-for="${id}"></span></div>`;

function cover(book) {
  return `<section class="page bare front cover"><div class="box"><div class="run"></div><div class="body" style="display:flex;flex-direction:column;justify-content:space-between">
<div><div class="label kicker">Learning materials · Workbook</div><h1>${esc(book.title)}</h1><div class="sub">${esc(book.subtitle)}</div><div class="rule"></div><div class="tag">${esc(book.tagline)}</div></div>
<div class="art">${coverArt()}</div>
<div class="foot"><div class="label">${book.sessions.length} sessions · King James Version</div><div class="fine">Bible Project · Questions written by this site · Checked against the text ${esc(book.checked)}</div></div>
</div><div class="folio"></div></div></section>`;
}

/** In the page: pour the blocks into pages of the fixed text block, then fill the contents with page numbers. */
function paginate(workbookTitle) {
  const mm = 96 / 25.4;
  const pages = document.getElementById("pages");
  const flow = [...document.querySelectorAll("#flow > .block")];
  let body = null, run = "";
  const newPage = (opener) => {
    const n = pages.children.length + 1;
    const page = document.createElement("section");
    page.className = `page${opener ? " opener" : ""}`;
    page.dataset.n = String(n);
    page.innerHTML = `<div class="box"><div class="run"><span></span><span></span></div><div class="body"></div><div class="folio">${n}</div></div>`;
    page.querySelector(".run span:first-child").textContent = workbookTitle;
    page.querySelector(".run span:last-child").textContent = run;
    pages.append(page);
    body = page.querySelector(".body");
  };
  const overflows = () => body.scrollHeight > body.clientHeight + 1;
  for (const block of flow) {
    if (block.dataset.run) run = block.dataset.run;
    if (!body || block.dataset.break === "page") newPage(Boolean(block.dataset.opener));
    body.append(block);
    if (overflows() && body.children.length > 1) { block.remove(); newPage(false); body.append(block); }
    if (overflows()) throw new Error(`a block is taller than a page: ${block.textContent.slice(0, 80)}`);
    if (block.dataset.notes) {
      const used = block.getBoundingClientRect().bottom - body.getBoundingClientRect().top;
      const free = body.clientHeight - used - 2;
      const count = Math.floor((free - 9 * mm) / (8.6 * mm));
      for (let lines = count; lines >= 3; lines--) {
        const notes = document.createElement("div");
        notes.className = "block notes";
        notes.innerHTML = `<div class="label">Notes</div><div class="lines">${"<div></div>".repeat(lines)}</div>`;
        body.append(notes);
        if (!overflows()) break;
        notes.remove();
      }
    }
  }
  const all = [...document.querySelectorAll(".page")];
  all.forEach((page, i) => { page.dataset.n = String(i + 1); });
  for (const cell of document.querySelectorAll("[data-toc-for]")) {
    const target = document.querySelector(`[data-toc="${cell.dataset.tocFor}"]`);
    cell.textContent = target?.closest(".page")?.dataset.n ?? "?";
  }
  const toc = Object.fromEntries([...document.querySelectorAll("#pages [data-toc]")].map((el) => [el.dataset.toc, Number(el.closest(".page").dataset.n)]));
  return { count: all.length, toc };
}

function html(book, paper) {
  const blocks = [...frontBlocks(book, CATALOG), ...book.sessions.flatMap((s) => sessionBlocks(book, s, CATALOG)), ...sourceBlocks(book, CATALOG)];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(book.title)}: ${esc(book.subtitle)}</title><style>${css(paper)}</style></head>
<body><div id="pages">${cover(book)}${contents(book)}</div><div id="flow">${blocks.join("\n")}</div></body></html>`;
}

let CATALOG, KJV;

async function build(browser, book) {
  const counts = {};
  let toc = {};
  for (const [key, paper] of Object.entries(PAPER)) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
    await page.setContent(html(book, paper), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const laid = await page.evaluate(paginate, `${book.title} · ${book.subtitle}`);
    counts[key] = laid.count;
    if (key === "a4") toc = laid.toc;
    await page.emulateMedia({ media: "print" });
    await page.pdf({ path: path.join(OUT, `${book.id}-${key}.pdf`), preferCSSPageSize: true, printBackground: true });
    if (key === "a4") {
      await page.emulateMedia({ media: "screen" });
      await page.locator(".cover").screenshot({ path: path.join(OUT, `${book.id}.png`) });
    }
    await page.close();
  }
  if (counts.a4 !== counts.letter) throw new Error(`${book.id}: A4 has ${counts.a4} pages but Letter has ${counts.letter}; they should match`);
  const images = await pageImages(browser, book);
  if (images.length !== counts.a4) throw new Error(`${book.id}: ${images.length} page images for ${counts.a4} pages; they should match`);
  return { pages: counts.a4, toc, images };
}

/** Every page of the A4 edition as a JPEG about SHOT_WIDTH px wide, in public/learning/<id>/pages/ (emptied first). */
async function pageImages(browser, book) {
  const dir = path.join(OUT, book.id, "pages");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const scale = SHOT_WIDTH / ((PAPER.a4.w * 96) / 25.4);
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: scale });
  try {
    await page.setContent(html(book, PAPER.a4), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(paginate, `${book.title} · ${book.subtitle}`);
    const files = [];
    for (const [i, sheet] of (await page.locator("#pages > .page").all()).entries()) {
      const name = `p${String(i + 1).padStart(2, "0")}.jpg`;
      await sheet.screenshot({ path: path.join(dir, name), type: "jpeg", quality: SHOT_QUALITY });
      files.push(`/learning/${book.id}/pages/${name}`);
    }
    return files;
  } finally {
    await page.close();
  }
}

/** Our prose as plain text for the site (no HTML): typographic quotes, apostrophes and dashes; emphasis marks dropped. */
const plain = (text) => text.replace(/"([^"]+)"/g, "\u201c$1\u201d").replace(/'/g, "\u2019").replace(/\*\*?([^*]+)\*\*?/g, "$1").replace(/(\d)-(\d)/g, "$1\u2013$2");

/** A drawing from content/learning/art as [tag, attributes] pairs, so the site draws it without raw markup. */
function artShapes(name) {
  return [...art(name).matchAll(/<(path|circle|ellipse|rect|line|polyline|polygon)\s([^>]*?)\/?>/g)].map(([, tag, attrs]) =>
    [tag, Object.fromEntries([...attrs.matchAll(/([a-z-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]))]);
}

/** What the site shows of a built workbook beyond its files: parts, sessions (with the pages each one spans) and counts. */
function outline(book, toc, pages) {
  const sessions = book.sessions.map((s, i) => {
    const next = i + 1 < book.sessions.length ? toc[`s${s.number + 1}`] : toc.sources;
    const count = (kind) => s.questions.filter((q) => q.kind === kind).length;
    return {
      n: s.number, part: s.part, art: s.art, title: s.title, read: refList(s.read, CATALOG),
      page: toc[`s${s.number}`], end: (next ?? pages + 1) - 1, questionsPage: toc[`q${s.number}`],
      brief: plain(s.summary[0].text), briefRefs: refList(s.summary[0].refs, CATALOG),
      key: { ref: formatRef(s.keyVerses[0].ref, CATALOG), text: s.keyVerses[0].text.replace(/¶\s*/g, "").replace(/'/g, "\u2019") },
      questions: { observe: count("observe"), interpret: count("interpret"), reflect: count("reflect") }, keyVerses: s.keyVerses.length,
    };
  });
  return {
    parts: book.parts.map((p) => ({ part: p.part, label: p.label, place: p.place, ref: formatRef(p.ref, CATALOG) })),
    sessions,
    intro: book.intro.title,
    pages: { contents: 2, use: toc.use, intro: toc.intro, sources: toc.sources },
    questions: book.sessions.reduce((n, s) => n + s.questions.length, 0),
    keyVerses: book.sessions.reduce((n, s) => n + s.keyVerses.length, 0) + book.intro.keyVerses.length,
    art: Object.fromEntries([...new Set(book.sessions.map((s) => s.art))].map((name) => [name, artShapes(name)])),
  };
}

async function main() {
  const only = process.argv[2];
  const books = loadWorkbooks(only);
  if (!books.length) throw new Error(`No workbooks in ${CONTENT}${only ? ` named ${only}.json` : ""}`);
  CATALOG = loadCatalog();
  KJV = loadKjv(CATALOG, new Set(books.flatMap(({ book }) => [...codesIn(book)])));
  const failures = books.flatMap(({ file, book }) => checkWorkbook(book, file, CATALOG, KJV));
  if (failures.length) { console.error(`check-learning found ${failures.length} problem(s); fix them first:\n  ${failures.join("\n  ")}`); process.exit(1); }
  mkdirSync(OUT, { recursive: true });
  mkdirSync(path.dirname(INDEX), { recursive: true });
  const previous = (() => { try { return JSON.parse(readFileSync(INDEX, "utf8")).items ?? []; } catch { return []; } })();
  const items = new Map(previous.map((item) => [item.id, item]));
  const browser = await chromium.launch({ channel: "msedge" });
  try {
    for (const { book } of books) {
      const { pages, toc, images } = await build(browser, book);
      items.set(book.id, {
        id: book.id, title: `${book.title}: ${book.subtitle.toLowerCase()}`, kind: book.kind, sessions: book.sessions.length, pages,
        summary: book.summary,
        pdf: { a4: `/learning/${book.id}-a4.pdf`, letter: `/learning/${book.id}-letter.pdf` },
        cover: `/learning/${book.id}.png`,
        builtFrom: book.builtFrom.map((p) => p.path), checked: book.checked,
        pageImages: images, outline: outline(book, toc, pages),
      });
      console.log(`${book.id}: ${pages} pages -> public/learning/${book.id}-a4.pdf, ${book.id}-letter.pdf, ${book.id}.png, ${images.length} page images in ${book.id}/pages/`);
    }
  } finally {
    await browser.close();
  }
  const known = new Set(readdirSync(CONTENT).filter((f) => f.endsWith(".json")).map((f) => path.basename(f, ".json")));
  const list = [...items.values()].filter((item) => known.has(item.id)).sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(INDEX, `${JSON.stringify({ items: list }, null, 2)}\n`);
  console.log(`src/data/resources/learning.json: ${list.length} item(s)`);
}

await main();
