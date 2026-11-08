// What the card maker and the readers' sheet share for printing: the faces the sheet must have loaded before Print, the
// short address printed on every sheet, and the scale of the on-screen preview of a sheet of the chosen paper.
import { useEffect, useRef, useState } from "react";
import type { Paper } from "@/pages/life-events/print-sheet";

export const SHEET_FACES = ['400 1em "Literata Variable"', 'italic 400 1em "Literata Variable"', '400 1em "Archivo Variable"', '600 1em "Archivo Variable"'];
export const PRINT_ADDRESS = "bibleguide.io/sympathy";

export function usePreviewScale(paper: Paper) {
  const box = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(360);
  useEffect(() => {
    const element = box.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => setWidth(element.clientWidth || 360);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(1, width / (paper === "letter" ? 816 : 793.7));
  return { box, scale, height: (paper === "letter" ? 1056 : 1122.5) * scale };
}
