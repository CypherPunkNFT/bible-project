import { C, F, G, n1, P, scroll, stars, txt, type Art } from "../kit";

/** What a landing drawing may read from the page data: the four lists of the Twelve, for the two men known only from them. */
export interface LandingInput { lists: { book: string; position: number; name: string }[] }
export type Landing = (d: LandingInput) => Art;

/** Stars over the right of the field, a few over the quiet left third where the name sits. */
export const sky = (seed: number, n = 46) => F(stars(n, seed, [560, 30, 1600, 380], 0.7), stars(10, seed + 9, [40, 30, 560, 220], 0.8));
export const swim = (body: Art, dx: number, dur: number) => G("lp-swim", body, `--dx:${dx}px;--dur:${dur}s`);
const BOOK: Record<string, string> = { MAT: "Matthew 10", MRK: "Mark 3", LUK: "Luke 6", ACT: "Acts 1" };
export const bookLabel = (book: string) => BOOK[book] ?? book;

/** The four lists as standing scrolls, twelve lines each (eleven in Acts 1), his line lit and joined across. */
export function listScrolls(d: LandingInput, x0: number, x1: number, y: number, h: number, seed: number) {
  const lists = d.lists ?? [], w = (x1 - x0) / Math.max(1, lists.length), out: Art[] = [], marks: [number, number, number][] = [];
  lists.forEach((l, i) => {
    const cx = x0 + w * (i + 0.5), n = l.book === "ACT" ? 11 : 12, sw = w * 0.62;
    out.push(scroll(cx, y, sw, h, 0, 0.1 + i * 0.06, seed + i));
    for (let k = 1; k <= n; k++) {
      const yy = y - h / 2 + 22 + (k - 1) * ((h - 44) / 11), on = k === l.position;
      out.push(P(`M${n1(cx - sw / 2 + 26)} ${n1(yy)}h${n1(sw - 52 - (k * 7) % 20)}`, on ? "t" : "g", 0.3 + i * 0.05 + k * 0.01));
      if (on) marks.push([cx - sw / 2 + 18, yy, cx + sw / 2 - 18]);
      out.push(txt(n1(cx - sw / 2 + 14), n1(yy + 3), k, "lbl", "middle", 0.5));
    }
    out.push(txt(n1(cx), n1(y + h / 2 + 52), bookLabel(l.book), "lbl", "middle", 0.7), txt(n1(cx), n1(y + h / 2 + 74), l.name, "lbl-t", "middle", 0.75));
  });
  for (let i = 0; i < marks.length - 1; i++) out.push(P(`M${n1(marks[i][2])} ${n1(marks[i][1])}C${n1(marks[i][2] + 40)} ${n1(marks[i][1])} ${n1(marks[i + 1][0] - 40)} ${n1(marks[i + 1][1])} ${n1(marks[i + 1][0])} ${n1(marks[i + 1][1])}`, "t", 0.8));
  marks.forEach(([x, yy], i) => out.push(G("lp-pulse", C(x, yy, 5, "t", 0.85), `animation-delay:${i * 0.6}s`)));
  return F(...out);
}
