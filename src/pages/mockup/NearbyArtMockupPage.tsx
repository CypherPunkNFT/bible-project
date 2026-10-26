// MOCK-UP (/close_to_home_mockup, local preview only): drawings for the left of the homepage's centred "Close to home"
// opening, two by two, to choose one (owner, 2026-10-23), with the owner's pick so far above them. The drawings:
// nearby/NearbyArt.tsx (parts: nearby/art-parts.tsx); styles: nearby/nearby-art.css.
import { NEARBY_ART, PICKED } from "../home/nearby/NearbyArt";

export default function NearbyArtMockupPage() {
  return <div className="nam home-wrap">
    <header className="nam-head">
      <p className="home-eyebrow">Close to home · the drawing on the left</p>
      <h1>Four about <em>people together.</em></h1>
      <p>For the left of the centered opening, beside the Help for life morning on the right. Community rather than buildings: people gathered, walking, eating and sitting together, each drawn from the morning's own trees, clouds, birds, water and flowers, with the same slow movement.</p>
    </header>
    <section className="nam-pick" aria-label="Your pick so far">
      <PICKED.Art />
      <div className="nam-label"><span>Your pick so far</span><strong>{PICKED.name}</strong><p>{PICKED.note}</p></div>
    </section>
    <ul className="nam-grid">{NEARBY_ART.map(({ id, name, note, Art }, i) => <li key={id}>
      <div className="nam-frame"><Art /></div>
      <div className="nam-label"><span>Drawing {i + 1}</span><strong>{name}</strong><p>{note}</p></div>
    </li>)}</ul>
  </div>;
}
