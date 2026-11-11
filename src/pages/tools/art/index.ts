// Every tool's picture, by name. A registry entry points at one with `art: TOOL_ART.<name>`; the drawing kit is the
// games' (src/pages/games/art/), so both hubs look alike. `satisfies` makes a mistyped name fail the typecheck.
import type { GameArt } from "@/pages/games/art/draw";
import {
  BabyNamesScene, BirthdayVersesScene, CountdownsScene, HomeBlessingsScene, LifeEventsScene, OccasionPrayersScene,
  SympathyScene, VerseCardsScene, VerseWidgetScene, WhenYoureScene,
} from "./scenes";

export const TOOL_ART = {
  babyNames: { Scene: BabyNamesScene, tone: "gospels", alt: "A baby asleep in a cradle, with a mobile of stars above" },
  birthdayVerses: { Scene: BirthdayVersesScene, tone: "epistles", alt: "A birthday cake with one lit candle beside a calendar page" },
  lifeEvents: { Scene: LifeEventsScene, tone: "poetry", alt: "A folded card with a cross on its front, and two wedding rings" },
  sympathy: { Scene: SympathyScene, tone: "prophets", alt: "A lit candle, a lily and a sealed envelope" },
  whenYoure: { Scene: WhenYoureScene, tone: "poetry", alt: "An umbrella held up against falling rain" },
  occasionPrayers: { Scene: OccasionPrayersScene, tone: "acts", alt: "A dove hovering over an open book on a lectern" },
  homeBlessings: { Scene: HomeBlessingsScene, tone: "history", alt: "A small house with lit windows and a blessing above the door" },
  verseCards: { Scene: VerseCardsScene, tone: "revelation", alt: "A phone showing a verse card, with hearts and a share arrow" },
  countdowns: { Scene: CountdownsScene, tone: "gospels", alt: "An Advent wreath of four candles with the first one lit" },
  verseWidget: { Scene: VerseWidgetScene, tone: "epistles", alt: "A church's web page with the day's verse in a box, and a code sign" },
} as const satisfies Record<string, GameArt>;
