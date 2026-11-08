// The sheet to print, drawn into its own container on <body>, outside the app (print-sheet.ts explains the rest).
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** The sheet, drawn into its own container on <body>. The container exists as long as the component does. */
export function PrintPortal({ children, label }: { children: ReactNode; label: string }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const element = document.createElement("div");
    element.className = "print-sheet-portal";
    element.setAttribute("aria-hidden", "true");
    element.dataset.label = label;
    document.body.appendChild(element);
    setContainer(element);
    return () => { element.remove(); };
  }, [label]);
  return container ? createPortal(children, container) : null;
}
