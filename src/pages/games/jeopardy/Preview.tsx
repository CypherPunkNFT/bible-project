// Bible Jeopardy's preview (design 3.7, 9.2): the board as it will look, values only (the host may be standing in
// front of the projector), with Swap and New questions under each column, the Final's category, and the night's
// buttons: New board, Print host sheet, Copy board link, Back to setup and Start game.
import type { CSSProperties } from "react";
import { formatNumber } from "@/lib/site-format";
import type { Category } from "./categories";
import type { Board } from "./model";

interface Props {
  board: Board;
  offered: Category[];
  status: string;
  onSwap: (index: number, categoryId: string | null) => void;
  onRedraw: (index: number) => void;
  onSwapFinal: () => void;
  onNewBoard: () => void;
  onPrint: () => void;
  onCopyLink: () => void;
  onBack: () => void;
  onStart: () => void;
}

export function Preview({ board, offered, status, ...on }: Props) {
  const present = new Set(board.columns.map((column) => column.category));
  if (board.final) present.add(board.final.category);
  const others = offered.filter((category) => !present.has(category.id));
  return <div className="jp-preview">
    <header className="jp-preview-head">
      <h1>Your board</h1>
      <div className="jp-preview-actions">
        <button type="button" className="jp-quiet" onClick={on.onBack}>Back to setup</button>
        <button type="button" className="jp-quiet" onClick={on.onNewBoard}>New board</button>
        <button type="button" className="jp-quiet" onClick={on.onPrint}>Print host sheet</button>
        <button type="button" className="jp-quiet" onClick={on.onCopyLink}>Copy board link</button>
        <button type="button" className="jp-primary" onClick={on.onStart}>Start game</button>
      </div>
    </header>
    {board.notices.map((notice) => <p key={notice} className="jp-note" role="status">{notice}</p>)}
    {status && <p className="jp-hint" role="status">{status}</p>}
    <div className="jp-preview-board" style={{ "--jp-columns": board.columns.length } as CSSProperties}>
      {board.columns.map((column, index) => <section key={`${column.category}-${index}`} className="jp-preview-column" aria-label={column.title}>
        <h2>{column.title}</h2>
        <p>{column.line}</p>
        <ol>{column.tiles.map((tile) => <li key={tile.value}>{formatNumber(tile.value)}</li>)}</ol>
        <div className="jp-preview-tools">
          <button type="button" className="jp-quiet" onClick={() => on.onSwap(index, null)}>Swap</button>
          <select aria-label={`Swap ${column.title} for a chosen category`} value="" onChange={(event) => event.target.value && on.onSwap(index, event.target.value)}>
            <option value="">Choose…</option>
            {others.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
          </select>
          <button type="button" className="jp-quiet" onClick={() => on.onRedraw(index)}>New questions</button>
        </div>
      </section>)}
    </div>
    {board.final && <section className="jp-preview-final">
      <h2>Final question</h2>
      <p><strong>{board.final.title}</strong> · {board.final.line}</p>
      <button type="button" className="jp-quiet" onClick={on.onSwapFinal}>Swap</button>
    </section>}
  </div>;
}
