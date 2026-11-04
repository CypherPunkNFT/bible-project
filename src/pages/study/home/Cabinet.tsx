// The second half of section 03: real objects, each with its museum, date and licence. Each card opens the object's record in the
// sheet, which says what the museum's record does not.
import { D, pictureById } from "./model";

export function Cabinet({ picked, onOpen }: { picked: string | null; onOpen: (key: string) => void }) {
  return <div className="hh-cabinet" id="cabinet">
    <p className="hh-kicker">The cabinet</p>
    <h3 className="hh-subhead">Real things.<em> Mostly without their rooms.</em></h3>
    <p className="hh-q">A museum can tell you the site. It often cannot tell you the house, the room or the hand.</p>
    <ul className="hh-objects">{D.objects.map((o) => {
      const picture = pictureById.get(o.picture);
      return <li key={o.id}>
        <button type="button" aria-pressed={picked === o.id} data-object-button={o.id} onClick={() => onOpen(`object:${o.id}`)}>
          {picture && <img src={picture.src} width={picture.width} height={picture.height} alt={picture.alt} loading="lazy" onError={(e) => { console.error(`Home and household page: the picture ${picture.src} did not load`); e.currentTarget.style.display = "none"; }} />}
          <strong>{o.name}</strong>
          <small>{o.line}</small>
          <small>{o.from} · {o.date}</small>
        </button>
      </li>;
    })}</ul>
  </div>;
}
