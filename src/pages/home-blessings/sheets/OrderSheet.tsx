// The room-by-room order (design 4.4, 6.1): the stations the family ticked, each kept together, with "Leader" and "All"
// marks, ordinary page margins and page numbers. It flows over as many pages as it needs and promises no page count.
import { footerAddress, type PrintJob } from "../print-job";
import { BSB_SHORT, sheetStyle } from "./parts";

export function OrderSheet({ job }: { job: PrintJob }) {
  const closing = job.closing ?? [];
  return (
    <article className={`hbs-sheet hbs-order hbs-paper-${job.paper}`} style={sheetStyle(job.paper)} data-layout="order">
      <h1>Blessing Our Home, Room by Room</h1>
      <p className="hbs-order-how">One person reads the verse, the leader prays, and everyone answers “Amen.”</p>
      {(job.stations ?? []).map(({ station, reading }) => (
        <section key={station.id} className="hbs-station" data-station={station.id}>
          <h2>{station.heading}{station.place && <span className="hbs-place"> ({station.place})</span>}</h2>
          <p className="hbs-reading"><span className="hbs-mark">Reading: </span><span lang="en">{reading.text}</span> <cite>{reading.reference}</cite></p>
          <p><span className="hbs-mark">Leader: </span>{station.prayer}</p>
          <p><span className="hbs-mark">All: </span>Amen.</p>
        </section>
      ))}
      {closing.length > 0 && (
        <section className="hbs-station hbs-closing">
          <h2>Said together at the end</h2>
          {closing.map((text) => (
            <div key={text.id}>
              <p className="hbs-mark">{text.scripture ? "The leader, over everyone:" : "Everyone, sung or said:"}</p>
              <p className="hbs-reading" lang="en">{text.lines.map((line, index) => <span key={index} className="hbs-line">{line}</span>)}</p>
              <p className="hbs-credit">{text.credit}</p>
            </div>
          ))}
          <p><span className="hbs-mark">All: </span>Amen.</p>
        </section>
      )}
      <p className="hbs-footer">{BSB_SHORT} · {footerAddress(job.slug)}</p>
    </article>
  );
}
