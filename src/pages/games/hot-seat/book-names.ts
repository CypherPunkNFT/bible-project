// Hot seat: the question bank's book list as a React context, so a reference anywhere in the game can write its book
// out in full ("1 Samuel 16:11", not "1 Sam 16:11"). The page provides it; Reference.tsx reads it.
import { createContext } from "react";

/** Book code ("GEN", "1SA") to its full name, from the question bank's book list. */
export const BookNames = createContext<Readonly<Record<string, string>>>({});
