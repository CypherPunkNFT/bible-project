// A site-styled confirm (the audits' item 12: three games use the browser's grey alert box). A native <dialog> opened
// as a modal (focus trap, Escape and backdrop for free), in the way Bible Wordle's panels do, with the test page's
// fallback where showModal is missing. Focus returns to the opener on close. The words are the game's own; a question
// with a name in it puts the name in its own element inside `children`.
import { useEffect, useRef, type ReactNode } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  children?: ReactNode;
  /** The confirming button's words, e.g. "Leave round". */
  confirmLabel: ReactNode;
  /** The other button's words; default "Cancel". */
  cancelLabel?: ReactNode;
  /** Draws the confirming button in the wrong colour for an action that throws work away. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, title, children, confirmLabel, cancelLabel = "Cancel", danger = false, onConfirm, onCancel, className = "" } = props;
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (typeof element.showModal === "function") { if (!element.open) element.showModal(); }
    else element.setAttribute("open", "");
    element.querySelector<HTMLButtonElement>(".is-cancel")?.focus({ preventScroll: true });
    return () => {
      if (typeof element.close === "function" && element.open) element.close();
      else element.removeAttribute("open");
      opener?.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return <dialog ref={dialog} className={`kit-dialog${className ? ` ${className}` : ""}`} aria-labelledby="kit-dialog-title"
    onCancel={(event) => { event.preventDefault(); onCancel(); }} onClick={(event) => { if (event.target === dialog.current) onCancel(); }}>
    <div className="kit-dialog__body">
      <h2 id="kit-dialog-title" className="kit-dialog__title">{title}</h2>
      {children}
      <div className="kit-dialog__actions">
        <button type="button" className="is-cancel" onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className={danger ? "is-danger" : "is-confirm"} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </dialog>;
}
