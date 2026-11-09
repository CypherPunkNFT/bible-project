export interface Statement {
  id: string; who: string; kind: 'truth' | 'lie'; text: string;
  refs: [number, number][]; check: string; topic: string; origin: string;
  truth?: string; swap?: string; swapIn?: string; clash?: string[]; retired?: boolean; reviewed?: boolean;
}
export interface Person { id: string; label: string; tag: string; href: string; testament: 'old' | 'new' }
export interface Deck { stamp: string; people: Person[]; statements: Statement[]; triples?: Record<string, string[][]> }
export interface Round { who: string; ids: string[]; pick: string | null; revealed: boolean; awards: boolean[] }
export interface Recent { people: string[]; statements: string[] }
export interface Run { id: string; stamp: string; mode: 'solo' | 'group'; teams: string[]; rounds: Round[]; over: boolean; recorded: boolean }
