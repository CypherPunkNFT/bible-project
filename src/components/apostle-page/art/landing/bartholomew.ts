import { birds, E, F, figTree, grass, hills, P } from "../kit";
import { sky } from "./shared";

/** Bartholomew, if he is Nathanael: "when thou wast under the fig tree, I saw thee" (John 1:48). A broad fig tree with
 *  its five-lobed leaves and fruit, a low wall, and the road Philip came by (John 1:45–46). */
export const draw = () => F(
  sky(61, 34), hills(560, 44, 21, 420, 1600, "g", 0.02), hills(590, 26, 22, 420, 1600, "f", 0.05),
  E(1130, 826, 300, 24, "g", 0.3), figTree(1130, 820, 1.55, 13, 0.1),
  P("M600 806H860V772H600ZM600 789H860M660 772v17M730 789v17M800 772v17", "f", 0.3),
  P("M380 900C520 860 640 840 760 830", "g", 0.2), P("M380 900C520 860 640 840 760 830", "dash", 0.4),
  grass(420, 1600, 846, 60, 51, 18, "f", 0.55), birds([[760, 290, 0.9], [800, 270, 0.7]], 0.9),
);
