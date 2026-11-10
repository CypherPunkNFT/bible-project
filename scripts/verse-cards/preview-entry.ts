// The link-preview script's small page (scripts/verse-cards/previews.mjs): the site's own lettering and the cards'
// own drawing code, bundled by Bun.build into a temporary folder, never into dist/ or public/. The script asks it for
// each card as a PNG at the wide size (1200 × 630); nothing here is part of the site.
import "@fontsource-variable/archivo";
import "@fontsource-variable/literata/opsz.css";
import { cardFontsReady, renderCard } from "../../src/lib/verse-card/render.ts";
import { resolveCard, type CardSpec } from "../../src/lib/verse-card/spec.ts";

export type PreviewResult = { png: string } | { error: string };

declare global {
  interface Window { makePreview: (spec: CardSpec) => Promise<PreviewResult> }
}

const base64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let start = 0; start < bytes.length; start += 0x8000) binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  return btoa(binary);
};

window.makePreview = async (spec) => {
  try {
    if (!(await cardFontsReady(resolveCard(spec)))) return { error: "the lettering did not load within 3 seconds" };
    const picture = await renderCard(spec, "wide");
    return { png: base64(new Uint8Array(await picture.blob.arrayBuffer())) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};
