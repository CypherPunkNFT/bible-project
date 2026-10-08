import { C, el, F, G, grass, hills, n1, P, rays, rng, scroll, stars, stone, T, walls, type Art } from "../kit";

/** Paul: "suddenly there shined round about him a light from heaven" on the road to Damascus (Acts 9:3); the letters he
 *  carried there (Acts 9:2) lying on the road. */
export function draw() {
  const out: Art[] = [stars(30, 141, [40, 30, 700, 300], 0.8), hills(560, 50, 41, 380, 1600, "g", 0.02), hills(600, 30, 42, 380, 1600, "f", 0.05)];
  out.push(walls(1360, 560, 180, 36, 0.15), P("M1410 524v-28h76v28M1426 496l22-18 22 18", "m", 0.25));
  out.push(P("M520 900C800 760 1180 640 1390 566", "k", 0.2), P("M1020 900C1140 760 1320 650 1430 566", "k", 0.22), P("M770 900C960 780 1240 660 1410 566", "g", 0.25));
  for (let i = 0; i < 9; i++) { const t = i / 8; out.push(P(`M${n1(640 + t * 720)} ${n1(880 - t * 300)}h${n1(14 - t * 10)}`, "g", 0.3 + t * 0.1)); }
  out.push(el("circle", { className: "sunfill", cx: 1100, cy: -120, r: 320 }), G("lp-breathe", rays(1100, -120, 200, 1060, 40, Math.PI * 0.22, Math.PI * 0.8, "tf", 0.4)),
    G("lp-breathe", rays(1100, -120, 220, 760, 20, Math.PI * 0.3, Math.PI * 0.7, "t", 0.45)), C(1100, -120, 200, "tf", 0.3));
  out.push(T("translate(880 790) rotate(-12)", F(scroll(0, 0, 230, 84, 5, 0.6, 143), C(0, 50, 9, "t", 0.7), P("M-5 58l-6 22M5 58l6 22", "tf", 0.72))));
  const r = rng(147);
  for (let i = 0; i < 14; i++) out.push(stone(n1(500 + r() * 1000), n1(860 + r() * 30), 4 + r() * 6, i + 1, "f", 0.5 + r() * 0.2));
  out.push(grass(380, 900, 880, 30, 145, 20, "f", 0.6));
  return F(...out);
}
