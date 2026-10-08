import { F, G, lamp, loaf, n1, P, rays, rng, stars } from "../kit";

/** Thaddaeus: his one question at the supper, "how is it that thou wilt manifest thyself unto us, and not unto the
 *  world?" (John 14:22). The room, the lamp, the bread, and through the window the world at night. */
export function draw() {
  const r = rng(111), roofs = Array.from({ length: 9 }, (_, i) => { const x = 930 + i * 46, h = 20 + r() * 40; return P(`M${x} 600v-${n1(h)}h${n1(30 + r() * 12)}v${n1(h)}`, "f", 0.3 + i * 0.02); });
  return F(
    P("M900 640V300C900 190 1000 120 1120 120C1240 120 1340 190 1340 300V640", "k", 0.05), P("M920 640V304C920 206 1010 142 1120 142C1230 142 1320 206 1320 304V640", "f", 0.08),
    P("M1120 142V640M920 390H1320", "m", 0.12), stars(28, 113, [930, 160, 1310, 520], 0.5), ...roofs, P("M930 600H1310", "f", 0.3),
    G("lp-breathe", P("M1190 220a20 20 0 1 0 18 28a16 16 0 0 1-18-28z", "tf", 0.5)),
    P("M860 640H1380V666H860Z", "k", 0.35), P("M700 760H1560L1520 700H740Z", "k", 0.4), P("M740 760V830M1520 760V830", "m", 0.42), P("M760 716H1500", "g", 0.44),
    lamp(1000, 690, 1.4, 0.5), G("lp-breathe", rays(1095, 650, 30, 120, 12, Math.PI * 0.95, Math.PI * 2.05, "tf", 0.6)),
    loaf(1280, 708, 60, 22, 0.55), P("M1360 712c10-6 30-6 40 0", "g", 0.6),
    stars(14, 117, [40, 40, 620, 300], 0.8),
  );
}
