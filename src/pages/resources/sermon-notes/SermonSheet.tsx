// The printed sermon notes sheet (README.md beside this file): one page of the chosen paper, for adults or for children,
// drawn the same in the on-screen preview and in the print portal. True size, ink only: ruled lines are borders (the
// browser may drop backgrounds), and the colours are fixed so dark mode cannot reach the paper. The notes area (adults)
// and the drawing box (children) take whatever height is left, so the same sheet fills Letter and A4 without running on.
// What the visitor typed stays as typed (translate="no"); the sheet's own words translate with the page.
import type { CSSProperties, ReactNode } from "react";
import { PAPER_SIZE, type Paper } from "@/pages/life-events/print-sheet";

export type Version = "adult" | "kids";
export const PRINT_ADDRESS = "bibleguide.io/resources/sermon-notes";

interface SheetProps { version: Version; paper: Paper; title: string; passage: string }

export function SermonSheet({ version, paper, title, passage }: SheetProps) {
  const style = { "--sheet-width": PAPER_SIZE[paper].width, "--sheet-height": PAPER_SIZE[paper].height } as CSSProperties;
  return (
    <article className={`sn-sheet sn-${version} sn-paper-${paper}`} style={style} data-version={version}>
      {version === "adult" ? <AdultSheet title={title} passage={passage} /> : <KidsSheet title={title} passage={passage} />}
      <footer className="sn-foot"><span>Bible Guide</span><span translate="no">{PRINT_ADDRESS}</span></footer>
    </article>
  );
}

function AdultSheet({ title, passage }: { title: string; passage: string }) {
  return <>
    <header className="sn-head">
      <h2 className="sn-heading">Sermon notes</h2>
      <div className="sn-row">
        <Blank>Date</Blank>
        <Blank>Church</Blank>
        <Blank>Speaker</Blank>
      </div>
      <Blank value={title} big>Title</Blank>
      <Blank value={passage}>Passage</Blank>
    </header>
    <Prompt lines={2}>The main point</Prompt>
    <Prompt grow>Notes</Prompt>
    <div className="sn-pair">
      <Prompt lines={2}>Other verses mentioned</Prompt>
      <Prompt lines={2}>Questions to look into</Prompt>
      <Prompt lines={3}>What this shows about God</Prompt>
      <Prompt lines={3}>How I will respond this week</Prompt>
    </div>
    <Prompt lines={2}>A prayer in response</Prompt>
  </>;
}

function KidsSheet({ title, passage }: { title: string; passage: string }) {
  return <>
    <header className="sn-head">
      <h2 className="sn-heading">My sermon notes</h2>
      <div className="sn-row">
        <Blank>My name</Blank>
        <Blank>Date</Blank>
      </div>
      <Blank value={passage}>Today’s Bible passage</Blank>
      <Blank value={title}>The sermon was called</Blank>
    </header>
    <section className="sn-prompt sn-grow">
      <h3>Draw a picture of what you heard</h3>
      <div className="sn-draw" />
    </section>
    <div className="sn-pair">
      <Prompt lines={3}>One thing I learned about God</Prompt>
      <Prompt lines={3}>Something I can do this week</Prompt>
    </div>
    <Prompt lines={2}>Dear God, thank you for</Prompt>
  </>;
}

/** A label and a line to write on, or what the visitor typed in its place. */
function Blank({ value = "", big = false, children }: { value?: string; big?: boolean; children: ReactNode }) {
  return (
    <p className={`sn-blank${big ? " sn-big" : ""}`}>
      <span className="sn-label">{children}</span>
      <span className={value ? "sn-filled" : "sn-write"} translate="no">{value}</span>
    </p>
  );
}

/** Notes run past the bottom of the area and are clipped there, so a growing area is always full of lines. */
const GROW_LINES = 40;

/** A heading and ruled lines: a fixed number, or (grow) as many as the space left on the page holds. */
function Prompt({ lines = 0, grow = false, children }: { lines?: number; grow?: boolean; children: ReactNode }) {
  return (
    <section className={`sn-prompt${grow ? " sn-grow" : ""}`}>
      <h3>{children}</h3>
      <div className="sn-lines">{Array.from({ length: grow ? GROW_LINES : lines }, (_, i) => <span key={i} className="sn-line" />)}</div>
    </section>
  );
}
