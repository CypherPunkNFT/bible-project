// MOCK-UP: the openings of /home_mockup6 (owner, 2026-10-30: "wildly different but cohesive and visually beautiful - think
// symmetry and simplicity with complexity and beauty"). Two remain, both Revelation 21's foursquare city with its twelve pearl
// gates, the title on the centre line: E, the city of books, and F, the city of chapters. The ring (A) and four corners (C)
// were taken out on the owner's word, 2026-10-30, and the gate (B) and the first city (D) on 2026-10-31; a copy of those four
// is in design/home-openings-6-removed/.
import { GoldMarquee, type OpeningProps } from "./HomeOpenings";
import { CityOfChapters } from "./HomeOpenings6Chapters";
import { CityOfBooks } from "./HomeOpenings6City";
import "./home-openings6.css";

export const OPENINGS_6 = [
  { id: "e", name: "City of books" },
  { id: "f", name: "City of chapters" },
] as const;
export type Opening6Id = (typeof OPENINGS_6)[number]["id"];

const VIEWS: Record<Opening6Id, (props: OpeningProps) => JSX.Element> = {
  e: (props) => <><CityOfBooks {...props} /><GoldMarquee /></>,
  f: (props) => <><CityOfChapters {...props} /><GoldMarquee /></>,
};

export function Opening6({ version, ...props }: OpeningProps & { version: Opening6Id }) {
  const View = VIEWS[version];
  return <View {...props} />;
}
