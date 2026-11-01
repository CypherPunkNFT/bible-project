// Homepage: the twelve questions as a slider, three at a time (two on a narrow phone), in place of rows of tiles, under one bar with the score as
// right / answered, a dot for each page and the left and right arrows (owner, 2026-10-31). It slides by swipe, or by dragging with a mouse.
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode, type RefObject, type TouchEvent } from "react";
import { QUESTIONS } from "../quiz-data";
import type { Quiz } from "./quiz-state";

/** A mouse has to move this far before a press counts as a drag and not a click on a tile. */
const DRAG_START = 5;

const pageWidth = (frame: HTMLElement) => frame.clientWidth + parseFloat(getComputedStyle(frame.firstElementChild ?? frame).columnGap || "0");

/** Where a slide begun at `left` should settle: past a sixth of the way, the page turns in its direction. */
const pageAfter = (frame: HTMLElement, left: number) => {
  const width = pageWidth(frame);
  const moved = (frame.scrollLeft - left) / width;
  const from = Math.round(left / width);
  return Math.abs(moved) > 1 / 6 ? from + Math.sign(moved) * Math.max(1, Math.round(Math.abs(moved))) : from;
};

/** The page shown, and the moves that change it. `question` is the question whose page to open on. */
export function useQuizPages(frame: RefObject<HTMLDivElement>, question: number, perPage: number) {
  const pages = Math.ceil(QUESTIONS.length / perPage);
  const start = Math.min(pages - 1, Math.floor(question / perPage));
  const [page, setPage] = useState(start);
  useLayoutEffect(() => {
    setPage(start);
    if (frame.current) frame.current.scrollLeft = start * pageWidth(frame.current);
  }, [frame, start]);
  const go = (next: number) => {
    const box = frame.current;
    if (!box) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.scrollTo({ left: Math.min(pages - 1, Math.max(0, next)) * pageWidth(box), behavior: smooth ? "smooth" : "auto" });
  };
  const track = () => { if (frame.current) setPage(Math.round(frame.current.scrollLeft / pageWidth(frame.current))); };
  return { page, pages, go, track };
}

export function QuizBar({ quiz, page, pages, go, nav }: { quiz: Quiz; page: number; pages: number; go: (next: number) => void; nav: boolean }) {
  const perPage = QUESTIONS.length / pages;
  return <div className="qv-bar">
    <div className="qv-bar-score" aria-live="polite">
      <p aria-label={`${quiz.right} right of ${quiz.answered} answered`}><strong>{quiz.right}</strong>/{quiz.answered}</p>
      {quiz.answered > 0 && <button type="button" aria-label="Start again" onClick={quiz.restart}><RotateCcw size={13} aria-hidden /><span>Start again</span></button>}
    </div>
    {nav && <>
      <div className="qv-bar-dots">{Array.from({ length: pages }, (_, i) => <button type="button" key={i} aria-label={`Questions ${i * perPage + 1} to ${(i + 1) * perPage}`} aria-current={i === page || undefined} onClick={() => go(i)} />)}</div>
      <div className="qv-bar-arrows">
        <button type="button" aria-label="Earlier questions" disabled={page === 0} onClick={() => go(page - 1)}><ArrowLeft size={18} aria-hidden /></button>
        <button type="button" aria-label="Later questions" disabled={page === pages - 1} onClick={() => go(page + 1)}><ArrowRight size={18} aria-hidden /></button>
      </div>
    </>}
  </div>;
}

export function QuizSlider({ frame, go, track, children }: { frame: RefObject<HTMLDivElement>; go: (next: number) => void; track: () => void; children: ReactNode }) {
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const press = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
    dragged.current = false;
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.x;
    if (!state.moved && Math.abs(dx) > DRAG_START) {
      state.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = "true";
    }
    if (state.moved) event.currentTarget.scrollLeft = state.left - dx;
  };
  const release = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    drag.current = null;
    if (!state?.moved) return;
    dragged.current = true;
    // Measured before snapping returns, which would pull it back.
    const target = pageAfter(event.currentTarget, state.left);
    delete event.currentTarget.dataset.dragging;
    go(target);
  };
  // A finger's swipe scrolls natively; on lifting, the same rule settles it, as snapping alone sends a short swipe back.
  const fingerStart = useRef(0);
  const lift = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 0) go(pageAfter(event.currentTarget, fingerStart.current));
  };
  const swallow = (event: MouseEvent) => {
    if (!dragged.current) return;
    event.preventDefault();
    event.stopPropagation();
    dragged.current = false;
  };
  return <div className="qv-slider" ref={frame} onScroll={track} onPointerDown={press} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onTouchStart={(event) => { fingerStart.current = event.currentTarget.scrollLeft; }} onTouchEnd={lift} onClickCapture={swallow}>{children}</div>;
}
