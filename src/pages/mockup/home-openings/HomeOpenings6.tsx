// MOCK-UP: the openings of /home_mockup6 (owner, 2026-10-30: "wildly different but cohesive and visually beautiful - think
// symmetry and simplicity with complexity and beauty"). Three remain, all Revelation 21's foursquare city of chapters with
// its twelve pearl gates, the title on the centre line: G, with the site's main sections in two columns beside it; H, with
// the home page's doorway squares, Bible to Sources, beside it; and I, H in front of mock-up 5's moving word wall (owner,
// 2026-10-31). The ring (A) and four corners (C) were taken out on the owner's word, 2026-10-30, the gate (B) and the first
// city (D) on 2026-10-31, and the city of books (E) and the plain city of chapters (F) later that day; copies are in
// design/home-openings-6-removed/.
import { GoldMarquee, type OpeningProps } from "./HomeOpenings";
import { CityOfChapters } from "./HomeOpenings6Chapters";
import "./home-openings6.css";

export const OPENINGS_6 = [
  { id: "g", name: "City with sides" },
  { id: "h", name: "City with squares" },
  { id: "i", name: "City on the word wall" },
] as const;
export type Opening6Id = (typeof OPENINGS_6)[number]["id"];

const VIEWS: Record<Opening6Id, (props: OpeningProps) => JSX.Element> = {
  g: (props) => <><CityOfChapters {...props} wings /><GoldMarquee /></>,
  h: (props) => <><CityOfChapters {...props} squares /><GoldMarquee /></>,
  i: (props) => <><CityOfChapters {...props} squares wall /><GoldMarquee /></>,
};

export function Opening6({ version, ...props }: OpeningProps & { version: Opening6Id }) {
  const View = VIEWS[version];
  return <View {...props} />;
}
