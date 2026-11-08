// /life-events: the hub of life-event verse packs, and each pack at /life-events/<pack> (design 5).
// An unknown pack shows the site's own not-found page, which the crawler-copy capture recognises.
import type { CSSProperties } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { LIFE_EVENT_FAMILIES, LIFE_EVENTS, lifeEventBySlug, lifeEventPath, type LifeEvent } from "@/data/life-events";
import { useCatalog } from "@/lib/catalog";
import { bookByNum } from "@/lib/refs";
import NotFoundPage from "@/pages/NotFoundPage";
import { Ornament } from "./Ornament";
import { passageReference } from "./passage";
import { PackPage } from "./PackPage";
import "./life-events.css";
import "./life-events-sheet.css";

export default function LifeEventsPage() {
  return (
    <Routes>
      <Route index element={<LifeEventsHub />} />
      <Route path=":slug" element={<PackRoute />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function PackRoute() {
  const { slug } = useParams();
  const event = lifeEventBySlug(slug);
  return event ? <PackPage key={event.slug} event={event} /> : <NotFoundPage />;
}

function LifeEventsHub() {
  const catalog = useCatalog();
  // References only: quoting a verse per pack would fetch a dozen whole books just to draw this menu (design 5.3).
  const firstCardVerse = (event: LifeEvent) => {
    const passage = event.passages.find((item) => item.role === "card") ?? event.passages[0];
    return passageReference(passage, (book) => bookByNum(catalog, book)?.name ?? `Book ${book}`);
  };
  return (
    <div className="le-page le-hub mx-auto max-w-6xl px-4 sm:px-6">
      <h1>Bible Verses for Life's Big Moments</h1>
      <p className="le-intro">
        Chosen Bible passages for weddings, new babies, baptisms, graduations and the other big days of life, each with a free card you can print at home.
        Every page sorts its verses by use: longer readings for a ceremony, short verses for a card, and a blessing to speak, all in the Berean Standard Bible.
      </p>
      {LIFE_EVENT_FAMILIES.map((family) => (
        <section key={family.id} className="le-family" style={{ "--family": `var(--${family.tone})` } as CSSProperties} aria-labelledby={`family-${family.id}`}>
          <h2 id={`family-${family.id}`}>{family.title}</h2>
          <ul className="le-hub-grid">
            {LIFE_EVENTS.filter((event) => event.family === family.id).map((event) => (
              <li key={event.slug}>
                <Link to={lifeEventPath(event)} className="le-hub-card">
                  <Ornament name={event.card.ornament} colour="currentColor" size={30} />
                  <h3>{event.short}</h3>
                  <span className="le-hub-ref">{firstCardVerse(event)}</span>
                  <span className="le-hub-foot">Verses and a printable card</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="le-source">Scripture quotations are from the Berean Standard Bible (public domain).</p>
    </div>
  );
}
