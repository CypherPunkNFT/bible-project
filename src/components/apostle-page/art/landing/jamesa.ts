import { F, P } from "../kit";
import { listScrolls, sky, type LandingInput } from "./shared";

/** James son of Alphaeus: ninth in every list (Matthew 10:3; Mark 3:18; Luke 6:15; Acts 1:13), drawn from the lists. */
export const draw = (d: LandingInput) => F(sky(91, 26), P("M600 820H1600", "g", 0.05), listScrolls(d, 640, 1580, 450, 520, 92));
