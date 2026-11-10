// A card drawn at screen size (design 3.4): the same layout and drawing as the full picture, at 0.6 of its pixels. A
// screen reader hears what is on the picture through its label. Until the lettering has loaded it says so, rather than
// drawing in a fallback font.
import { useEffect, useMemo, useRef } from "react";
import { canvasMeasure } from "@/lib/verse-card/canvas";
import { drawCard } from "@/lib/verse-card/draw";
import { layoutResolved } from "@/lib/verse-card/layout";
import { SIZES, type SizeId } from "@/lib/verse-card/sizes";
import { resolveCard, type CardSpec } from "@/lib/verse-card/spec";
import { useCardFonts } from "@/lib/verse-card/use-card-picture";

const PREVIEW_SCALE = 0.6;

export function CardCanvas({ spec, size, className }: { spec: CardSpec; size: SizeId; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const loads = useCardFonts(spec);
  const card = useMemo(() => { try { return resolveCard(spec, () => {}); } catch { return null; } }, [spec]);
  const { width, height } = SIZES[size];
  useEffect(() => {
    const element = canvas.current;
    if (!element || !card || loads === 0) return;
    element.width = Math.round(width * PREVIEW_SCALE);
    element.height = Math.round(height * PREVIEW_SCALE);
    const context = element.getContext("2d");
    if (!context) return;
    drawCard(context, layoutResolved(card, SIZES[size], canvasMeasure(context)), card.look, PREVIEW_SCALE);
  }, [card, size, width, height, loads]);
  useEffect(() => () => { const element = canvas.current; if (element) { element.width = 0; element.height = 0; } }, []);
  const label = card ? [card.heading, card.text, card.reference, ...card.lines].filter(Boolean).join(" ") : "";
  return (
    <div className={`vc-canvas ${className ?? ""}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <canvas ref={canvas} role="img" aria-label={label} hidden={loads === 0} />
      {loads === 0 && <p className="vc-wait">Loading the lettering…</p>}
    </div>
  );
}
