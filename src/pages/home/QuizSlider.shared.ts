// Shared data, hooks and helpers; React components stay in their own refresh boundary.
import { useLayoutEffect, useState, type RefObject } from "react";
import { QUESTIONS } from "../quiz-data";
export const pageWidth = (frame: HTMLElement) => frame.clientWidth + parseFloat(getComputedStyle(frame.firstElementChild ?? frame).columnGap || "0");

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
