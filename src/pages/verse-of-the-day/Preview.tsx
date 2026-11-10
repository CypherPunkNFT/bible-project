// The page's verse boxes are drawn by the real widget (docs/features/verse-widget/design.md 7.4), so the page can never
// drift from what churches get: the script is loaded once from /widget/v1/verse.js and each box is a div of the
// snippet's kind, drawn through the script's internal render(). The divs carry data-bibleguide-manual so the script's
// own scan leaves them to this component.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { loadWidget, type ShownDay } from "./load-widget";

export type { ShownDay } from "./load-widget";

interface WidgetBoxProps {
  /** The snippet's data- attributes. */
  attributes: Record<string, string>;
  /** A day to draw instead of today's (the longest verse). */
  day?: ShownDay | null;
  onDay?: (day: ShownDay | null) => void;
  className?: string;
  style?: CSSProperties;
}

export function WidgetBox({ attributes, day, onDay, className, style }: WidgetBoxProps) {
  const holder = useRef<HTMLDivElement>(null);
  const report = useRef(onDay);
  useEffect(() => { report.current = onDay; });
  const [state, setState] = useState<"waiting" | "shown" | "failed">("waiting");
  const drawKey = JSON.stringify([attributes, day ?? null]);

  useEffect(() => {
    const box = holder.current;
    if (!box) return;
    let current = true;
    const [wanted, given] = JSON.parse(drawKey) as [Record<string, string>, ShownDay | null];
    const element = document.createElement("div");
    element.className = "bibleguide-verse";
    element.setAttribute("data-bibleguide-manual", "");
    for (const [name, value] of Object.entries(wanted)) element.setAttribute(name, value);
    box.replaceChildren(element);
    loadWidget()
      .then((api) => (api ? api.render(element, given ?? undefined) : null))
      .then((shown) => {
        if (!current) return;
        setState(shown ? "shown" : "failed");
        report.current?.(shown);
      })
      .catch((error: unknown) => {
        console.warn("verse of the day: the preview could not be drawn", error);
        if (current) setState("failed");
      });
    return () => { current = false; };
  }, [drawKey]);

  return (
    <div className={className} style={style}>
      <div ref={holder} />
      {state === "waiting" && <p className="vd-waiting">Today's verse appears here</p>}
      {state === "failed" && <p className="vd-waiting">The verse could not be loaded. Try again later.</p>}
    </div>
  );
}
