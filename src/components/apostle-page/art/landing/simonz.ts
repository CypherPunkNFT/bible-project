import { C, F, G, n1, P, txt, type Art } from "../kit";
import { bookLabel, sky, type LandingInput } from "./shared";

/** Simon the Zealot: the four lists as rows of twelve marks; his mark moves from eleventh (Matthew, Mark: "the
 *  Canaanite") to tenth (Luke, Acts: "Zelotes"), and each list's own words for him stand beside it. */
export function draw(d: LandingInput) {
  const out: Art[] = [sky(101, 30)], lists = d.lists ?? [], x0 = 700, x1 = 1440, step = (x1 - x0) / 11;
  const hits: [number, number, LandingInput["lists"][number]][] = [];
  lists.forEach((l, i) => {
    const y = 250 + i * 150, n = l.book === "ACT" ? 11 : 12;
    out.push(P(`M${x0 - 20} ${y}H${x1 + 20}`, "f", 0.1 + i * 0.05), txt(x0 - 40, y + 4, bookLabel(l.book), "lbl", "end", 0.4));
    for (let k = 1; k <= n; k++) {
      const x = x0 + (k - 1) * step, on = k === l.position;
      out.push(on ? F(C(x, y, 9, "t", 0.3 + k * 0.01), C(x, y, 15, "tf", 0.35)) : C(x, y, 4, "m", 0.2 + i * 0.05 + k * 0.01));
      if (on) hits.push([x, y, l]);
    }
  });
  hits.forEach(([x, y, l], i) => {
    out.push(txt(n1(x + 30), n1(y - 22), l.name, "lbl-t", "start", 0.8));
    if (i) out.push(P(`M${n1(hits[i - 1][0])} ${n1(hits[i - 1][1] + 15)}C${n1(hits[i - 1][0])} ${n1(y - 70)} ${n1(x)} ${n1(hits[i - 1][1] + 80)} ${n1(x)} ${n1(y - 15)}`, "tf", 0.85));
  });
  out.push(G("lp-breathe", P(`M${x0 - 20} 840H${x1 + 20}`, "g", 0.2)));
  return F(...out);
}
