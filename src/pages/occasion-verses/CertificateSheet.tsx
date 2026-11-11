// The printed keepsake certificate (design 7), one page, drawn from what the visitor typed and the verse they chose. The
// names, church and pastor are their own words, shown under translate="no" and never stored. Every line of wording is a
// whole phrase of its own, so translation never has to stitch a sentence together. Fixed light colours: dark mode never
// reaches the paper.
import type { CSSProperties } from "react";
import type { CertificateKind } from "@/data/occasion-verses";
import { PAPER_SIZE, type Paper } from "@/pages/life-events/print-sheet";

export interface CertificateDetails {
  kind: CertificateKind;
  /** The one person (baptism, profession), the child (dedication) or the bride (wedding). */
  first: string;
  /** The parents (dedication) or the groom (wedding); unused otherwise. */
  second: string;
  /** "profession" or "confirmation", for the profession-of-faith certificate. */
  title: "profession" | "confirmation";
  /** The date as written by the date field and formatted for the page's language; "" when left empty. */
  date: string;
  church: string;
  pastor: string;
  verse: { text: string; reference: string } | null;
}

function Heading({ details }: { details: CertificateDetails }) {
  switch (details.kind) {
    case "baptism": return <h1>Certificate of Baptism</h1>;
    case "dedication": return <h1>Baby Dedication</h1>;
    case "wedding": return <h1>Our Wedding Day</h1>;
    default: return details.title === "confirmation" ? <h1>Confirmation</h1> : <h1>Profession of Faith</h1>;
  }
}

function Statement({ details }: { details: CertificateDetails }) {
  const name = (value: string) => <p className="ovc-name" translate="no">{value || " "}</p>;
  switch (details.kind) {
    case "baptism":
      return <>{name(details.first)}<p>having professed faith in Jesus Christ, was baptized by immersion in the name of the Father and of the Son and of the Holy Spirit.</p></>;
    case "dedication":
      return <>{name(details.first)}<p>was dedicated to the Lord before his church, as the parents promised to raise their child to know and love him.</p>
        {details.second && <><p className="ovc-label">Parents</p><p className="ovc-line" translate="no">{details.second}</p></>}</>;
    case "wedding":
      return <><p className="ovc-label">Bride</p>{name(details.first)}<p className="ovc-label">Groom</p>{name(details.second)}
        <p>were joined as husband and wife before God, their family and their friends.</p></>;
    default:
      return <>{name(details.first)}<p>confessed before the church that Jesus Christ is Lord and Savior.</p></>;
  }
}

function SmallPrint({ kind }: { kind: CertificateKind }) {
  if (kind === "wedding") return <p className="ovc-small">A keepsake, not a marriage licence or legal record.</p>;
  if (kind === "dedication") return <p className="ovc-small">A dedication is a promise by the parents and the church. It is not a baptism.</p>;
  return null;
}

export function CertificateSheet({ details, paper }: { details: CertificateDetails; paper: Paper }) {
  const size = PAPER_SIZE[paper];
  const style = { "--sheet-width": size.width, "--sheet-height": size.height } as CSSProperties;
  return (
    <div className={`ovc-sheet ovc-${details.kind} ovc-paper-${paper}`} style={style} data-sheet="certificate">
      <div className="ovc-frame">
        <Heading details={details} />
        <Statement details={details} />
        {details.verse && <figure className="ovc-verse">
          <blockquote className="scripture" lang="en" translate="no">{details.verse.text}</blockquote>
          <figcaption translate="no">{details.verse.reference}</figcaption>
        </figure>}
        <dl className="ovc-facts">
          {details.date && <><dt>Date</dt><dd>{details.date}</dd></>}
          {details.church && <><dt>{details.kind === "wedding" ? "Place" : "Church"}</dt><dd translate="no">{details.church}</dd></>}
        </dl>
        <div className="ovc-sign">
          <span className="ovc-sign-line" />
          <p className="ovc-label">Pastor</p>
          {details.pastor && <p translate="no">{details.pastor}</p>}
        </div>
        <SmallPrint kind={details.kind} />
        <p className="ovc-small">Scripture: Berean Standard Bible · bibleguide.io</p>
      </div>
    </div>
  );
}
