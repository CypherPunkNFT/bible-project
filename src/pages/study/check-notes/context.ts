// The open check note and a study's notes, shared by <CheckNotesProvider>, <Checked> and the note sheet.
import { createContext, useContext } from "react";
import type { CheckNote } from "./checked";

export interface CheckNotesState {
  notes: Map<string, CheckNote>;
  openId: string | null;
  openNote: (id: string) => void;
  closeNote: () => void;
}

export const CheckNotesContext = createContext<CheckNotesState | null>(null);

/** The study's check notes; a page calls closeNote() when it opens a sheet of its own. Null outside a provider. */
export const useCheckNotes = (): CheckNotesState | null => useContext(CheckNotesContext);
