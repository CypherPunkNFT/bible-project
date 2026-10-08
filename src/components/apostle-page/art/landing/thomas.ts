import { C, F, G, lamp, P, rays, stars, T } from "../kit";

/** Thomas: eight days later, "the doors being shut", Jesus says "Reach hither thy finger, and behold my hands" (John
 *  20:26–27). The shut door and its bar, a lamp, and two hands: one open with its mark, one reaching. */
const openHand = "M66 260C58 226 50 200 46 176C40 160 28 146 14 128C6 118 8 104 20 106C32 108 44 126 58 140L60 66C60 54 76 52 78 66L82 120L86 30C86 16 104 16 104 30L106 116L112 22C112 8 130 8 130 22L130 118L140 46C142 32 158 34 156 48L150 130C150 160 152 190 146 214C142 230 140 246 140 260";
const reachHand = "M0 40C30 34 60 30 92 30L190 26C204 26 206 42 192 44L118 50C128 54 132 62 126 70C134 74 136 84 128 90C134 96 132 106 122 108C112 112 80 112 60 108C40 104 20 100 0 98";
export const draw = () => F(
  P("M760 860V140H1240V860", "m", 0.05), P("M780 860V160H1220V860", "f", 0.08), P("M740 140H1260V112H740Z", "m", 0.1),
  ...Array.from({ length: 7 }, (_, i) => P(`M${800 + i * 60} 168V852`, "g", 0.12 + i * 0.01)),
  P("M790 330H1210M790 650H1210", "m", 0.2), ...[790, 1210].flatMap((x) => [C(x - (x > 1000 ? 20 : -20), 330, 6, "f", 0.24), C(x - (x > 1000 ? 20 : -20), 650, 6, "f", 0.24)]),
  P("M760 486H1250V512H760Z", "k", 0.3), P("M1250 470V528H1280V470Z", "m", 0.32), P("M720 480H760V518H720Z", "m", 0.33),
  C(1180, 420, 10, "tf", 0.36), P("M1180 430v24", "tf", 0.37),
  G("", lamp(1360, 520, 1.2, 0.4)), G("lp-breathe", rays(1440, 470, 30, 110, 12, Math.PI * 0.9, Math.PI * 2.1, "tf", 0.55)), P("M1290 540H1520", "f", 0.3),
  T("translate(930 470) scale(1.35)", F(P(openHand, "k", 0.5), P("M70 200C90 186 116 186 132 200M64 170C90 160 120 162 140 172", "g", 0.6), C(100, 184, 6, "t", 0.7))),
  T("translate(560 600) scale(1.35) rotate(-14)", F(P(reachHand, "k", 0.55), P("M126 70H96M128 90H98M60 40C70 60 70 80 60 100", "g", 0.65))),
  P("M0 860H1600", "g", 0.05), stars(16, 71, [40, 40, 700, 300], 0.8),
);
