// MOCK-UP of the homepage's opening on phones, opened at /home_mobile_mockups (and /home_mockup9) on this computer's preview
// only (see mockup-routes.tsx); never on the live site (owner, 2026-10-31: "phone opening looks not that great, lets get
// mobile_mockups to see what we can do here"). It is the real HomePage, unchanged, inside a wrapper whose letter picks one of
// five phone layouts in home-mockup9.css; the pill at the bottom swaps them (?v=b). The owner looks at it in the browser's own
// phone view (owner, same day: "You don't have to make it a mobile view"), so the page is shown as itself, not in frames.
import { useSearchParams } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import { FilledCity } from "./home-openings/HomeOpenings6Chapters";
import { VersionPill } from "./legal/VersionPill";
import "./home-openings/home-mockup9.css";

const PHONES = [
  { id: "a", name: "Calm" },
  { id: "b", name: "Inside the city" },
  { id: "c", name: "Squares under" },
  { id: "d", name: "One screen" },
  { id: "e", name: "Words first" },
  { id: "f", name: "Filled, edge to edge" },
  { id: "g", name: "Filled box" },
  { id: "h", name: "Filled, bigger stones" },
] as const;
/** F to H are E with the city filled with stones and no wall, towers or gates; the number is a course's depth (owner,
 *  2026-10-31: "a hybrid between B and E ... no gates, no pearls, no outer squares, just the little containers filled
 *  end-to-end. Maybe not even end-to-end, just the whole box itself"). */
const FILLED: Partial<Record<string, number>> = { f: 10, g: 10, h: 22 };
type PhoneId = (typeof PHONES)[number]["id"];

export default function HomePageMockup9() {
  const [params] = useSearchParams();
  const current = PHONES.find((item) => item.id === (params.get("v") ?? params.get("m")))?.id ?? ("f" as PhoneId);
  return <div className="hm9" data-phone={current}>
    <FilledCity.Provider value={FILLED[current] ?? 0}><HomePage /></FilledCity.Provider>
    <VersionPill<PhoneId> label="Phone" versions={[...PHONES]} current={current} />
  </div>;
}
