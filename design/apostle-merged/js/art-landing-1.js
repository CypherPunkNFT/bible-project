// The landing drawings, one for each apostle, made from what Scripture tells of him (the verse is printed beside it).
// Drawn on a 1600 × 900 field: the left third stays quiet for the name; the subject sits right of centre.
// Peter, Andrew, James son of Zebedee, John, Philip, Bartholomew, Thomas. The other seven are in art-landing-2.js.
window.LANDING = window.LANDING ?? {};
(() => {
  const { P, E, C, G, T, rng, smooth, bez, stars, hills, water, grass, birds, sun, rays, boat, fish, net, key, loaf, basket, figLeaf, figTree, cloud, bolt, sword, olive, walls, column, lamp, n1 } = Kit;
  const sky = (seed, n = 46) => stars(n, seed, [560, 30, 1600, 380], .7) + stars(10, seed + 9, [40, 30, 560, 220], .8);
  const swim = (body, dx, dur) => G("lp-swim", body, `--dx:${dx}px;--dur:${dur}s`);

  // Peter: the boat on the lake at first light, the net cast over the side with fish in it, and the keys
  // (Matthew 4:18; 16:19).
  LANDING.peter = () => [
    sky(11), sun(1460, 330, 38, .05), rays(1460, 330, 52, 112, 18, Math.PI * 1.05, Math.PI * 1.95, "tf", .5),
    hills(452, 36, 3, 420, 1600, "g", .02), hills(468, 22, 8, 600, 1600, "f", .06), P("M380 474H1600", "f", .08),
    G("lp-breathe", Array.from({ length: 7 }, (_, i) => P(`M${1460 - 30 + i * 4} ${492 + i * 20}h${60 - i * 7}`, "tf", .4 + i * .02)).join("")),
    water(400, 1600, 486, 860, 15, 4, "w", .15),
    G("lp-bob", boat(960, 606, 430, { delay: .2 }) + net((t) => bez([1150, 548], [1240, 600], [1350, 640], [1440, 690])(t), (t) => bez([1170, 760], [1270, 830], [1390, 846], [1480, 820])(t), 14, 6, .45)
      + P("M790 640c30-4 60-4 90 0M900 652c40-5 80-5 120 0M1040 640c24-3 50-3 70 0", "w", .5), "--dur:7s;--dy:5px"),
    G("lp-breathe", P("M948 660v14M952 690v10M946 714v8M955 735v6", "g", .6)),
    swim(fish(1250, 742, 1.3, 1, "m", .7) + fish(1330, 770, 1.1, 1, "m", .74) + fish(1395, 735, 1, 1, "f", .78), 14, 9),
    swim(fish(1290, 808, 1.2, -1, "f", .8) + fish(1420, 795, .9, -1, "f", .82), -12, 11),
    G("lp-breathe", key(1090, 150, .85, 38, .5) + key(1196, 140, .85, 142, .55) + P("M1100 166C1120 196 1160 198 1182 160", "tf", .62)),
    birds([[820, 300, 1.1], [870, 280, .8], [930, 318, .9]], .85),
    P("M0 830C160 812 300 800 420 812", "g", .1), P("M70 846c4-4 10-4 14 0M160 832c3-3 8-3 11 0M300 824c4-4 9-4 13 0", "g", .3),
  ].join("");

  // Andrew: "a lad here, which hath five barley loaves, and two small fishes" on the grass by the lake
  // (John 6:9–10), and the path on which he first found his brother (John 1:41).
  LANDING.andrew = () => {
    const bx = 1120, by = 600;
    const loaves = [[bx - 92, by - 6, 62, 30], [bx + 4, by - 14, 66, 32], [bx + 100, by - 4, 60, 28], [bx - 46, by - 46, 60, 28], [bx + 52, by - 50, 62, 29]].map(([x, y, rx, ry], i) => loaf(x, y, rx, ry, .5 + i * .05)).join("");
    return [
      sky(21, 38), hills(420, 50, 5, 420, 1600, "g", .02), hills(450, 30, 12, 380, 1600, "f", .05), water(420, 1600, 462, 520, 4, 7, "w", .1),
      P("M380 532C700 540 1100 546 1600 534", "f", .1),
      E(bx, by + 236, 300, 26, "g", .2), basket(bx, by, 380, 230, .3), loaves,
      fish(bx - 150, by - 64, 2.4, -1, "k", .75), fish(bx + 170, by - 74, 2.3, 1, "k", .8),
      grass(420, 1600, 850, 80, 31, 26, "f", .5), grass(820, 1500, 880, 40, 32, 36, "m", .55),
      P("M120 880C260 800 420 770 640 762C740 758 800 770 860 790", "g", .2),
      ...[[200, 850], [262, 818], [330, 800], [400, 784], [470, 772], [540, 765]].map(([x, y], i) => G("lp-walk", E(x, y, 6, 3, "tf", .6) + E(x + 16, y - 6, 6, 3, "tf", .62), `--wd:${i * .5}s`)),
      ...[[226, 862], [292, 834], [360, 812], [432, 795], [504, 782]].map(([x, y], i) => G("lp-walk", E(x, y, 6, 3, "f", .6) + E(x + 16, y - 6, 6, 3, "f", .62), `--wd:${i * .5 + .25}s`)),
      birds([[760, 250, 1], [812, 232, .8]], .9),
    ].join("");
  };

  // James son of Zebedee: "Boanerges, which is, The sons of thunder" (Mark 3:17): thunderheads over the lake and
  // his father's boat; and the sword of Acts 12:2, laid down.
  LANDING.jamesz = () => {
    const r = rng(41), rain = Array.from({ length: 70 }, () => { const x = 640 + r() * 940, y = 330 + r() * 200; return P(`M${n1(x)} ${n1(y)}l-8 ${n1(26 + r() * 20)}`, "g", .7 + r() * .2); }).join("");
    return [
      G("lp-drift", cloud(1120, 300, 640, .05, "k", 2) + cloud(1420, 330, 360, .12, "m", 5) + cloud(820, 320, 340, .16, "f", 7) + cloud(1260, 180, 380, .2, "f", 9), "--dx:-14px;--dur:14s"),
      bolt([[1180, 312], [1150, 384], [1176, 388], [1128, 482]], .5), bolt([[1460, 340], [1440, 390], [1458, 394], [1424, 458]], .55),
      G("lp-drift", rain, "--dx:-10px;--dur:3s"),
      hills(520, 40, 6, 420, 1600, "f", .05), P("M380 536H1600", "f", .08), water(400, 1600, 548, 690, 8, 9, "w", .15),
      G("lp-bob", boat(820, 612, 230, { delay: .25, oars: false }), "--dur:5s;--dy:6px"),
      P("M860 768C980 750 1400 748 1560 760L1540 808C1380 822 980 822 880 812Z", "m", .4), P("M900 790C1040 780 1380 778 1520 786", "g", .45), P("M920 812l-6 30M1530 806l4 32", "g", .46),
      sword(1040, 752, 500, -3, .6),
      P("M0 840C200 826 380 822 560 830", "g", .1),
    ].join("");
  };

  // John: the run to the tomb: "the other disciple did outrun Peter, and came first to the sepulchre" (John 20:4).
  // Two trails of steps, one ahead; the stone rolled away; the linen clothes lying (John 20:5–7).
  LANDING.johnz = () => {
    const r = rng(37), strata = Array.from({ length: 9 }, (_, i) => { const y = 520 + i * 32, x0 = 860 + i * 12 + r() * 30; return P(`M${n1(x0)} ${y}c60 ${n1(-6 + r() * 12)} 140 ${n1(-6 + r() * 12)} 220 0M${n1(x0 + 300 + r() * 80)} ${n1(y + 6)}c50 -4 120 -2 180 4`, "g", .2 + i * .02); }).join("");
    return [
      sky(31, 30), sun(1470, 300, 32, .05), rays(1470, 300, 44, 92, 14, Math.PI * 1.05, Math.PI * 1.95, "tf", .5), hills(430, 30, 14, 420, 1600, "g", .02),
      P("M760 800C800 700 840 580 930 520C1020 470 1140 462 1300 470C1420 476 1520 490 1600 520", "k", .1), strata,
      P("M1110 730V610C1110 566 1140 540 1180 540C1220 540 1250 566 1250 610V730Z", "k", .2), P("M1124 730V614C1124 578 1148 556 1180 556C1212 556 1236 578 1236 614V730", "f", .25),
      P("M1140 712C1160 700 1200 700 1222 710M1146 700c16-8 46-8 64 0M1196 672c10-6 22-6 30 0c-8 5-22 5-30 0z", "tf", .5),
      P("M1250 734H1520", "m", .28), C(1390, 650, 84, "k", .3), C(1390, 650, 66, "f", .34), C(1390, 650, 20, "g", .36), P("M1330 600c20-14 50-18 76-12", "g", .4),
      P("M740 740H1600", "f", .08), P("M0 860C300 820 560 790 760 784", "g", .1),
      ...Array.from({ length: 9 }, (_, i) => { const t = i / 8, x = 200 + t * 860, y = 870 - t * 150; return G("lp-walk", E(x, y, 7, 3.5, "t", .6 + t * .05) + E(x + 22, y - 9, 7, 3.5, "t", .6 + t * .05), `--wd:${i * .35}s`); }),
      ...Array.from({ length: 7 }, (_, i) => { const t = i / 8, x = 150 + t * 860, y = 890 - t * 150; return G("lp-walk", E(x, y, 7, 3.5, "f", .65 + t * .05) + E(x + 22, y - 9, 7, 3.5, "f", .65 + t * .05), `--wd:${i * .35 + .6}s`); }),
      olive(840, 742, 1.15, 7, .4), grass(1000, 1600, 750, 34, 33, 18, "f", .6), birds([[1180, 300, 1], [1230, 280, .8]], .9),
    ].join("");
  };

  // Philip: "Philip, which was of Bethsaida of Galilee", whom the Greeks asked, "Sir, we would see Jesus" at the
  // feast (John 12:20–21): his lakeside town, the long road up, and the city.
  LANDING.philip = () => {
    const town = [[560, 600], [604, 590], [648, 604], [692, 594], [736, 606]].map(([x, y], i) => P(`M${x} ${y}v-30h38v30M${x - 4} ${y - 30}h46`, "m", .2 + i * .03) + P(`M${x + 14} ${y}v-14h10v14`, "g", .3 + i * .03)).join("");
    const portico = Array.from({ length: 9 }, (_, i) => P(`M${1150 + i * 32} 372V312`, "f", .36 + i * .01)).join("");
    return [
      sky(41, 40), hills(500, 46, 16, 420, 1600, "g", .02),
      water(420, 860, 616, 690, 5, 11, "w", .1), P("M420 610C560 600 720 602 860 612", "f", .1), town,
      P("M960 520C1040 440 1200 420 1360 420C1460 420 1540 440 1600 460", "m", .1),
      walls(1040, 480, 480, 70, .15),
      P("M1120 410V300H1460V410", "k", .25), P("M1110 300H1470V286H1110Z", "m", .28), P("M1140 286V250H1440V286M1130 250H1450", "m", .3), portico,
      P("M1230 250V170H1350V250M1222 170H1358V160H1222Z", "k", .34), P("M1260 250v-50a30 30 0 0 1 60 0v50", "m", .38), P("M1252 160l38-26l38 26", "m", .4),
      G("lp-flicker", P("M1290 128c-6-8-2-16 0-22c4 6 6 14 0 22z", "t", .55)), P("M1290 134v-4", "tf", .56),
      P("M760 640C880 680 920 730 990 730C1080 730 1060 590 1140 548C1180 528 1230 506 1270 482", "f", .4), P("M760 640C880 680 920 730 990 730C1080 730 1060 590 1140 548C1180 528 1230 506 1270 482", "dash", .5),
      ...[[800, 654], [860, 680], [920, 718], [990, 726], [1050, 676], [1090, 600], [1150, 546], [1210, 512]].map(([x, y], i) => G("lp-walk", C(x, y, 4, "t", .6), `--wd:${i * .45}s`)),
      olive(520, 790, .95, 3, .5), grass(400, 1600, 840, 60, 41, 20, "f", .6), P("M0 860C300 828 700 810 1600 820", "g", .1),
      birds([[900, 300, 1], [950, 284, .8], [990, 300, .7]], .85),
    ].join("");
  };

  // Bartholomew, if he is Nathanael: "when thou wast under the fig tree, I saw thee" (John 1:48). A broad fig
  // tree with its five-lobed leaves and fruit, a low wall, and the road Philip came by (John 1:45–46).
  LANDING.bartholomew = () => [
    sky(61, 34), hills(560, 44, 21, 420, 1600, "g", .02), hills(590, 26, 22, 420, 1600, "f", .05),
    E(1130, 826, 300, 24, "g", .3), figTree(1130, 820, 1.55, 13, .1),
    P("M600 806H860V772H600ZM600 789H860M660 772v17M730 789v17M800 772v17", "f", .3),
    P("M380 900C520 860 640 840 760 830", "g", .2), P("M380 900C520 860 640 840 760 830", "dash", .4),
    grass(420, 1600, 846, 60, 51, 18, "f", .55), birds([[760, 290, .9], [800, 270, .7]], .9),
  ].join("");

  // Thomas: eight days later, "the doors being shut", Jesus says "Reach hither thy finger, and behold my hands"
  // (John 20:26–27). The shut door and its bar, a lamp, and two hands: one open with its mark, one reaching.
  const openHand = "M66 260C58 226 50 200 46 176C40 160 28 146 14 128C6 118 8 104 20 106C32 108 44 126 58 140L60 66C60 54 76 52 78 66L82 120L86 30C86 16 104 16 104 30L106 116L112 22C112 8 130 8 130 22L130 118L140 46C142 32 158 34 156 48L150 130C150 160 152 190 146 214C142 230 140 246 140 260";
  const reachHand = "M0 40C30 34 60 30 92 30L190 26C204 26 206 42 192 44L118 50C128 54 132 62 126 70C134 74 136 84 128 90C134 96 132 106 122 108C112 112 80 112 60 108C40 104 20 100 0 98";
  LANDING.thomas = () => [
    P("M760 860V140H1240V860", "m", .05), P("M780 860V160H1220V860", "f", .08), P("M740 140H1260V112H740Z", "m", .1),
    ...Array.from({ length: 7 }, (_, i) => P(`M${800 + i * 60} 168V852`, "g", .12 + i * .01)),
    P("M790 330H1210M790 650H1210", "m", .2), ...[790, 1210].flatMap((x) => [C(x - (x > 1000 ? 20 : -20), 330, 6, "f", .24), C(x - (x > 1000 ? 20 : -20), 650, 6, "f", .24)]),
    P("M760 486H1250V512H760Z", "k", .3), P("M1250 470V528H1280V470Z", "m", .32), P("M720 480H760V518H720Z", "m", .33),
    C(1180, 420, 10, "tf", .36), P("M1180 430v24", "tf", .37),
    G("", lamp(1360, 520, 1.2, .4)), G("lp-breathe", rays(1440, 470, 30, 110, 12, Math.PI * .9, Math.PI * 2.1, "tf", .55)), P("M1290 540H1520", "f", .3),
    T("translate(930 470) scale(1.35)", P(openHand, "k", .5) + P("M70 200C90 186 116 186 132 200M64 170C90 160 120 162 140 172", "g", .6) + C(100, 184, 6, "t", .7)),
    T("translate(560 600) scale(1.35) rotate(-14)", P(reachHand, "k", .55) + P("M126 70H96M128 90H98M60 40C70 60 70 80 60 100", "g", .65)),
    P("M0 860H1600", "g", .05), stars(16, 71, [40, 40, 700, 300], .8),
  ].join("");
})();
