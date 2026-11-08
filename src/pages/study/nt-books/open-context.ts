// How a part of the page opens the sheet: a reference's verses, or a witness's record. NtBooksPage provides it.
import { createContext } from "react";

export const OpenContext = createContext<{ openVerse: (key: string) => void; openWitness: (id: string) => void } | null>(null);
