import { C, E, F, G, n1, P, stone, txt, type Art } from "../kit";
import { sky } from "./shared";

/** Matthias: "they gave forth their lots; and the lot fell upon Matthias; and he was numbered with the eleven apostles"
 *  (Acts 1:26). Twelve places, eleven taken; two named (Acts 1:23); the lot falling. */
export function draw() {
  const out: Art[] = [sky(131, 24)], cx = 1120, cy = 600, R = 330;
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * (1.08 + (i / 11) * 0.84), x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.8;
    out.push(i === 11 ? G("lp-pulse", F(C(n1(x), n1(y), 14, "t", 0.5), C(n1(x), n1(y), 22, "tf", 0.55))) : F(C(n1(x), n1(y), 11, "m", 0.3 + i * 0.02), C(n1(x), n1(y), 4, "f", 0.35 + i * 0.02)));
  }
  out.push(txt(cx, cy - R * 0.8 - 40, "THE TWELVE", "lbl", "middle", 0.4));
  out.push(P(`M${cx - 360} 760H${cx + 360}`, "k", 0.2), P(`M${cx - 330} 760V800M${cx + 330} 760V800M${cx - 350} 778H${cx + 350}`, "f", 0.22));
  out.push(P(`M${cx - 80} 760C${cx - 96} 690 ${cx - 50} 640 ${cx} 640C${cx + 50} 640 ${cx + 96} 690 ${cx + 80} 760Z`, "k", 0.3), E(cx, 640, 36, 9, "m", 0.32), P(`M${cx - 70} 700C${cx - 30} 712 ${cx + 30} 712 ${cx + 70} 700M${cx - 78} 728C${cx - 30} 740 ${cx + 30} 740 ${cx + 78} 728`, "g", 0.34));
  out.push(stone(cx - 220, 738, 26, 7, "m", 0.45), txt(cx - 220, 830, "Joseph called Barsabas", "lbl-t", "middle", 0.7));
  out.push(G("lp-fall", stone(cx + 220, 738, 26, 9, "t", 0.5)), txt(cx + 220, 830, "Matthias", "lbl-t", "middle", 0.75));
  return F(...out);
}
