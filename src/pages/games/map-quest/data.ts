// The game's data, built by scripts/build-map-quest.py from OpenBible's places (CC BY 4.0) and curation.json. Bundled
// with the game page, so the Daily Five can never fall back to a different puzzle because a file failed to load.
import disputedFile from "@/data/map-quest/disputed.json";
import placesFile from "@/data/map-quest/places.json";
import scheduleFile from "@/data/map-quest/daily.json";
import shapesFile from "@/data/map-quest/shapes.json";
import type { AreaShape } from "./area";
import { createDaily } from "./daily";
import type { DailySchedule } from "./daily-rules";
import type { DisputedPlace, QuestPlace } from "./pools";

export const PLACES = placesFile as unknown as QuestPlace[];
export const PLACE_BY_ID = new Map(PLACES.map((place) => [place.id, place]));
export const DISPUTED = disputedFile as DisputedPlace[];
/** The rivers', seas', valleys' and regions' shapes by place id (design §16). */
export const SHAPES = shapesFile as unknown as Record<string, AreaShape>;
export const SCHEDULE = scheduleFile as DailySchedule;
export const DAILY = createDaily(SCHEDULE, PLACES);
