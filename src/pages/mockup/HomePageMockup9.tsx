// MOCK-UP of the homepage's opening on phones, opened at /home_mobile_mockups (and /home_mockup9) on this computer's preview
// only (see mockup-routes.tsx); never on the live site (owner, 2026-10-31: "phone opening looks not that great, lets get
// mobile_mockups to see what we can do here"). It is the real HomePage, unchanged, inside a wrapper whose letter picks one of
// five phone layouts in home-mockup9.css; the pill at the bottom swaps them (?v=b). The owner looks at it in the browser's own
// phone view (owner, same day: "You don't have to make it a mobile view"), so the page is shown as itself, not in frames.
import { useSearchParams } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import { VersionPill } from "./legal/VersionPill";
import "./home-openings/home-mockup9.css";

const PHONES = [
  { id: "a", name: "Calm" },
  { id: "b", name: "Inside the city" },
  { id: "c", name: "Squares under" },
  { id: "d", name: "One screen" },
  { id: "e", name: "Words first" },
] as const;
type PhoneId = (typeof PHONES)[number]["id"];

export default function HomePageMockup9() {
  const [params] = useSearchParams();
  const current = PHONES.find((item) => item.id === (params.get("v") ?? params.get("m")))?.id ?? ("a" as PhoneId);
  return <div className="hm9" data-phone={current}>
    <HomePage />
    <VersionPill<PhoneId> label="Phone" versions={[...PHONES]} current={current} />
  </div>;
}
