import { ArrowRight, BookOpen, Church, Compass, Landmark, MapPin } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { HISTORY_COLLECTIONS } from "./history-collections";
import { PlacesArtwork } from "./PlacesArtwork";
import { ATLAS_BASE as BASE } from "./routes";
import "./tradition-experience.css";

type LensId = "growth" | "centers" | "councils" | "worship";
interface Tradition {
  id: "catholic" | "eastern"; title: string; eyebrow: string; subtitle: string; description: string; place: string; places: string[];
  icon: typeof Church; lenses: Record<LensId, { title: string; description: string }>;
}
const LENS_LABELS: Record<LensId, string> = { growth: "Growth on the map", centers: "Centers", councils: "Councils", worship: "Worship & life" };

// Editorial outlines for the coming map. Dates, borders and growth layers are not reconstructed here yet.
const TRADITIONS: Tradition[] = [
  {
    id: "catholic", title: "Catholic Christianity", eyebrow: "The Latin West and beyond", subtitle: "Communion, councils & the papacy", icon: Church, place: "Rome",
    description: "Follow the church in communion with the bishop of Rome, from its early centers across Europe and then around the world.",
    places: ["Rome", "Milan", "Avignon", "Trent"],
    lenses: {
      growth: { title: "Watch the church grow, century by century.", description: "See Catholic Christianity spread from Rome across the Latin West, into new kingdoms and, later, around the world, with each period's evidence identified." },
      centers: { title: "Find the cities that shaped it.", description: "Rome and the sees, monasteries and universities where Catholic teaching, authority and reform took shape, each in its own period." },
      councils: { title: "Place the councils on the map.", description: "From the early councils shared with the East to Lateran, Trent and the Vatican councils: where they met, and the questions they answered." },
      worship: { title: "See faith as it was lived.", description: "Pilgrimage routes, cathedrals and religious orders, presented in the tradition's own voice and set in their places." },
    },
  },
  {
    id: "eastern", title: "Eastern Orthodoxy", eyebrow: "Constantinople and the East", subtitle: "Councils, icons & liturgy", icon: Landmark, place: "Constantinople",
    description: "Follow the communion of Orthodox churches, from Constantinople and the ancient patriarchates across the Balkans, the Rus' and beyond.",
    places: ["Constantinople", "Thessalonica", "Mount Athos", "Kyiv"],
    lenses: {
      growth: { title: "Watch the church grow, century by century.", description: "See Orthodox Christianity spread from Constantinople and the ancient patriarchates into the Balkans, the Rus' and beyond, with each period's evidence identified." },
      centers: { title: "Find the cities that shaped it.", description: "The patriarchates, monasteries and holy mountains where Orthodox life and teaching took shape, each in its own period." },
      councils: { title: "Place the councils on the map.", description: "The seven ecumenical councils and later Orthodox synods: where they met, and the questions they answered." },
      worship: { title: "See faith as it was lived.", description: "Liturgy, icons and monastic life, presented in the tradition's own voice and set in their places." },
    },
  },
];

/** The Apostolic Church collection: two traditions, chosen like a journey, with one shared workspace below. */
export function TraditionExperience() {
  const data = HISTORY_COLLECTIONS.find((entry) => entry.id === "catholic-orthodox")!;
  const [search, setSearch] = useSearchParams();
  const tradition = TRADITIONS.find((entry) => entry.id === search.get("tradition")) ?? TRADITIONS[0];
  const lensId = (Object.keys(LENS_LABELS) as LensId[]).find((id) => id === search.get("lens")) ?? "growth";
  const lens = tradition.lenses[lensId];
  const update = (key: string, value: string) => { const next = new URLSearchParams(search); next.set(key, value); setSearch(next, { replace: true }); };

  return <>
    <header className="places-destination-intro history-intro"><div><p className="places-kicker">Beyond the New Testament · {data.title}</p><h1>{data.heading}</h1><p>{data.intro}</p></div><PlacesArtwork kind="catholic-orthodox" /></header>
    <section aria-labelledby="tradition-choose-title">
      <div className="places-section-heading"><h2 id="tradition-choose-title">{data.choose}</h2><span>Choose a tradition to see it on the map</span></div>
      <div className="tradition-choices" role="group" aria-label={data.choose}>{TRADITIONS.map((entry) => <button type="button" key={entry.id} aria-pressed={tradition.id === entry.id} aria-label={`${entry.title}, ${entry.subtitle}`} onClick={() => update("tradition", entry.id)}>
        <span className="tradition-choice-top"><entry.icon size={22} strokeWidth={1.4} aria-hidden /><span>{entry.eyebrow}</span></span>
        <strong>{entry.title}</strong><small>{entry.subtitle}</small><p>{entry.description}</p>
        <span className="tradition-choice-places"><MapPin size={13} aria-hidden />{entry.places.join(" · ")}</span>
      </button>)}</div>
    </section>
    <section className="places-workspace" aria-labelledby="tradition-workspace-title">
      <header><div><p className="places-kicker">Your tradition</p><h2 id="tradition-workspace-title">{tradition.title}<span>{tradition.subtitle}</span></h2></div><span className="places-preview-label">Experience preview</span></header>
      <div className="places-lens-bar"><span>Explore through</span><div role="group" aria-label="Choose a lens">{(Object.keys(LENS_LABELS) as LensId[]).map((id) => <button type="button" key={id} aria-pressed={lensId === id} onClick={() => update("lens", id)}>{LENS_LABELS[id]}</button>)}</div></div>
      <div className="places-workspace-body">
        <div className="places-workspace-art" aria-hidden><PlacesArtwork kind="catholic-orthodox" /><span>{tradition.title} · {tradition.places.join(" · ")}</span></div>
        <div className="places-lens-copy" aria-live="polite"><p className="places-kicker">{LENS_LABELS[lensId]}</p><h3>{lens.title}</h3><p>{lens.description}</p>
          <div className="places-next-build"><Compass size={18} aria-hidden /><p>The growth map comes next: {tradition.title} spreading across the map, century by century.</p></div>
          <Link to={`${BASE}/map?find=${encodeURIComponent(tradition.place)}`}>Find {tradition.place} in the atlas<ArrowRight size={16} aria-hidden /></Link></div>
      </div>
    </section>
    <section className="history-sources tradition-sources"><h4><BookOpen size={16} aria-hidden />Reading room · {data.title}</h4><p>Start with these texts and accounts. Each source speaks from its own church perspective.</p>{data.sources.map((source) => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowRight size={15} aria-hidden /></a>)}</section>
  </>;
}
