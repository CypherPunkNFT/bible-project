// The click-to-explain highlights: <CheckNotesProvider> holds a study's checkNotes and the one open note; <Checked> shows
// a string with its settled words highlighted; a click opens the note in the study's own sliding sheet (SlidePanel), so it
// takes the page's sheet look. Only one sheet is open at a time: a page closes its own sheet through `onOpen`, and calls
// `closeNote()` from useCheckNotes() (./context) when it opens one of its own. Behaviour only: each page styles .chk-* itself if it
// wants to; check-notes.css gives the defaults.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { STATUS_LABEL, SHOW_CHECK_NOTES, markRequest, notesById, parseChecked, plainText, type CheckNote } from "./checked";
import { CheckNotesContext, useCheckNotes } from "./context";
import "./check-notes.css";

export function CheckNotesProvider({ notes, onOpen, children }: { notes: unknown; onOpen?: () => void; children: ReactNode }) {
  const byId = useMemo(() => notesById(notes), [notes]);
  const [openId, setOpenId] = useState<string | null>(null);
  const openNote = useCallback((id: string) => { onOpen?.(); setOpenId(id); }, [onOpen]);
  const closeNote = useCallback(() => setOpenId(null), []);
  const value = useMemo(() => ({ notes: byId, openId, openNote, closeNote }), [byId, openId, openNote, closeNote]);
  return <CheckNotesContext.Provider value={value}>{children}<CheckNoteSheet /></CheckNotesContext.Provider>;
}

/** `text` with its checked words as highlighted buttons; `render` formats the plain runs (and the checked words). */
export function Checked({ text, render = (words: string) => words }: { text: string; render?: (words: string) => ReactNode }) {
  const state = useCheckNotes();
  if (!SHOW_CHECK_NOTES || !state) return <>{render(plainText(text))}</>;
  return <>{parseChecked(text).map((segment, index) => {
    const note = segment.kind === "check" ? state.notes.get(segment.id) : undefined;
    if (segment.kind === "plain" || !note) return <span key={index}>{render(segment.text)}</span>;
    const words = segment.text.trim();
    const open = () => state.openNote(note.id);
    // A span, not a <button>: a button cannot wrap across lines, and a settled passage is often longer than a line.
    return <span key={index} role="button" tabIndex={0} className={`chk-mark chk-${note.status}${words ? "" : " chk-dot"}${state.openId === note.id ? " chk-on" : ""}`}
      aria-haspopup="dialog" aria-label={words ? undefined : `Editor's note: ${STATUS_LABEL[note.status]}`}
      onClick={open} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } }}>
      {words ? render(segment.text) : null}</span>;
  })}</>;
}

function NoteBody({ note }: { note: CheckNote }) {
  const changed = note.after !== note.before;
  return <div className="chk-sheet">
    <p className={`chk-status chk-${note.status}`}>{STATUS_LABEL[note.status]}</p>
    <h2>Editor's note</h2>
    <h3>What the check mark asked</h3>
    <p>{markRequest(note.was)}</p>
    {changed && note.before && <><h3>What the text said</h3><p className="chk-before">{note.before}</p></>}
    {(changed || !note.before) && note.after && <><h3>What it says now</h3><p>{note.after}</p></>}
    {!changed && note.before && <><h3>The words checked</h3><p>{note.before}</p></>}
    <h3>{note.status === "open" ? "What is still needed" : "What was found"}</h3>
    <p>{note.note}</p>
    {note.fieldEdits?.map(edit => <p key={edit.path} className="chk-edit">Changed {edit.path.replace(/^\./, "")}: {String(edit.from)} → {String(edit.to)}</p>)}
  </div>;
}

function CheckNoteSheet() {
  const state = useCheckNotes();
  const note = state?.openId ? state.notes.get(state.openId) ?? null : null;
  const close = state?.closeNote;
  useEffect(() => {
    if (!note || !close) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [note, close]);
  if (!SHOW_CHECK_NOTES || !state) return null;
  return <SlidePanel open={Boolean(note)} onClose={state.closeNote} label="Editor's note" closeLabel="Close this note" className="chk-panel">
    {note && <NoteBody note={note} />}
  </SlidePanel>;
}
