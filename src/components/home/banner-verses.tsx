// Approved homepage banner wording stays at its established Scripture-data boundary.
export type BannerVerseName = "isaiah" | "john" | "peter" | "galatians";

export const BANNER_VERSES: Record<BannerVerseName, string> = {
  isaiah: "The grass withers and the flowers fall, but the word of our God stands forever.",
  john: "You pore over the Scriptures… These are the very words that testify about Me.",
  peter: "Always be prepared to give a defense\nto everyone who asks you the reason\nfor the hope that is in you.",
  galatians: "Carry one another’s burdens,\nand in this way you will fulfill the law of Christ.",
};

export const BLESSING_VERSES: Record<"numbers" | "joshua", [string, string]> = {
  numbers: ["May the LORD bless you and keep you;", "may the LORD cause His face to shine upon you and be gracious to you."],
  joshua: ["Be strong and courageous. Do not be afraid; do not be discouraged,", "for the LORD your God is with you wherever you go."],
};

export const RING_VERSES: readonly string[] = [
  "the word of our God stands forever",
  "Open my eyes that I may see wondrous things",
  "my rock, my fortress, and my deliverer",
  "love your neighbor as yourself",
];
