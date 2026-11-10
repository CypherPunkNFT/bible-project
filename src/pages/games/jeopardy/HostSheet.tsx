// Bible Jeopardy's host sheet (design 5.4): every tile with its category, value, clue, answer and reference, the Daily
// Double and the Final marked, printed with the browser's own print (jeopardy.css hides the rest of the page).
import { formatNumber } from "@/lib/site-format";
import type { Board } from "./model";

export function HostSheet({ board }: { board: Board }) {
  return <div className="jp-sheet">
    <h1>Bible Jeopardy · Host sheet</h1>
    {board.columns.map((column, col) => <section key={column.category}>
      <h2>{column.title}</h2>
      <table>
        <thead><tr><th scope="col">Value</th><th scope="col">Clue</th><th scope="col">Answer</th><th scope="col">Reference</th></tr></thead>
        <tbody>{column.tiles.map((tile, row) => {
          const daily = board.dailyDouble?.col === col && board.dailyDouble.row === row;
          return <tr key={tile.q.id}>
            <td>{formatNumber(tile.value)}{daily && <strong className="jp-sheet-dd">Daily Double</strong>}</td>
            <td>{tile.q.leadIn && <em>{tile.q.leadIn.question} {tile.q.leadIn.answer}. </em>}{tile.q.text}</td>
            <td>{tile.q.options[tile.q.correct]}</td>
            <td>{tile.q.reference ?? ""}</td>
          </tr>;
        })}</tbody>
      </table>
    </section>)}
    {board.final && <section>
      <h2>{`Final question · ${board.final.title}`}</h2>
      <p>{board.final.q.text}</p>
      <p><strong>{board.final.q.options[board.final.q.correct]}</strong> {board.final.q.reference ?? ""}</p>
    </section>}
  </div>;
}
