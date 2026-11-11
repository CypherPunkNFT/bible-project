// The testimony sheet as React draws it (design §5 and §9), on screen under the shelf's heading and in the print
// portal, so it takes its heading level and carries no id. The person's words sit in elements marked translate="no"
// and dir="auto"; the headings stay outside them so the page translator still translates them. Each heading is wrapped
// with its first paragraph so a page break never leaves a heading alone at the foot of a page.
import type { Sheet as SheetModel } from "./sheet";

interface SheetProps {
  sheet: SheetModel;
  /** 1 in the print portal and the file; 3 on screen under the shelf's h2. */
  level: 1 | 3;
}

export function SheetView({ sheet, level }: SheetProps) {
  const Title = level === 1 ? "h1" : "h3";
  const Heading = level === 1 ? "h2" : "h4";
  return <article className="tb-sheet">
    <header className="tb-sheet-head">
      <Title className="tb-sheet-title" translate="no" dir="auto">{sheet.title}</Title>
      {sheet.byline && <p className="tb-sheet-by" translate="no" dir="auto">{sheet.byline}</p>}
    </header>
    {sheet.sections.map((section) => <section key={section.id} className="tb-sheet-section">
      <div className="tb-sheet-keep">
        <Heading className="tb-sheet-heading">{section.heading}</Heading>
        <Paragraph lines={section.paragraphs[0] ?? []} />
      </div>
      {section.paragraphs.slice(1).map((lines, i) => <Paragraph key={i} lines={lines} />)}
    </section>)}
    {sheet.footer && <footer className="tb-sheet-foot"><p>{sheet.footer}</p></footer>}
  </article>;
}

function Paragraph({ lines }: { lines: readonly string[] }) {
  if (lines.length === 0) return null;
  return <p className="tb-sheet-text" translate="no" dir="auto">
    {lines.map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
  </p>;
}
