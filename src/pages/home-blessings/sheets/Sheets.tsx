// The five layouts (design 6.1), drawn from a print job. Fixed sizes in inches or millimetres, ink only: strokes and type on
// white, nothing that needs a colour printer and nothing dark mode can reach. Only short, capped texts reach the fixed
// sheets (the data test holds every item to its layout's limits); the room-by-room order flows over as many pages as it needs.
import { Ornament } from "@/pages/life-events/Ornament";
import { PAPER_SIZE } from "@/pages/life-events/print-sheet";
import { cardSize, cleanFields, inSheets, type PrintJob, type PrintText, type Theme } from "../print-job";
import { ColouringBorder } from "./borders";
import { OrderSheet } from "./OrderSheet";
import { Footer, NameHeading, Prompts, SheetWords, sheetStyle } from "./parts";
import "./home-blessings-sheet.css";

const ORNAMENT: Record<Theme, string> = { house: "key", table: "sprig", night: "star" };
const INK = "#5b5246";

function sheetClass(job: PrintJob, layout: string): string {
  return `hbs-sheet hbs-${layout} hbs-paper-${job.paper}${job.guides ? " hbs-guides" : ""}`;
}

function WallPrint({ job, text }: { job: PrintJob; text: PrintText }) {
  const fields = cleanFields(job);
  return (
    <article className={sheetClass(job, "wall")} style={sheetStyle(job.paper)} data-layout="wall">
      <div className="hbs-wall-area">
        <Ornament name={ORNAMENT[job.theme]} colour={INK} size="0.6in" />
        <NameHeading value={fields.nameHeading} />
        <h1 className="hbs-heading">{text.heading}</h1>
        <SheetWords text={text} name={fields.name} className="hbs-wall-words" />
        <p className="hbs-credit">{text.credit}</p>
        {fields.familyLine && <p className="hbs-family" translate="no" dir="auto">{fields.familyLine}</p>}
        <Footer slug={job.slug} scripture={text.scripture} />
      </div>
    </article>
  );
}

function Card({ job, text }: { job: PrintJob; text: PrintText }) {
  const fields = cleanFields(job);
  return (
    <div className={`hbs-card hbs-card-${cardSize(text)}`} data-card={text.id}>
      <NameHeading value={fields.nameHeading} />
      <p className="hbs-heading">{text.heading}</p>
      {text.prompts ? <Prompts prompts={text.prompts} /> : <SheetWords text={text} name={fields.name} />}
      <p className="hbs-credit">{text.credit}</p>
      <Footer slug={job.slug} scripture={text.scripture} />
    </div>
  );
}

function CardsSheets({ job }: { job: PrintJob }) {
  return (
    <>
      {inSheets(job.texts).map((sheet, index) => (
        <article key={index} className={sheetClass(job, "cards")} style={sheetStyle(job.paper)} data-layout="cards">
          {sheet.map((text) => <Card key={text.id} job={job} text={text} />)}
        </article>
      ))}
    </>
  );
}

function TableHalf({ job, text, turned }: { job: PrintJob; text: PrintText; turned: boolean }) {
  return (
    <div className={`hbs-tent-face${turned ? " hbs-turned" : ""}`} data-face={turned ? "turned" : "upright"}>
      <p className="hbs-heading">{text.heading}</p>
      <SheetWords text={text} name={cleanFields(job).name} />
      <p className="hbs-credit">{text.credit}</p>
    </div>
  );
}

/**
 * The table card's landscape page. Edge printed a named landscape @page on a portrait sheet, scaled down, so the card
 * writes its own rule; it comes after the print module's portrait rule in the document, so it wins while the card is drawn.
 */
export const tentPageRule = (paper: PrintJob["paper"]): string => `@page { size: ${PAPER_SIZE[paper].height} ${PAPER_SIZE[paper].width}; margin: 0; }`;

/** Folded once along the long middle line; the top half is turned so the grace reads upright from both sides. */
function TableCard({ job, text }: { job: PrintJob; text: PrintText }) {
  return (
    <>
      <style>{tentPageRule(job.paper)}</style>
      <article className={sheetClass(job, "table-card")} style={sheetStyle(job.paper, true)} data-layout="table-card">
        <TableHalf job={job} text={text} turned />
        <TableHalf job={job} text={text} turned={false} />
      </article>
    </>
  );
}

function ColouringPage({ job, text }: { job: PrintJob; text: PrintText }) {
  const fields = cleanFields(job);
  return (
    <article className={sheetClass(job, "colouring")} style={sheetStyle(job.paper)} data-layout="colouring">
      <ColouringBorder theme={job.theme} />
      <div className="hbs-colouring-area">
        <NameHeading value={fields.nameHeading} />
        {text.prompts ? <Prompts prompts={text.prompts} /> : <SheetWords text={text} name={fields.name} />}
        <p className="hbs-credit">{text.credit}</p>
        <Footer slug={job.slug} scripture={text.scripture} />
      </div>
    </article>
  );
}

/** Every sheet a job prints. */
export function JobSheets({ job }: { job: PrintJob }) {
  const first = job.texts[0];
  if (job.layout === "order") return <OrderSheet job={job} />;
  if (job.layout === "cards") return <CardsSheets job={job} />;
  if (!first) return null;
  if (job.layout === "wall") return <WallPrint job={job} text={first} />;
  if (job.layout === "table-card") return <TableCard job={job} text={first} />;
  return <ColouringPage job={job} text={first} />;
}
