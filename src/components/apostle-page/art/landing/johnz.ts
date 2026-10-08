import { birds, C, E, F, G, grass, hills, n1, olive, P, rays, rng, sun } from "../kit";
import { sky } from "./shared";

/** John: the run to the tomb: "the other disciple did outrun Peter, and came first to the sepulchre" (John 20:4). Two
 *  trails of steps, one ahead; the stone rolled away; the linen clothes lying (John 20:5–7). */
export function draw() {
  const r = rng(37), strata = Array.from({ length: 9 }, (_, i) => { const y = 520 + i * 32, x0 = 860 + i * 12 + r() * 30; return P(`M${n1(x0)} ${y}c60 ${n1(-6 + r() * 12)} 140 ${n1(-6 + r() * 12)} 220 0M${n1(x0 + 300 + r() * 80)} ${n1(y + 6)}c50 -4 120 -2 180 4`, "g", 0.2 + i * 0.02); });
  return F(
    sky(31, 30), sun(1470, 300, 32, 0.05), rays(1470, 300, 44, 92, 14, Math.PI * 1.05, Math.PI * 1.95, "tf", 0.5), hills(430, 30, 14, 420, 1600, "g", 0.02),
    P("M760 800C800 700 840 580 930 520C1020 470 1140 462 1300 470C1420 476 1520 490 1600 520", "k", 0.1), ...strata,
    P("M1110 730V610C1110 566 1140 540 1180 540C1220 540 1250 566 1250 610V730Z", "k", 0.2), P("M1124 730V614C1124 578 1148 556 1180 556C1212 556 1236 578 1236 614V730", "f", 0.25),
    P("M1140 712C1160 700 1200 700 1222 710M1146 700c16-8 46-8 64 0M1196 672c10-6 22-6 30 0c-8 5-22 5-30 0z", "tf", 0.5),
    P("M1250 734H1520", "m", 0.28), C(1390, 650, 84, "k", 0.3), C(1390, 650, 66, "f", 0.34), C(1390, 650, 20, "g", 0.36), P("M1330 600c20-14 50-18 76-12", "g", 0.4),
    P("M740 740H1600", "f", 0.08), P("M0 860C300 820 560 790 760 784", "g", 0.1),
    ...Array.from({ length: 9 }, (_, i) => { const t = i / 8, x = 200 + t * 860, y = 870 - t * 150; return G("lp-walk", F(E(x, y, 7, 3.5, "t", 0.6 + t * 0.05), E(x + 22, y - 9, 7, 3.5, "t", 0.6 + t * 0.05)), `--wd:${i * 0.35}s`); }),
    ...Array.from({ length: 7 }, (_, i) => { const t = i / 8, x = 150 + t * 860, y = 890 - t * 150; return G("lp-walk", F(E(x, y, 7, 3.5, "f", 0.65 + t * 0.05), E(x + 22, y - 9, 7, 3.5, "f", 0.65 + t * 0.05)), `--wd:${i * 0.35 + 0.6}s`); }),
    olive(840, 742, 1.15, 7, 0.4), grass(1000, 1600, 750, 34, 33, 18, "f", 0.6), birds([[1180, 300, 1], [1230, 280, 0.8]], 0.9),
  );
}
