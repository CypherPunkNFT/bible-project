// Memory card match: the colour each pair wears. The site's seven book colours, one per pair in turn; colour decorates,
// the stamp, the shelf and the words carry the meaning (design 11).
export const TONES = ["history", "poetry", "prophets", "gospels", "acts", "epistles", "revelation"] as const;
export const toneColor = (tone: number) => `var(--${TONES[tone % TONES.length]})`;
