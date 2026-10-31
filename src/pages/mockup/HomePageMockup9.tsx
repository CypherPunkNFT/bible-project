// MOCK-UP of the homepage's opening on phones, opened at /home_mockup9 on this computer's preview only (see mockup-routes.tsx);
// never on the live site (owner, 2026-10-31: "phone opening looks not that great, lets get mobile_mockups to see what we can
// do here"). It is the real HomePage, unchanged, inside a wrapper whose ?m= letter picks one of five phone layouts in
// home-mockup9.css; wide screens see the homepage as it is. /home_mobile_mockups shows all five side by side at phone size.
import { useSearchParams } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import "./home-openings/home-mockup9.css";

export default function HomePageMockup9() {
  const [params] = useSearchParams();
  return <div className="hm9" data-phone={params.get("m") ?? "a"}><HomePage /></div>;
}
