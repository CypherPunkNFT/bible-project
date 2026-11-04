// Section 02: eight tasks against five places. Each mark says which kind of evidence puts the task there; a table from 640px up, eight
// task buttons below that, and the chosen task's list of places at every width.
import { D, findTask, kindWord, type Kind, type Task } from "./model";
import { Head, KindMark, ReadVerses, SourceLink } from "./parts";

const PLAN_AREAS: Record<string, { x: number; y: number; w: number; h: number; label: string }[]> = {
  roof: [{ x: 8, y: 2, w: 164, h: 18, label: "Roof" }],
  upper: [{ x: 8, y: 22, w: 164, h: 18, label: "Upper" }],
  back: [{ x: 8, y: 44, w: 164, h: 34, label: "Back" }],
  side: [{ x: 8, y: 80, w: 46, h: 76, label: "Side" }, { x: 126, y: 80, w: 46, h: 76, label: "Side" }],
  middle: [{ x: 56, y: 80, w: 68, h: 76, label: "Middle" }],
};

function TaskPlan({ task }: { task: Task }) {
  return <svg className="hh-plan" viewBox="0 0 180 160" aria-hidden="true">
    {Object.entries(PLAN_AREAS).flatMap(([place, areas]) => areas.map((a) => {
      const mark = task.marks[place];
      return <g key={`${place}-${a.x}`}>
        <rect x={a.x} y={a.y} width={a.w} height={a.h} className={mark ? `hh-lit hh-${mark.kind}` : "hh-unlit"} />
        <text x={a.x + a.w / 2} y={a.y + a.h / 2 + 3.5} textAnchor="middle">{a.label}</text>
      </g>;
    }))}
  </svg>;
}

function Places({ task }: { task: Task }) {
  return <ul className="hh-places" aria-live="polite">{D.places.map((place) => {
    const mark = task.marks[place.id];
    return <li key={place.id} className={mark ? "" : "empty"}>
      <b>{place.label}</b>
      {mark ? <span><KindMark kind={mark.kind} /> <strong>{kindWord(mark.kind)}.</strong> {mark.why} {mark.source !== "scripture" && <SourceLink id={mark.source} />}</span>
        : <span>No source read here puts it in this place.</span>}
    </li>;
  })}</ul>;
}

function Cell({ task, place }: { task: Task; place: string }) {
  const kind: Kind | undefined = task.marks[place]?.kind;
  return <td>{kind ? <><KindMark kind={kind} /><span className="hh-sr">{kindWord(kind)}</span></> : <span className="hh-sr">Not placed here</span>}</td>;
}

export function Work({ taskId, onTask }: { taskId: string | null; onTask: (id: string) => void }) {
  const task = findTask(taskId);
  return <>
    <Head num="02" kicker="Who did what, where" title={<>Eight tasks.<em> Few of them pinned down.</em></>}
      lead="A floor shows where things were left, and a drawing shows where someone pictures them. Choose a task to see which is which. An empty place means only that nothing read for this study puts the task there." />
    <div className="hh-work">
      <div>
        <table className="hh-matrix">
          <caption className="hh-sr">Eight household tasks against five places in the house, marked by the kind of evidence</caption>
          <thead><tr><th scope="col">Task</th>{D.places.map((p) => <th key={p.id} scope="col">{p.label}</th>)}<th scope="col">Tel Halif's areas</th></tr></thead>
          <tbody>{D.tasks.map((t) => <tr key={t.id} className={t.id === task.id ? "on" : ""}>
            <th scope="row"><button type="button" aria-pressed={t.id === task.id} onClick={() => onTask(t.id)}>{t.name}</button></th>
            {D.places.map((p) => <Cell key={p.id} task={t} place={p.id} />)}
            <td className="hh-halif">{t.halif}</td>
          </tr>)}</tbody>
        </table>
        <div className="hh-taskbuttons">{D.tasks.map((t) => <button key={t.id} type="button" aria-pressed={t.id === task.id} onClick={() => onTask(t.id)}>{t.name}</button>)}</div>
        <p className="hh-caption">The last column is one report of a digital model of one 8th-century town. Its lettered areas could not be matched to the rooms here, so they stay in their own column.</p>
      </div>
      <div className="hh-chosen">
        <p className="hh-kicker">Chosen task</p>
        <h3>{task.name}</h3>
        <TaskPlan task={task} />
        <Places task={task} />
        {task.disagree && <p className="hh-disagree"><b>Sources disagree.</b> {task.disagree}</p>}
        {task.note && <p className="hh-tasknote">{task.note}</p>}
        <ReadVerses labels={task.verses} />
      </div>
    </div>
  </>;
}
