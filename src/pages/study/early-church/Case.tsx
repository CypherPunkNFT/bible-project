// The case: eight drawers, one per kind of writing, in the order the kinds appear, under the four periods of the record. The chart
// answers "which kinds of writing witness which years?" and is for a pointer only; the eight drawer buttons beneath are the
// control, by keyboard and on phones. The chosen drawer opens its records below, one row each; a row opens its record in the sheet.
import { Checked } from "@/pages/study/check-notes/CheckNotes";
import { plainText } from "@/pages/study/check-notes/checked";
import { DrawerArt } from "./drawings";
import { CHART, caseRows, drawerYears, x, type Bar, type Placed } from "./geometry";
import { D, DRAWERS, EC, FIRST, LAST, recordPath, type Part } from "./model";
import { useOpen } from "./open";
import { Head, Prose, QuoteLine } from "./parts";

const periodName = new Map(D.periods.map((p) => [p.id, p.name]));

function Bars({ bars, className }: { bars: Bar[]; className: string }) {
  return <>{bars.map((b, i) => <rect key={i} className={`${className}${b.soft ? " ek-soft" : ""}`} x={x(b.from) - 2} width={Math.max(4, x(b.to) - x(b.from) + 4)} height="8" rx="4" />)}</>;
}

function RecordLine({ placed }: { placed: Placed }) {
  const open = useOpen();
  const { record, span, bars, alternatives, y } = placed;
  const right = Math.max(...bars.map((b) => x(b.to)), ...alternatives.map((a) => x(a.to)));
  const left = Math.min(...bars.map((b) => x(b.from)), ...alternatives.map((a) => x(Math.max(a.from, FIRST))));
  const flip = right > 700;
  const extra = alternatives.map((a) => a.holder).join(" · ");
  return <g className="ek-recline" transform={`translate(0 ${y})`} onClick={() => open(`rec:${record.id}`)}>
    <title>{`${plainText(record.name)}: ${span?.words ?? ""}`}</title>
    {alternatives.map((a, i) => <g key={i}><rect className="ek-alt" x={x(Math.max(a.from, FIRST))} y="-1" width={Math.max(10, x(a.to) - x(Math.max(a.from, FIRST)))} height="10" rx="5" />{a.openStart && <path className="ek-arrow ek-arrow-faint" d={`M${x(FIRST) - 4} 4h-14m5-4-5 4 5 4`} />}</g>)}
    <Bars bars={bars} className="ek-bar ek-on" />
    {span?.kind === "open" && <path className="ek-arrow" d={`M${right + 4} 4h18m-5-4 5 4-5 4`} />}
    <text x={flip ? left - 8 : right + (span?.kind === "open" ? 28 : 8)} y="8" textAnchor={flip ? "end" : "start"}>
      {plainText(record.name)}<tspan className="ek-tw"> · {span?.words}{extra && ` · also argued: ${extra}`}</tspan>
    </text>
  </g>;
}

function Chart({ chosen, onChoose }: { chosen: Part; onChoose: (id: string) => void }) {
  const { rows, height } = caseRows(chosen.id);
  const ticks = [64, 100, 150, 200, 250, 300, 350, 400, LAST];
  return <svg className="ek-chart" viewBox={`0 0 ${CHART.width} ${height}`} aria-hidden="true" focusable="false">
    {D.periods.map((p, i) => <g key={p.id} className={`ek-period ek-period-${i % 2}`}>
      <rect x={x(p.start)} y={CHART.top - 30} width={x(p.end) - x(p.start)} height={height - CHART.top + 30 - CHART.bottom + 6} />
      <text x={x(p.start) + 6} y={CHART.top - (i % 2 ? 8 : 20)}>{p.name}</text>
    </g>)}
    {rows.map((row) => <g key={row.part.id} className={`ek-row${row.open ? " ek-row-open" : ""}`}>
      <g className="ek-rowhit" onClick={() => onChoose(row.part.id)}>
        <rect className="ek-hit" x="0" y={row.y} width={CHART.width} height={row.height} />
        <text className="ek-rownum" x="10" y={row.y + 15}>{row.part.n}</text>
        {!row.open && <g transform={`translate(0 ${row.y + 8})`}><Bars bars={row.bars} className="ek-bar" /></g>}
      </g>
      {row.open && row.records.map((placed) => <RecordLine key={placed.record.id} placed={placed} />)}
    </g>)}
    <g className="ek-axis" transform={`translate(0 ${height - CHART.bottom + 8})`}>
      <path d={`M${x(64)} 0H${x(LAST)}`} />
      {ticks.map((t) => <g key={t} transform={`translate(${x(t)} 0)`}><path d="M0 0v5" /><text y="19" textAnchor="middle">{t}</text></g>)}
    </g>
  </svg>;
}

