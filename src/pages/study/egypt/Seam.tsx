// Section 01: Amenemope's papyrus and Proverbs 22:17 to 24:22 on two true rulers, with a thread for each proposed match. Three named judges
// count them differently: a thread that judge does not count is cut to two stubs, and every row says in words who counts it, so neither the
// shape nor the colour stands alone. The list of passages is the interface, and the threads repeat it for a pointer.
import { D, findJudge, JUDGE_WORD, papyrusY, proverbsY, SEAM, threadEnds, threadPath, type Parallel } from "./model";
import { Cite, Head, Picture } from "./parts";

function Thread({ p, counted, picked, number, onOpen }: { p: Parallel; counted: boolean; picked: boolean; number: number; onOpen: () => void }) {
  const { fromY, toY } = threadEnds(p);
  const className = `eg-thread${counted ? " on" : " off"}${picked ? " picked" : ""}`;
  return <g className={className} onClick={onOpen}>
    {counted ? <>
      <path className="eg-hit" d={threadPath(p)} />
      <path className="eg-line" d={threadPath(p)} />
    </> : <>
      <path className="eg-line" d={`M${SEAM.left} ${fromY.toFixed(1)}h16`} />
      <path className="eg-line" d={`M${SEAM.right} ${toY.toFixed(1)}h-16`} />
    </>}
    {picked && <text className="eg-thread-num" x={SEAM.right + 8} y={toY + 4}>{number}</text>}
  </g>;
}

function SeamDrawing({ judgeId, pickedId, onOpen }: { judgeId: string; pickedId: string | null; onOpen: (key: string) => void }) {
  const lastVerse = proverbsY(23);
  return <svg className="eg-seamart" viewBox={`0 0 ${SEAM.width} ${SEAM.height}`} role="img" aria-label="Two upright rulers. The left is the 27 columns of the papyrus, marked by its thirty chapters. The right is the 70 verses of Proverbs 22:17 to 24:22. Threads link them, crossing one another, and every thread ends in the first third of the right-hand ruler. The list beside the drawing gives each one.">
    <text className="eg-ruler-head" x={SEAM.left} y="16" textAnchor="middle">Papyrus</text>
    <text className="eg-ruler-head" x={SEAM.right} y="16" textAnchor="middle">Proverbs</text>
    <path className="eg-ruler" d={`M${SEAM.left} ${SEAM.top}V${SEAM.bottom}M${SEAM.right} ${SEAM.top}V${SEAM.bottom}`} />
    {D.papyrus.chapters.map(([column, line], i) => <path key={i} className="eg-tick" d={`M${SEAM.left - (i % 5 === 4 ? 10 : 6)} ${papyrusY(column, line).toFixed(1)}h${i % 5 === 4 ? 10 : 6}`} />)}
    {[5, 10, 15, 20, 25, 30].map((n) => <text key={n} className="eg-tick-num" x={SEAM.left - 14} y={papyrusY(...D.papyrus.chapters[n - 1]) + 3} textAnchor="end">ch {n}</text>)}
    {Array.from({ length: 70 }, (_, i) => <path key={i} className="eg-tick" d={`M${SEAM.right} ${proverbsY(i).toFixed(1)}h4`} />)}
    <path className="eg-stop" d={`M${SEAM.right - 26} ${lastVerse + 4}h52`} />
    <text className="eg-ruler-note" x={SEAM.right + 6} y={lastVerse + 18} textAnchor="middle">23:11</text>
    <text className="eg-ruler-note" x={SEAM.right + 6} y={proverbsY(69) + 8} textAnchor="middle">24:22</text>
    {D.parallels.map((p, i) => <Thread key={p.id} p={p} number={i + 1} counted={p.judges.includes(judgeId)} picked={pickedId === p.id} onOpen={() => onOpen(`par:${p.id}`)} />)}
  </svg>;
}

export function Seam({ judgeId, picked, onJudge, onOpen }: { judgeId: string | null; picked: string | null; onJudge: (id: string) => void; onOpen: (key: string) => void }) {
  const judge = findJudge(judgeId);
  const counted = D.parallels.filter((p) => p.judges.includes(judge.id));
  return <>
    <Head num="01" kicker="Where the threads run" title={<>The texts stay.<em> The count moves.</em></>}
      lead="The Instruction of Amenemope is an Egyptian teaching in thirty chapters. When it was published in the 1920s, readers saw Proverbs in it. Here are its columns and Proverbs' verses on two true rulers, with a thread for each match that has been proposed." />
    <div className="eg-judges" role="group" aria-label="Whose count to show">
      {D.judges.map((j) => <button key={j.id} type="button" aria-pressed={j.id === judge.id} onClick={() => onJudge(j.id)}><strong>{j.name}</strong><small>{j.count}</small></button>)}
    </div>
    <p className="eg-judgenote"><b>{judge.count}.</b> {judge.who} {judge.note}</p>
    <Cite ids={[judge.source]} />
    <div className="eg-seam">
      <div><SeamDrawing judgeId={judge.id} pickedId={picked} onOpen={onOpen} />
        <p className="eg-caption">A full thread is a passage this judge counts, and two stubs a passage they do not. Positions are true to Griffith's column and line numbers, and to Proverbs' verse numbers. {counted.length} of {D.parallels.length} are full now.</p></div>
      <ol className="eg-parlist">{D.parallels.map((p, i) => <li key={p.id}>
        <button type="button" aria-pressed={picked === p.id} onClick={() => onOpen(`par:${p.id}`)}>
          <b>{i + 1}</b>
          <span><strong>{p.prov}</strong><small>{p.where}</small><small className="eg-whocounts">Counted by: {p.judges.map((id) => JUDGE_WORD.get(id)).join(", ")}</small></span>
          <i aria-hidden="true">{p.judges.includes(judge.id) ? "●" : "○"}</i>
        </button>
      </li>)}</ol>
    </div>
    <div className="eg-seamfacts">
      {D.seamFacts.map((f) => <div key={f.head}><h3>{f.head}</h3><p>{f.text}</p></div>)}
      <div><h3>Higher counts.</h3><p>{D.countsUpward}</p></div>
    </div>
    <div className="eg-artefact">
      <Picture id="ostracon" />
      <p className="eg-caption">Still being copied: a limestone flake with the book's beginning in red ink, dated to 525-404 BC. Schoolwork of this kind suggests a text people kept using, centuries after it was written, and the Met's record tells us no more than that.</p>
    </div>
  </>;
}
