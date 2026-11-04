// Section 05: what a reading does. The verse stands once, and below it the name each later reader put in it. The list is a selection, and the
// long history between Jews and Christians is handed to its own planned study. Paul's words stand; a later reader's target is not Scripture.
import { D, readerById } from "./model";
import { Cite, Head, Quote, ThreeParts } from "./parts";

export function Whom({ onOpen }: { onOpen: (id: string) => void }) {
  const note = D.targetsNote;
  return <>
    <Head num="05" kicker="Verse 30" title={<>Expel the slave woman.<em> Whom?</em></>}
      lead="What has a reading been used to do? The verse did not change. The name written beside it did." />
    <Quote label="Galatians 4:30" />
    <ol className="hc-targets">{D.targets.map((t) => {
      const reader = readerById.get(t.id);
      return <li key={t.id}>
        <p className="hc-target-who">{reader ? <button type="button" aria-haspopup="dialog" data-opener={`target:${t.id}`} onClick={() => onOpen(t.id)}>{t.reader} →</button> : t.reader}</p>
        <p className="hc-target-name">{t.target}</p>
        <p className="hc-target-text">{t.text}</p>
        <Cite ids={[t.source]} />
      </li>;
    })}</ol>
    <ThreeParts evidence={note.evidence} inference={note.inference} limit={note.limit} />
    <p className="hc-stand"><b>Where this site stands.</b> {note.stand}</p>
    <Cite ids={note.sources} />
  </>;
}