function Accounts() {
  return <div className="ek-accounts" aria-label="The two accounts of 312, side by side">
    {EC.accounts.map((a) => <figure key={a.id}><p className="ek-kicker">{a.writer}</p><blockquote><Prose text={a.text} /></blockquote></figure>)}
    <p className="ek-caption">Both are sentences of the Milvian Bridge record, set side by side: a dream in the earlier account; a sign in the sky, then a dream, in the later.</p>
  </div>;
}

function Drawer({ part }: { part: Part }) {
  const open = useOpen();
  const meta = DRAWERS[part.id];
  return <div className="ek-drawer" id="ek-drawer-panel" role="region" aria-label={plainText(part.title)}>
    <Head kicker={<><b>{part.n}</b> · {meta?.kind} · {periodName.get(meta?.period ?? "")}</>} title={part.title} lead={<Prose text={part.lead} />} level={3} />
    {part.id === "constantine" && <Accounts />}
    <ol className="ek-records">{part.records.map((r) => {
      const path = recordPath.get(r.id) ?? "";
      return <li key={r.id}>
        <p className="ek-when"><Checked text={r.when} /><small><Checked text={r.where} /></small></p>
        <div>
          <p className="ek-kind"><Checked text={r.kind} /></p>
          <h4><Checked text={r.name} /></h4>
          <p className="ek-hook"><Prose text={r.hook} /></p>
          <button type="button" className="ek-open" data-opener={`rec:${r.id}`} aria-haspopup="dialog" onClick={() => open(`rec:${r.id}`)}>
            Open the record: what it says, what follows, where it stops <span aria-hidden="true">→</span></button>
        </div>
        {r.quote ? <QuoteLine words={r.quote.words} source={r.quote.source} reference={r.quote.ref} path={path} held={EC.held[`${path}.quote.words`]?.[0]?.title} /> : <span aria-hidden="true" />}
      </li>;
    })}</ol>
  </div>;
}

export function Case({ chosen, onChoose }: { chosen: Part; onChoose: (id: string) => void }) {
  return <>
    <Head kicker="The case" title="Eight kinds of writing. One church changing." lead="These centuries are known through kinds of documents, and each kind belongs to a stage of the story. Choose a drawer to open its records." />
    <figure className="ek-case">
      <Chart chosen={chosen} onChoose={onChoose} />
      <figcaption className="ek-caption">Read across: prison letters and martyrs' records give way to emperors' letters and councils' definitions as the church's situation changes. A solid bar is a year the record states; a soft bar is an estimate or an argued date, a few years wide where the record says “about” one year; a century named in words is drawn as its thirds (late first century 67–100, early second 100–133); a dashed outline is another date some scholars argue, with who argues it. Point at a drawer's row to choose it; choose a record's line to open it.</figcaption>
    </figure>
    <div className="ek-drawers" role="group" aria-label="The eight drawers">{D.parts.map((p) => <button key={p.id} type="button" className="ek-drawer-btn" aria-pressed={p.id === chosen.id}
      aria-controls="ek-drawer-panel" onClick={() => onChoose(p.id)}>
      <DrawerArt id={p.id} /><b>{p.n}</b><span>{DRAWERS[p.id]?.kind}</span><small>{drawerYears(p)}</small>
    </button>)}</div>
    <Drawer part={chosen} />
  </>;
}
