import { basket, birds, E, F, fish, G, grass, hills, loaf, P, water } from "../kit";
import { sky } from "./shared";

/** Andrew: "a lad here, which hath five barley loaves, and two small fishes" on the grass by the lake (John 6:9–10),
 *  and the path on which he first found his brother (John 1:41). */
export function draw() {
  const bx = 1120, by = 600;
  const loaves = [[bx - 92, by - 6, 62, 30], [bx + 4, by - 14, 66, 32], [bx + 100, by - 4, 60, 28], [bx - 46, by - 46, 60, 28], [bx + 52, by - 50, 62, 29]].map(([x, y, rx, ry], i) => loaf(x, y, rx, ry, 0.5 + i * 0.05));
  return F(
    sky(21, 38), hills(420, 50, 5, 420, 1600, "g", 0.02), hills(450, 30, 12, 380, 1600, "f", 0.05), water(420, 1600, 462, 520, 4, 7, "w", 0.1),
    P("M380 532C700 540 1100 546 1600 534", "f", 0.1),
    E(bx, by + 236, 300, 26, "g", 0.2), basket(bx, by, 380, 230, 0.3), ...loaves,
    fish(bx - 150, by - 64, 2.4, -1, "k", 0.75), fish(bx + 170, by - 74, 2.3, 1, "k", 0.8),
    grass(420, 1600, 850, 80, 31, 26, "f", 0.5), grass(820, 1500, 880, 40, 32, 36, "m", 0.55),
    P("M120 880C260 800 420 770 640 762C740 758 800 770 860 790", "g", 0.2),
    ...[[200, 850], [262, 818], [330, 800], [400, 784], [470, 772], [540, 765]].map(([x, y], i) => G("lp-walk", F(E(x, y, 6, 3, "tf", 0.6), E(x + 16, y - 6, 6, 3, "tf", 0.62)), `--wd:${i * 0.5}s`)),
    ...[[226, 862], [292, 834], [360, 812], [432, 795], [504, 782]].map(([x, y], i) => G("lp-walk", F(E(x, y, 6, 3, "f", 0.6), E(x + 16, y - 6, 6, 3, "f", 0.62)), `--wd:${i * 0.5 + 0.25}s`)),
    birds([[760, 250, 1], [812, 232, 0.8]], 0.9),
  );
}
