import type { Credit } from "@/lib/types";

/** The credit an openly licensed (not public-domain) text asks for: owner, source, licence, and what changed. */
export function CreditLine({ credit }: { credit: Credit }) {
  return (
    <>
      {credit.text} ·{" "}
      <a className="underline" href={credit.url} rel="noreferrer">
        source
      </a>{" "}
      ·{" "}
      <a className="underline" href={credit.licenceUrl} rel="noreferrer">
        {credit.licence}
      </a>
      . {credit.changes}
    </>
  );
}
