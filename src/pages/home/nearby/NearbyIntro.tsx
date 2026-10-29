// Homepage (live; first tried on home_mockup2 "Close to home", owner 2026-10-23: "lets mock this section do 3 floating pill switch and when we
// switch it stays in the relative location"): ways to open the section, switched by a pill floating at the foot of the
// screen while the section is in view. 1 the words with the live figures beside them as a square-cornered 2 x 2 grid (owner,
// 2026-10-28: in place of the Resources box and the bar below); 2 everything centred with one Resources button, the Help for life lighthouse on the left and the chosen
// village on the right (owner, 2026-10-23; a third opening, a large title beside the words, was dropped by the owner). Switching keeps the reader's place: the
// opening's top stays put while it is on screen, the line above the map once the opening has scrolled away, the point at
// the middle of the screen in between, so the page does not jump though the openings differ in height.
// The pill is for trying the openings on /home_mockup2 only (trial); the real homepage shows Figures with no pill (owner,
// 2026-10-24: "take away the figures and centered pill option").
// Styles: nearby-intro.css.
import { ArrowRight, HandHeart } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LighthouseArt } from "./LighthouseArt";
import { PICKED } from "./NearbyArt";
import "./nearby-intro.css";

export interface Figures { cities: number; places: number; churches: number; help: number }

const ABOUT = "Faith is meant to be lived with others, close to where you are. Find a church to belong to, and a fellowship or Bible study where you can know people and be known through the week. And for the hardest days there is help nearby: food pantries, shelter, pregnancy centers, safety from abuse, recovery from addiction, grief care and support for families.";

const LAYOUTS = [{ id: "figures", name: "Figures" }, { id: "centered", name: "Centered" }] as const;
type LayoutId = (typeof LAYOUTS)[number]["id"];
const STORE = "hn-intro-layout";

function savedLayout(): LayoutId {
  try {
    const saved = localStorage.getItem(STORE);
    return LAYOUTS.find((l) => l.id === saved)?.id ?? "figures";
  } catch { return "figures"; }
}

function Heading({ number }: { number?: string }) {
  return <><p className="home-eyebrow">{number && <span className="home-number">{number}</span>}Close to home</p><h2 id="hn-title">Find your way, <em>close to home.</em></h2></>;
}

function FiguresLayout({ figures, number }: { figures: Figures; number?: string }) {
  const rows: [number, string][] = [[figures.cities, "Cities on the map"], [figures.places, "Places, each checked"], [figures.churches, "Churches & Bible studies"], [figures.help, "Places of help"]];
  return <header className="ni ni-figures">
    <div className="ni-figures-top"><div><Heading number={number} /><p className="ni-about">{ABOUT}</p></div>
      <dl className="ni-bar">{rows.map(([n, label]) => <div key={label}><dt>{label}</dt><dd>{n.toLocaleString("en-US")}</dd></div>)}</dl></div>
  </header>;
}

function CenteredLayout({ number }: { number?: string }) {
  return <header className="ni ni-centered">
    <div className="ni-side" aria-hidden="true"><LighthouseArt /></div>
    <div className="ni-center">
      <Heading number={number} /><p className="ni-about">{ABOUT}</p>
      <Link className="ni-pill" to="/resources"><HandHeart size={17} strokeWidth={1.6} aria-hidden />Resources<ArrowRight size={15} aria-hidden /></Link>
    </div>
    <div className="ni-side" aria-hidden="true"><PICKED.Art /></div>
  </header>;
}

export function NearbyIntro({ figures, number, trial = false }: { figures: Figures; number?: string; trial?: boolean }) {
  const [chosen, setLayout] = useState<LayoutId>(savedLayout);
  const layout = trial ? chosen : "figures";
  const [inView, setInView] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const anchor = useRef<{ fraction: number; y: number } | null>(null);

  // The pill shows only while the section is on screen.
  useEffect(() => {
    const section = wrap.current?.closest("section");
    if (!section) return;
    const watcher = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    watcher.observe(section);
    return () => watcher.disconnect();
  }, []);

  // After the switch, scroll so the same fraction of the opening sits where it sat on the screen before.
  useLayoutEffect(() => {
    const held = anchor.current, box = wrap.current?.getBoundingClientRect();
    anchor.current = null;
    if (!held || !box) return;
    const delta = box.top + held.fraction * box.height - held.y;
    if (Math.abs(delta) >= 1) window.scrollTo({ top: window.scrollY + delta, behavior: "instant" as ScrollBehavior });
  }, [layout]);

  function pick(id: LayoutId) {
    const box = wrap.current?.getBoundingClientRect();
    if (box) {
      // Its top while the top is on screen; the line above the map once the opening has scrolled away; in between, the
      // point at the middle of the screen.
      const fraction = box.top >= 0 ? 0 : Math.min(1, (window.innerHeight / 2 - box.top) / box.height);
      anchor.current = { fraction, y: box.top + fraction * box.height };
    }
    setLayout(id);
    try { localStorage.setItem(STORE, id); } catch { /* the choice is a convenience; it still applies for this visit */ }
  }

  return <div ref={wrap} className="ni-wrap">
    {layout === "figures" ? <FiguresLayout figures={figures} number={number} /> : <CenteredLayout number={number} />}
    {trial && <div className="ni-switch" role="group" aria-label="Opening of the section (mock-up)" data-hidden={inView ? undefined : ""}>
      {LAYOUTS.map(({ id, name }, i) => <button key={id} type="button" aria-pressed={layout === id} onClick={() => pick(id)}><span>{i + 1}</span><b>{name}</b></button>)}
    </div>}
  </div>;
}
