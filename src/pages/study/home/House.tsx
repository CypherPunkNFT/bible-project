// Section 01, the page's central graphic: one house cut open, with how sure we are drawn into the line. The drawing is one label for a
// screen reader; the listed buttons are the interface, and each opens the room's record in the sheet.
import { HouseLines } from "./HouseDrawing";
import { D, kindWord } from "./model";
import { Head, Picture } from "./parts";

export function House({ picked, onOpen }: { picked: string | null; onOpen: (key: string) => void }) {
  return <>
    <Head num="01" kicker="One house, cut open" title={<>Stone below.<em> Argument above.</em></>}
      lead="This is the usual plan, not one excavated house: a broad room across the back, with long rooms running forward from it, pillars between some of them, and one space often open to the sky. Read the line before the room. It tells you how the room is known." />
    <div className="hh-house">
      <div>
        <svg className="hh-cut" viewBox="0 0 640 420" role="img" aria-label="A pillared house cut open. Excavated ground walls, pillars, an oven and storage jars are drawn in solid line. An animal, a loom, the beams and the upper floor are dashed, as a modern reconstruction adds them. The roof is dotted, as known mainly from passages of Scripture. The rooms are listed as buttons beside the drawing.">
          <HouseLines picked={picked} onPick={(id) => onOpen(`room:${id}`)} />
        </svg>
        <ul className="hh-scale">{D.scale.map((s) => <li key={s.id}>
          <svg viewBox="0 0 44 10" width="44" height="10" aria-hidden="true"><path className={`hh-${s.id}`} d="M2 5h40" /></svg>
          <span><b>{s.word}.</b> {s.note}</span>
        </li>)}</ul>
      </div>
      <ol className="hh-rooms">{D.rooms.map((room, i) => <li key={room.id}>
        <button type="button" aria-pressed={picked === room.id} data-room-button={room.id} onClick={() => onOpen(`room:${room.id}`)}>
          <b>{i + 1}</b><span><strong>{room.name}</strong><small>{room.line}</small></span><em className={`hh-word hh-word-${room.kind}`}>{kindWord(room.kind)}</em>
        </button>
      </li>)}</ol>
    </div>
    <div className="hh-rebuilt-photo">
      <Picture id="rebuilt" />
      <div>
        <p className="hh-kicker">A reconstruction you can walk round</p>
        <h3>Standing in it does not make it a find.</h3>
        <p>This room was built in modern times at a museum in Tel Aviv. It gives a sense of plaster, post and scale, and it stands a loom where its builders chose to put it. Keep a full-size model on the same shelf as a drawing.</p>
      </div>
    </div>
  </>;
}
