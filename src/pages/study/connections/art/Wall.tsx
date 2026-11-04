import { ink } from "./geometry";
import type { Spine } from "./wall-books";

/** Books as soft colour, with a brighter cap: no outlines and no lines, so they stay in the background. */
export function Wall({ books, opacity = 0.2 }: { books: Spine[]; opacity?: number }) {
  return (
    <g stroke="none">
      {books.map((b, i) => (
        <g key={i} style={{ fill: ink(b.section) }}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={1.5} fillOpacity={opacity} />
          <rect x={b.x} y={b.y} width={b.w} height={3} rx={1.5} fillOpacity={opacity * 2} />
        </g>
      ))}
    </g>
  );
}
