// Framing the answer on the map: the box around every pin and site, and padding that never swallows the map.
import { LngLatBounds, type PaddingOptions } from "maplibre-gl";
import { linesOf } from "./area";
import type { RevealShape } from "./quest-style";

/** Padding no larger than 60 percent of the map in either direction, so MapLibre can always frame the answer. */
export function clampPadding(padding: Partial<PaddingOptions>, width: number, height: number): Required<PaddingOptions> {
  const pad = { top: padding.top ?? 0, right: padding.right ?? 0, bottom: padding.bottom ?? 0, left: padding.left ?? 0 };
  const across = Math.max(0, pad.left + pad.right);
  const down = Math.max(0, pad.top + pad.bottom);
  const scaleAcross = across > width * 0.6 ? (width * 0.6) / across : 1;
  const scaleDown = down > height * 0.6 ? (height * 0.6) / down : 1;
  return { top: Math.floor(pad.top * scaleDown), bottom: Math.floor(pad.bottom * scaleDown), left: Math.floor(pad.left * scaleAcross), right: Math.floor(pad.right * scaleAcross) };
}

/** The box around every pin and scored site of the shapes given, and every river or region drawn. */
export function boundsOf(shapes: readonly RevealShape[]): LngLatBounds | null {
  if (!shapes.length) return null;
  const bounds = new LngLatBounds([...shapes[0].pin], [...shapes[0].pin]);
  for (const shape of shapes) { bounds.extend([...shape.pin]); bounds.extend([...shape.scored]); for (const at of shape.others) bounds.extend([...at]);
    if (shape.area) for (const line of linesOf(shape.area)) for (const at of line) bounds.extend([at[0], at[1]]);
  }
  return bounds;
}

