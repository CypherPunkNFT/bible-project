// Section 03: the books name no writer; the witnesses do. A vertical thread of five named witnesses, in the order they
// wrote, each opening its record in the sheet. A witness whose own work is lost is drawn hollow, with the later writer who
// kept its words. Then the five books whose writers the witnesses name, each with its views and date ranges.
import { useContext } from "react";
import { plainText } from "@/pages/study/check-notes/checked";
import { BOOK_IDS, D, findGospel, isLost, viaEusebius, type BookId } from "./model";
import { OpenContext } from "./open-context";
import { Head, Holders, Text, ThreeParts } from "./parts";

type Change = (values: Record<string, string | null>) => void;

function Thread({ openValue }: { openValue: string | null }) {
  const open = useContext(OpenContext);
  return <ol className="nb-thread" aria-label="The early witnesses, in the order they wrote">
    {D.witnesses.records.map((w) => {
      const lost = isLost(w), kept = viaEusebius(w), key = `witness:${w.id}`;
      return <li key={w.id} className={lost ? "lost" : undefined}>
        <svg className="nb-node" viewBox="-12 -12 24 24" width="22" height="22" aria-hidden="true"><circle r="8" /></svg>
        <button type="button" data-opener={key} aria-haspopup="dialog" aria-pressed={openValue === key} onClick={() => open?.openWitness(w.id)}>
          <span className="nb-thread-who">{plainText(w.who)}</span>
          <span className="nb-thread-when">{plainText(w.when)}</span>
          <small>{lost ? "Own work lost" : "Own words survive"}{kept ? " · kept in Eusebius's Church History" : ""}</small>
        </button>
      </li>;
    })}
  </ol>;
}

function Synoptist({ id }: { id: BookId }) {
  const gospel = D.gospels.find((g) => g.id === id);
  if (!gospel) return null;
  return <div className="nb-book nb-book-two">
    <div>
      <p className="nb-kicker">Who the witnesses name</p>
      <p className="nb-para"><Text text={gospel.who} /></p>
    </div>
    <div>
      <p className="nb-kicker">Its date, in ranges</p>
      <p className="nb-para"><Text text={gospel.dateViews} /></p>
      <p className="nb-para nb-muted"><Text text={gospel.note} /></p>
    </div>
  </div>;
}

function Named({ part }: { part: typeof D.john | typeof D.acts }) {
  return <div className="nb-book">
    <h3><Text text={part.head} /></h3>
    <Holders views={part.views} />
    <p className="nb-kicker nb-gap">Its date</p>
    <p className="nb-para"><Text text={part.date} /></p>
    <ThreeParts evidence={part.evidence} inference={part.inference} limit={part.limit} />
  </div>;
}

const BOOK_NAME: Record<BookId, string> = { mark: "Mark", matthew: "Matthew", luke: "Luke", john: "John", acts: "Acts" };

export function Witnesses({ gospelId, openValue, onChange }: { gospelId: string | null; openValue: string | null; onChange: Change }) {
  const chosen = findGospel(gospelId);
  return <>
    <Head num="03" kicker="The witnesses" title={<>No names on the books.<em> Names in the witnesses.</em></>} lead={D.witnesses.lead} />
    <div className="nb-witnesses">
      <Thread openValue={openValue} />
      <div className="nb-pattern">
        <p className="nb-kicker">What the thread shows</p>
        <p className="nb-para"><Text text={D.witnesses.pattern} /></p>
        <p className="nb-caption">Filled: the witness's own writing survives in copies. Hollow: it is lost, and what it said comes to us inside a later writer's book. Choose a witness to open its record.</p>
        <p className="nb-caption"><b>Witness and tradition.</b> <Text text={D.confusedWords.find((w) => w.word === "Tradition and witness")?.note ?? ""} /></p>
      </div>
    </div>
    <h3 className="nb-subhead">The five books the witnesses name</h3>
    <div className="nb-booktabs" role="group" aria-label="Choose a book">
      {BOOK_IDS.map((id) => <button key={id} type="button" aria-pressed={id === chosen} onClick={() => onChange({ gospel: id })}>{BOOK_NAME[id]}</button>)}
    </div>
    <div className="nb-bookcard" aria-live="polite">
      {chosen === "john" ? <Named part={D.john} /> : chosen === "acts" ? <Named part={D.acts} /> : <Synoptist id={chosen} />}
    </div>
  </>;
}
