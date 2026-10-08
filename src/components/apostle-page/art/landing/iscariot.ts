import { bag, coin, column, F, G, n1, P, rng, stars, type Art } from "../kit";

/** Judas Iscariot: "a thief, and had the bag" (John 12:6); "thirty pieces of silver" (Matthew 26:15), which he "cast
 *  down … in the temple" (Matthew 27:5). Drawn soberly: the bag, the pieces on the pavement, the columns. */
export function draw() {
  const r = rng(121), out: Art[] = [];
  for (let i = 0; i < 8; i++) out.push(P(`M${n1(800 - i * 30)} ${n1(620 + i * 30)}H${n1(1560 + i * 10)}`, "g", 0.05 + i * 0.02));
  for (let i = 0; i < 12; i++) out.push(P(`M${n1(820 + i * 66)} 620L${n1(560 + i * 92)} 860`, "g", 0.08 + i * 0.01));
  [840, 1040, 1240, 1440].forEach((x, i) => out.push(column(x, 600, 380, 0.1 + i * 0.04)));
  out.push(P("M780 220H1500M790 206H1490", "f", 0.2));
  out.push(bag(940, 650, 2.4, 0.3));
  const placed: [number, number][] = [];
  while (placed.length < 30) { const x = 1120 + r() * 420, y = 690 + r() * 160; if (placed.every(([a, b]) => Math.hypot(a - x, (b - y) * 2) > 30)) placed.push([x, y]); }
  placed.forEach(([x, y], i) => out.push(G(i % 7 === 3 ? "lp-glint" : "", coin(n1(x), n1(y), 15, 0.45 + i * 0.012, 0.42), `--gd:${(i % 5) * 1.1}s`)));
  out.push(stars(12, 123, [40, 40, 640, 300], 0.8));
  return F(...out);
}
