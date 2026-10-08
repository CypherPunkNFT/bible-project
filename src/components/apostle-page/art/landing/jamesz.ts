import { boat, bolt, cloud, F, G, hills, n1, P, rng, sword, water } from "../kit";

/** James son of Zebedee: "Boanerges, which is, The sons of thunder" (Mark 3:17): thunderheads over the lake and his
 *  father's boat; and the sword of Acts 12:2, laid down. */
export function draw() {
  const r = rng(41), rain = Array.from({ length: 70 }, () => { const x = 640 + r() * 940, y = 330 + r() * 200; return P(`M${n1(x)} ${n1(y)}l-8 ${n1(26 + r() * 20)}`, "g", 0.7 + r() * 0.2); });
  return F(
    G("lp-drift", F(cloud(1120, 300, 640, 0.05, "k", 2), cloud(1420, 330, 360, 0.12, "m", 5), cloud(820, 320, 340, 0.16, "f", 7), cloud(1260, 180, 380, 0.2, "f", 9)), "--dx:-14px;--dur:14s"),
    bolt([[1180, 312], [1150, 384], [1176, 388], [1128, 482]], 0.5), bolt([[1460, 340], [1440, 390], [1458, 394], [1424, 458]], 0.55),
    G("lp-drift", F(...rain), "--dx:-10px;--dur:3s"),
    hills(520, 40, 6, 420, 1600, "f", 0.05), P("M380 536H1600", "f", 0.08), water(400, 1600, 548, 690, 8, 9, "w", 0.15),
    G("lp-bob", boat(820, 612, 230, { delay: 0.25, oars: false }), "--dur:5s;--dy:6px"),
    P("M860 768C980 750 1400 748 1560 760L1540 808C1380 822 980 822 880 812Z", "m", 0.4), P("M900 790C1040 780 1380 778 1520 786", "g", 0.45), P("M920 812l-6 30M1530 806l4 32", "g", 0.46),
    sword(1040, 752, 500, -3, 0.6),
    P("M0 840C200 826 380 822 560 830", "g", 0.1),
  );
}
