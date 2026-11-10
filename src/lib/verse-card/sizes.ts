// The four picture sizes (design 2.2, 4.3), each with the area the words stay inside and its verse letter sizes. The
// smallest sizes keep the words readable on a phone (about 12 points); a card that does not fit at its smallest size
// says so rather than shrinking further or cutting the verse. Adding a size is one row here and one button.

export type SizeId = "square" | "portrait" | "story" | "wide";

export interface CardSize {
  id: SizeId;
  /** The button's name, by use. */
  label: string;
  width: number;
  height: number;
  /** Where the words stay: clear of the Instagram grid's crop and the story apps' bars. */
  safe: { x: number; y: number; w: number; h: number };
  /** The verse's starting letter size and the smallest it may shrink to, in picture pixels. */
  start: number;
  min: number;
}

export const SIZES: Readonly<Record<SizeId, CardSize>> = {
  square: { id: "square", label: "Square · chats and feeds", width: 1080, height: 1080, safe: { x: 96, y: 96, w: 888, h: 888 }, start: 64, min: 34 },
  portrait: { id: "portrait", label: "Portrait · Instagram", width: 1080, height: 1350, safe: { x: 130, y: 110, w: 820, h: 1130 }, start: 66, min: 34 },
  story: { id: "story", label: "Story · stories and phone backgrounds", width: 1080, height: 1920, safe: { x: 96, y: 260, w: 888, h: 1300 }, start: 72, min: 36 },
  wide: { id: "wide", label: "Wide · X, Facebook, email", width: 1200, height: 630, safe: { x: 80, y: 56, w: 1040, h: 518 }, start: 52, min: 36 },
};

export const SIZE_IDS = Object.keys(SIZES) as SizeId[];

export const isSizeId = (value: unknown): value is SizeId => typeof value === "string" && (SIZE_IDS as string[]).includes(value);
