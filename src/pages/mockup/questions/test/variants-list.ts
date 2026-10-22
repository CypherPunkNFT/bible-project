// The question section as it is now and three alternatives, shown one under another on the same questions so the
// owner can compare them (mock-up, 2026-10-22).
import type { ComponentType } from "react";
import { QuestionPanel } from "./QuestionPanel";
import { OrbitVariant, PillsVariant, TilesVariant, type VariantProps } from "./Variants";

export interface Variant { id: string; name: string; note: string; View: ComponentType<VariantProps> }
export const VARIANTS: Variant[] = [
  { id: "panel", name: "Lines and the wheel", note: "As it is now: the Try one panel, the options on ruled lines, the wheel beside it.", View: QuestionPanel },
  { id: "pills", name: "Floating pills", note: "The options float gently as rounded pills, two by two, like the “I knew it” buttons.", View: PillsVariant },
  { id: "orbit", name: "Around the wheel", note: "The wheel in the middle and the options on either side of it, each joined to it by a line.", View: OrbitVariant },
  { id: "tiles", name: "Tiles at dawn", note: "The options as tall tiles in a row; the sunrise behind them grows with every right answer.", View: TilesVariant },
];
