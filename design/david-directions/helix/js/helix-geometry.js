// The helix's shape, shared by the 3D sculpture and the flat fallback. Height is David's years (0–70: "thirty
// years old when he began to reign, and he reigned forty years", 2 Samuel 5:4); one full turn is eight years.
// The gold strand is the account in 1 Samuel 16 – 1 Kings 2; the silver strand, half a turn away, is 1 Chronicles
// 11–29, which begins only with the anointing over all Israel.
export const H = 1.15;         // world units per year
export const R = 7.2;          // strand radius
export const TURN = 8;         // years per full turn
export const CRYSTAL_OUT = 1.4; // crystals hang this far outside their strand
export const TOP = 70 * H;
export const CAP_Y = TOP + 5.5;

export const theta = (year) => (year / TURN) * Math.PI * 2;
export const strandPhase = (strand) => (strand === "chr" ? Math.PI : 0);

// A point on a strand, as [x, y, z].
export function strandPoint(year, strand = "sk", radius = R) {
  const a = theta(year) + strandPhase(strand);
  return [radius * Math.cos(a), year * H, radius * Math.sin(a)];
}
export const crystalPoint = (c) => strandPoint(c.year, c.strand, R + CRYSTAL_OUT);

// The years Chronicles tells, as runs: it starts at the anointing over all Israel and is silent in the gaps.
export function chroniclesRuns(chr, end = 70) {
  const runs = [];
  let from = chr.start;
  for (const g of chr.gaps) { runs.push([from, g.from]); from = g.to; }
  runs.push([from, end]);
  return runs;
}

// Travel: page scroll progress 0..1 -> what the camera looks at. The first and last stretches show the whole
// sculpture; in between the camera rides up the years.
export const INTRO = 0.06, OUTRO = 0.94;
export function travel(s) {
  if (s <= INTRO) return { year: 0, overview: 1 - s / INTRO, summit: 0 };
  if (s >= OUTRO) return { year: 70, overview: 0, summit: (s - OUTRO) / (1 - OUTRO) };
  return { year: ((s - INTRO) / (OUTRO - INTRO)) * 70, overview: 0, summit: 0 };
}
export const progressForYear = (year) => INTRO + (Math.max(0, Math.min(70, year)) / 70) * (OUTRO - INTRO);
