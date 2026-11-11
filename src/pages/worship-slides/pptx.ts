// The PowerPoint file, written in the browser with no library: the smallest set of Office Open XML parts PowerPoint,
// Keynote, Google Slides and LibreOffice open without a repair prompt (content types, package and part relationships,
// presentation, one master, one blank layout, a theme, the slides, and the document properties), zipped by zip.ts.
// Every slide's words are real text boxes, so a worship team can still edit them; the places come from the same layout
// as the pictures (layout.ts). The typefaces named are ones every computer has (templates.ts, `office`).
import type { SlideLayout } from "./layout";
import type { Slide } from "./slides";
import { EMU_PER_PX, type FontChoice, type SHAPES, type Theme } from "./templates";
import { makeZip, type ZipEntry } from "./zip";

type Shape = (typeof SHAPES)[number];

const NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_P = "http://schemas.openxmlformats.org/presentationml/2006/main";
const NAMESPACES = `xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}"`;
const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const TYPE = "application/vnd.openxmlformats-officedocument";

export const PPTX_TYPE = `${TYPE}.presentationml.presentation`;

// Characters XML 1.0 does not allow, and halves of a surrogate pair with no partner.
// eslint-disable-next-line no-control-regex
const NOT_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

/** Text made safe for an XML document: escaped, and with characters XML forbids removed. */
export const xmlText = (text: string) => text.replace(NOT_XML, "").replace(/[&<>"']/g, (c) => ENTITIES[c]);

const emu = (px: number) => Math.round(px * EMU_PER_PX);
/** Slide pixels to hundredths of a point (1 px is half a point), a little smaller than the pictures: the typefaces in
 *  the file run slightly wider than the site's, and PowerPoint shrinks to fit from there (normAutofit). */
const points = (px: number) => Math.max(100, Math.min(400000, Math.round(px * 50 * 0.92)));

const relationships = (items: readonly [string, string, string][]) =>
  `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items.map(([id, type, target]) => `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`).join("")}</Relationships>`;

const groupProperties = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';

const place = (x: number, y: number, w: number, h: number) =>
  `<a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${Math.max(1, emu(w))}" cy="${Math.max(1, emu(h))}"/></a:xfrm>`;

const color = (hex: string, alpha?: number) =>
  `<a:solidFill><a:srgbClr val="${hex}">${alpha === undefined ? "" : `<a:alpha val="${Math.round(alpha * 100000)}"/>`}</a:srgbClr></a:solidFill>`;

function rectangle(id: number, name: string, box: { x: number; y: number; w: number; h: number }, hex: string, alpha?: number): string {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${place(box.x, box.y, box.w, box.h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${color(hex, alpha)}<a:ln><a:noFill/></a:ln></p:spPr></p:sp>`;
}

interface Run { text: string; size: number; hex: string; bold: boolean; superscript?: boolean }

function run(font: FontChoice, item: Run): string {
  const flags = `b="${item.bold ? 1 : 0}" i="${font.office.italic ? 1 : 0}"${item.superscript ? ' baseline="30000"' : ""}`;
  return `<a:r><a:rPr lang="en-US" sz="${points(item.size)}" ${flags} dirty="0">${color(item.hex)}<a:latin typeface="${font.office.family}"/><a:cs typeface="${font.office.family}"/></a:rPr><a:t>${xmlText(item.text)}</a:t></a:r>`;
}

function textBox(id: number, name: string, box: { x: number; y: number; w: number; h: number }, align: "center" | "left", anchor: "ctr" | "t", runs: string, endSize: number): string {
  const body = `<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="${anchor}"><a:normAutofit/></a:bodyPr><a:lstStyle/>`;
  const paragraph = `<a:p><a:pPr algn="${align === "center" ? "ctr" : "l"}"><a:lnSpc><a:spcPct val="110000"/></a:lnSpc></a:pPr>${runs}<a:endParaRPr lang="en-US" sz="${points(endSize)}" dirty="0"/></a:p>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${place(box.x, box.y, box.w, box.h)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody>${body}${paragraph}</p:txBody></p:sp>`;
}

function background(theme: Theme): string {
  const fill = theme.fill.kind === "gradient"
    ? `<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:srgbClr val="${theme.fill.from}"/></a:gs><a:gs pos="100000"><a:srgbClr val="${theme.fill.to}"/></a:gs></a:gsLst><a:lin ang="2700000" scaled="0"/></a:gradFill>`
    : color(theme.fill.kind === "solid" ? theme.fill.color : theme.officeFill);
  return `<p:bg><p:bgPr>${fill}<a:effectLst/></p:bgPr></p:bg>`;
}

export interface DeckSettings { theme: Theme; font: FontChoice; shape: Shape; numbers: boolean; title: string }

/** One slide's XML. */
export function slideXml(slide: Slide, layout: SlideLayout, settings: DeckSettings): string {
  const { theme, font, shape, numbers } = settings;
  const shapes: string[] = [];
  let id = 2;
  if (layout.band) shapes.push(rectangle(id++, "Band", layout.band, theme.band.color, theme.band.alpha));
  if (layout.rule) shapes.push(rectangle(id++, "Line", layout.rule, theme.accent));
  const bold = font.office.bold;
  let runs: string;
  if (slide.kind === "title") runs = run(font, { text: slide.heading, size: layout.size, hex: theme.text, bold });
  else {
    runs = slide.pieces.map((piece, i) => {
      const before = i > 0 ? " " : "";
      if (numbers && piece.mark) {
        return run(font, { text: `${before}${piece.mark}\u00A0`, size: layout.size, hex: theme.accent, bold: true, superscript: true }) + run(font, { text: piece.text, size: layout.size, hex: theme.text, bold });
      }
      return run(font, { text: `${before}${piece.text}`, size: layout.size, hex: theme.text, bold });
    }).join("");
  }
  shapes.push(textBox(id++, slide.kind === "title" ? "Title" : "Verse", layout.box, layout.align, "ctr", runs, layout.size));
  if (layout.note) {
    const { note } = layout;
    const left = layout.align === "center" ? layout.box.x : note.x;
    const box = { x: left, y: note.y - note.size * 1.1, w: layout.align === "center" ? layout.box.w : shape.width - left - layout.box.x, h: note.size * 1.6 };
    shapes.push(textBox(id++, "Reference", box, layout.align, "t", run(font, { text: note.text, size: note.size, hex: theme.accent, bold: false }), note.size));
  }
  return `${HEAD}<p:sld ${NAMESPACES}><p:cSld>${background(theme)}<p:spTree>${groupProperties}${shapes.join("")}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

const scheme = (name: string, hex: string) => `<a:${name}><a:srgbClr val="${hex}"/></a:${name}>`;
const fonts = (family: string) => `<a:latin typeface="${family}"/><a:ea typeface=""/><a:cs typeface=""/>`;
const three = (part: string) => part + part + part;

const THEME_XML = `${HEAD}<a:theme xmlns:a="${NS_A}" name="Bible Guide"><a:themeElements><a:clrScheme name="Bible Guide">${
  scheme("dk1", "000000") + scheme("lt1", "FFFFFF") + scheme("dk2", "1B2340") + scheme("lt2", "F6F1E7") + scheme("accent1", "8A6A35") + scheme("accent2", "1F3A2E") + scheme("accent3", "35264A") + scheme("accent4", "C0704A") + scheme("accent5", "D9C48F") + scheme("accent6", "CBD6A0") + scheme("hlink", "1F4E9A") + scheme("folHlink", "6A3D9A")
}</a:clrScheme><a:fontScheme name="Bible Guide"><a:majorFont>${fonts("Georgia")}</a:majorFont><a:minorFont>${fonts("Arial")}</a:minorFont></a:fontScheme><a:fmtScheme name="Bible Guide"><a:fillStyleLst>${
  three('<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>')
}</a:fillStyleLst><a:lnStyleLst>${three('<a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>')}</a:lnStyleLst><a:effectStyleLst>${
  three("<a:effectStyle><a:effectLst/></a:effectStyle>")
}</a:effectStyleLst><a:bgFillStyleLst>${three('<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>')}</a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;

const MASTER_XML = `${HEAD}<p:sldMaster ${NAMESPACES}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${groupProperties}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="4400"/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="2800"/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>`;

const LAYOUT_XML = `${HEAD}<p:sldLayout ${NAMESPACES} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${groupProperties}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

/** Every part of the deck, [Content_Types].xml first. `when` stamps the document properties. */
export function deckEntries(slides: readonly Slide[], layouts: readonly SlideLayout[], settings: DeckSettings, when = new Date()): ZipEntry[] {
  if (slides.length !== layouts.length || !slides.length) throw new Error(`worship slides: ${slides.length} slides but ${layouts.length} layouts`);
  const encoder = new TextEncoder();
  const entry = (name: string, xml: string): ZipEntry => ({ name, data: encoder.encode(xml) });
  const { shape } = settings;
  const numbers = slides.map((_, i) => i + 1);
  const stamp = `${when.toISOString().slice(0, 19)}Z`;

  const types = `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${[
    ["/ppt/presentation.xml", `${TYPE}.presentationml.presentation.main+xml`],
    ["/ppt/slideMasters/slideMaster1.xml", `${TYPE}.presentationml.slideMaster+xml`],
    ["/ppt/slideLayouts/slideLayout1.xml", `${TYPE}.presentationml.slideLayout+xml`],
    ...numbers.map((n) => [`/ppt/slides/slide${n}.xml`, `${TYPE}.presentationml.slide+xml`]),
    ["/ppt/theme/theme1.xml", `${TYPE}.theme+xml`],
    ["/ppt/presProps.xml", `${TYPE}.presentationml.presProps+xml`],
    ["/ppt/viewProps.xml", `${TYPE}.presentationml.viewProps+xml`],
    ["/ppt/tableStyles.xml", `${TYPE}.presentationml.tableStyles+xml`],
    ["/docProps/core.xml", "application/vnd.openxmlformats-package.core-properties+xml"],
    ["/docProps/app.xml", `${TYPE}.extended-properties+xml`],
  ].map(([part, type]) => `<Override PartName="${part}" ContentType="${type}"/>`).join("")}</Types>`;

  const presentation = `${HEAD}<p:presentation ${NAMESPACES} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${
    numbers.map((n) => `<p:sldId id="${255 + n}" r:id="rId${n + 2}"/>`).join("")
  }</p:sldIdLst><p:sldSz cx="${shape.emuWidth}" cy="${shape.emuHeight}"${shape.id === "standard" ? ' type="screen4x3"' : ""}/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
  const last = slides.length + 2;

  return [
    entry("[Content_Types].xml", types),
    entry("_rels/.rels", relationships([
      ["rId1", `${REL}/officeDocument`, "ppt/presentation.xml"],
      ["rId2", "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", "docProps/core.xml"],
      ["rId3", `${REL}/extended-properties`, "docProps/app.xml"],
    ])),
    entry("docProps/core.xml", `${HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlText(settings.title)}</dc:title><dc:creator>Bible Guide</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${stamp}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${stamp}</dcterms:modified></cp:coreProperties>`),
    entry("docProps/app.xml", `${HEAD}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Bible Guide</Application><Slides>${slides.length}</Slides></Properties>`),
    entry("ppt/presentation.xml", presentation),
    entry("ppt/_rels/presentation.xml.rels", relationships([
      ["rId1", `${REL}/slideMaster`, "slideMasters/slideMaster1.xml"],
      ["rId2", `${REL}/theme`, "theme/theme1.xml"],
      ...numbers.map((n): [string, string, string] => [`rId${n + 2}`, `${REL}/slide`, `slides/slide${n}.xml`]),
      [`rId${last + 1}`, `${REL}/presProps`, "presProps.xml"],
      [`rId${last + 2}`, `${REL}/viewProps`, "viewProps.xml"],
      [`rId${last + 3}`, `${REL}/tableStyles`, "tableStyles.xml"],
    ])),
    entry("ppt/presProps.xml", `${HEAD}<p:presentationPr ${NAMESPACES}/>`),
    entry("ppt/viewProps.xml", `${HEAD}<p:viewPr ${NAMESPACES}/>`),
    entry("ppt/tableStyles.xml", `${HEAD}<a:tblStyleLst xmlns:a="${NS_A}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`),
    entry("ppt/theme/theme1.xml", THEME_XML),
    entry("ppt/slideMasters/slideMaster1.xml", MASTER_XML),
    entry("ppt/slideMasters/_rels/slideMaster1.xml.rels", relationships([
      ["rId1", `${REL}/slideLayout`, "../slideLayouts/slideLayout1.xml"],
      ["rId2", `${REL}/theme`, "../theme/theme1.xml"],
    ])),
    entry("ppt/slideLayouts/slideLayout1.xml", LAYOUT_XML),
    entry("ppt/slideLayouts/_rels/slideLayout1.xml.rels", relationships([["rId1", `${REL}/slideMaster`, "../slideMasters/slideMaster1.xml"]])),
    ...numbers.flatMap((n) => [
      entry(`ppt/slides/slide${n}.xml`, slideXml(slides[n - 1], layouts[n - 1], settings)),
      entry(`ppt/slides/_rels/slide${n}.xml.rels`, relationships([["rId1", `${REL}/slideLayout`, "../slideLayouts/slideLayout1.xml"]])),
    ]),
  ];
}

/** The deck as zip pieces, ready for `new Blob(pieces, { type: PPTX_TYPE })`. */
export const makeDeck = (slides: readonly Slide[], layouts: readonly SlideLayout[], settings: DeckSettings, when = new Date()) =>
  makeZip(deckEntries(slides, layouts, settings, when), when);
