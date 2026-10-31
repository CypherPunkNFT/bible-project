// MOCK-UP of the homepage on phones, opened at /home_mobile_mockups (and /home_mockup9) on this computer's preview only (see
// mockup-routes.tsx); never on the live site (owner, 2026-10-31: "phone opening looks not that great, lets get mobile_mockups
// to see what we can do here"). Layout E won and is now the homepage's own phone layout (components/home/home-phone.css), so
// the other layouts and the pill that switched them were taken out (owner, same day: "Take away the others, its Just E so
// then take away the pill switch"). The page is the homepage itself, looked at in the browser's own phone view.
import HomePage from "@/pages/HomePage";
import "./home-openings/home-mockup9.css";

export default function HomePageMockup9() {
  return <div className="hm9"><HomePage /></div>;
}
