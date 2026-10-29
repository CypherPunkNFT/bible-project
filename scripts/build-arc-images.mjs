// The whole-Bible cross-reference arcs as pictures, so Connections in Scripture shows them at once instead of drawing
// ~140,000 strokes in the browser (~0.85 s on a desktop, ~5 s on a slow phone). Drawn by the chart's own code
// (src/components/charts/arc-paint.ts) in headless Chromium, for the dark and light section colours of src/index.css
// and at a desktop and a phone width, into public/images/arcs/ with a manifest of what each was drawn from. The page
// uses a picture only when its data and colours still match, and otherwise draws live, so a stale picture is never shown.
// Each picture is drawn on the theme's page colour: without transparency it is about a fifth of the size (280 KB, not
// 1.3 MB, at desktop width), so it suits only a chart that sits on the page itself.
// Run after the cross-reference data or the section colours change:
//   node scripts/build-arc-images.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(SITE, "public", "images", "arcs");
const SECTIONS = ["history", "poetry", "prophets", "gospels", "epistles", "revelation", "apocrypha"];
// Chart widths in CSS pixels, from a 360px phone (328) to the widest page (1424 from 1920px up). The page takes the
// nearest, so a picture is never stretched more than ~10%: stretching changes how densely the arcs overlap.
const WIDTHS = [340, 400, 560, 720, 880, 1040, 1232, 1424];
// Device pixels per CSS pixel, as the chart draws (devicePixelRatio, at most 2). The faint arcs add up differently at each,
// so a picture matches only at its own: 2 for phones and sharp screens, 1 for ordinary monitors (any window width).
const RATIOS = [1, 2];
const QUALITY = 0.85; // 0.75 visibly softens the finest arcs; 0.85 matches the drawn chart

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(SITE, file), "utf8"));

/** The section and page colours of one theme block of src/index.css (`:root {` light, `:root[data-theme="dark"] {` dark). */
function themeColors(css, opener) {
  const start = css.indexOf(opener);
  if (start < 0) throw Error(`src/index.css: no "${opener}" block`);
  const block = css.slice(start, css.indexOf("\n}", start));
  const token = (id) => {
    const match = new RegExp(`--${id}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`).exec(block);
    if (!match) throw Error(`src/index.css "${opener}": --${id} is not a plain hex colour`);
    return match[1];
  };
  return { background: token("page"), colors: Object.fromEntries(SECTIONS.map((id) => [id, token(id)])) };
}

const css = fs.readFileSync(path.join(SITE, "src", "index.css"), "utf8");
const themes = { dark: themeColors(css, ':root[data-theme="dark"] {'), light: themeColors(css, ":root {") };
const data = readJson("data/xref-arcs.json");
const section = new Map(readJson("data/catalog.json").books.map((book) => [book.code, book.section]));
const bookOf = data.chapters.map((label) => label.split(" ")[0]);
// As ArcDiagram prepares it: weakest first, so the strong arcs land on top.
const scene = { arcs: [...data.arcs].sort((a, b) => a[2] - b[2]), bookOf, sections: bookOf.map((code) => section.get(code) ?? "apocrypha") };
const references = data.arcs.reduce((sum, arc) => sum + arc[2], 0);

const bundle = await build({ entryPoints: [path.join(SITE, "src", "components", "charts", "arc-paint.ts")], bundle: true, write: false, format: "iife", globalName: "ArcPaint", target: "es2020" });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  fs.mkdirSync(OUT, { recursive: true });
  const images = [];
  for (const [theme, { background, colors }] of Object.entries(themes)) for (const ratio of RATIOS) for (const width of WIDTHS) {
    const { url, base } = await page.evaluate(({ scene, width, background, colors, ratio, quality }) => {
      const { arcHeight, arcBase, arcPainter } = window.ArcPaint;
      const height = arcHeight(width);
      const base = arcBase(height);
      const layer = (fill) => {
        const canvas = document.createElement("canvas");
        canvas.width = width * ratio;
        canvas.height = Math.ceil((base + 1) * ratio); // the arcs only: down to just below their baseline, no chapter bar
        const paint = canvas.getContext("2d");
        if (fill) { paint.fillStyle = fill; paint.fillRect(0, 0, canvas.width, canvas.height); }
        return { canvas, paint };
      };
      // As the page does it: the faint arcs on a transparent layer, then that layer over the page colour. Drawing them
      // straight onto the colour rounds differently over ~140,000 strokes and comes out visibly more saturated.
      const arcs = layer();
      arcs.paint.setTransform(ratio, 0, 0, ratio, 0, 0);
      const painter = arcPainter(arcs.paint, scene, { width, height, colors, active: "" });
      for (const arc of scene.arcs) painter.arc(arc);
      const picture = layer(background);
      picture.paint.drawImage(arcs.canvas, 0, 0);
      return { url: picture.canvas.toDataURL("image/webp", quality), base };
    }, { scene, width, background, colors, ratio, quality: QUALITY });
    if (!url.startsWith("data:image/webp")) throw Error(`Chromium did not encode WebP for ${theme} ${width}`);
    const file = `whole-bible-${theme}-${width}@${ratio}x.webp`;
    fs.writeFileSync(path.join(OUT, file), Buffer.from(url.split(",")[1], "base64"));
    images.push({ file, width, ratio, base, background, colors });
    console.log(`${file}: ${Math.round(fs.statSync(path.join(OUT, file)).size / 1024)} KB`);
  }
  const manifest = { chapters: data.chapters.length, arcs: data.arcs.length, references, images };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`manifest: ${images.length} pictures of ${data.arcs.length} arcs (${references} references)`);
} finally {
  await browser.close();
}
