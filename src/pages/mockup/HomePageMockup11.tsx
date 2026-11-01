// MOCK-UP of the homepage with its four Roman-numeral convictions pulled together on phones, opened at /home_mockup11 on this
// computer's preview only (see mockup-routes.tsx); never on the live site. Owner, 2026-11-01: "wondering if the Roman numeral
// section ... can be consolidated ... visually striking for mobile ... sideways scrolls ... some kind of representation".
// It is the real HomePage; only at phone width (640px and under) the list gives way to the version on the switcher under the section (?v=a to i).
// Wider screens show the page unchanged. It opens at the section, since that is the only part being judged.
import { useEffect, type ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import { ConvictionsExtra } from "@/pages/home/HomeGuide";
import { ConvictionsBook, ConvictionsCross, ConvictionsFolding, ConvictionsGiantNumerals, ConvictionsLongDrawing, ConvictionsLongDrawingWithMenu, ConvictionsPanels, ConvictionsRing, ConvictionsWindow } from "./home-convictions/ConvictionsPhone";
import { VersionPill } from "./legal/VersionPill";
import "./home-convictions/convictions-phone.css";

const VERSIONS: { id: VersionId; name: string; Version: ComponentType }[] = [
  { id: "a", name: "Sideways panels", Version: ConvictionsPanels },
  { id: "b", name: "One long drawing", Version: ConvictionsLongDrawing },
  { id: "c", name: "The ring", Version: ConvictionsRing },
  { id: "d", name: "The cross", Version: ConvictionsCross },
  { id: "e", name: "Folding rows", Version: ConvictionsFolding },
  { id: "f", name: "Open book", Version: ConvictionsBook },
  { id: "g", name: "Giant numerals", Version: ConvictionsGiantNumerals },
  { id: "h", name: "The window", Version: ConvictionsWindow },
  { id: "i", name: "Long drawing with numerals", Version: ConvictionsLongDrawingWithMenu },
];
type VersionId = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i";
/** The owner kept these (2026-11-01: "I like only A, B and H", plus the new I); the others stay at their ?v= address, off the switcher. */
const ON_SWITCHER: VersionId[] = ["a", "b", "h", "i"];

export default function HomePageMockup11() {
  const [params] = useSearchParams();
  const { Version, id } = VERSIONS.find((item) => item.id === params.get("v")) ?? VERSIONS[0];
  // This page also opens on the live site; search engines must not list it.
  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.append(robots);
    return () => robots.remove();
  }, []);
  // The layout scrolls every new page to the top first, so wait a moment before going to the section.
  useEffect(() => {
    if (!window.matchMedia("(max-width: 640px)").matches) return;
    const timer = window.setTimeout(() => document.querySelector(".home-guide-contact-list")?.scrollIntoView(), 400);
    return () => window.clearTimeout(timer);
  }, []);
  return <div className="hm11">
    <ConvictionsExtra.Provider value={<>
      <Version key={id} />
      <VersionPill<VersionId> label="Convictions" versions={VERSIONS.filter((item) => ON_SWITCHER.includes(item.id)).map((item) => ({ id: item.id, name: item.name }))} current={id} />
    </>}><HomePage /></ConvictionsExtra.Provider>
  </div>;
}
