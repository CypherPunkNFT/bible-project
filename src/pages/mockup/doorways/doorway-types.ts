// MOCK-UP: one drawing on the doorway design sheet (/doorways_mockup). Each row's file lists five of these, in column order.
import type { ReactElement } from "react";

export interface DoorwayVariant {
  /** A few words naming the drawing, shown under its card on the sheet. */
  name: string;
  /** The drawing itself: an <svg viewBox="0 0 320 180"> in currentColor line art. */
  Art: () => ReactElement;
}
