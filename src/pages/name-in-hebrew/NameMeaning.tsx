// "Is my name in the Bible, and what does it mean?" for each name (or each word of a name) found: the meaning as the
// baby-name pages give it, how sure it is, who bore it and a link to the full name page; a Bible word's sense and
// verse; or a plain "not spelled this way in the Bible". Never an invented meaning. The meaning comes from the names
// index, so it shows before (and without) the name's own file; the caution line comes from that file.
import { Link } from "react-router-dom";
import { namePath, type NameDocument } from "@/data/baby-names";
import { plural } from "@/lib/site-format";
import type { Found } from "./bible-spelling";
import { WORD_TEXT } from "./word-texts";

/** How sure a meaning is, worded as the name pages word it. */
const SURE: Record<string, { label: string }> = { given: { label: "Given in the Bible" }, probable: { label: "Probable" }, uncertain: { label: "Uncertain" } };

function NameFound({ found, document }: { found: Extract<Found, { type: "name" }>; document?: NameDocument }) {
  const { row } = found;
  const uncertain = row.m === "Meaning uncertain";
  return (
    <div className="nh-meaning">
      {found.alias && <p className="nh-alias">{`Found under ${row.n} (also written ${found.typed})`}</p>}
      <p className="nh-headline">
        {uncertain ? <span>Its meaning is uncertain.</span> : <>
          <span translate="no">{`“${row.m}”`}</span>
          <span className={`nh-badge nh-badge-${row.l}`}>{SURE[row.l]?.label}</span>
        </>}
        {row.x === 1 && <span className="nh-muted">(for the best-known person of this name)</span>}
      </p>
      <p>{`In the Bible: ${row.w}`}</p>
      <p className="nh-muted">{plural(row.c, "Named in {n} verse.", "Named in {n} verses.")}</p>
      {document?.caution && <p className="nh-caution" role="note">{document.caution}</p>}
      <Link className="nh-more" to={namePath(row.s)}>{`More about the name ${row.n}, with its verses`}</Link>
    </div>
  );
}

export function NameMeaning({ found, documents }: { found: readonly Found[]; documents: ReadonlyMap<string, NameDocument> }) {
  return (
    <div className="nh-meanings">
      {found.map((entry) => (
        <article key={entry.typed} className="nh-found">
          {found.length > 1 && <h3 translate="no">{entry.typed}</h3>}
          {entry.type === "name" && <NameFound found={entry} document={documents.get(entry.row.s)} />}
          {entry.type === "word" && <div className="nh-meaning">
            <p className="nh-headline">{entry.word.kind === "god" ? "A name of God in the Bible" : "A word from the Bible"}</p>
            <p>{WORD_TEXT[entry.word.keys[0]]}</p>
          </div>}
          {entry.type === "none" && <p className="nh-none">{`${entry.typed} isn't spelled this way in the Bible (only the Bible's own spellings are matched), so there is no biblical meaning to show for it.`}</p>}
        </article>
      ))}
    </div>
  );
}
