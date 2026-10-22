// Runs one test for a page option: the questions one at a time through a view, then the results.
import type { ComponentType, ReactNode } from "react";
import type { QuestionBank } from "@/lib/data";
import { useTestKeys, useTestStage } from "./controls";
import type { Facets, Filters } from "../model";
import { useRun, type Item, type Result, type Run, type TestQuestion } from "./engine";
import { TestResults } from "./TestResults";

export interface ViewProps { run: Run; bookNames: Record<string, string>; kinds: Record<string, string> }

/** Everything a whole-page option needs: the settings and their counts, and the questions drawn for every option. */
export interface OptionProps {
  bank: QuestionBank;
  pool: TestQuestion[];
  facets: Facets;
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  length: number;
  setLength: (n: number) => void;
  items: Item[];
  /** The settings without the chapter, for the book and chapter charts (`facets` has the chapter and the theme). */
  bookFacets: Facets;
  /** The questions each theme could draw on: the kind and other settings, without the book, chapter or theme. */
  themeRows: number[];
  theme: string;
  setTheme: (id: string) => void;
  chapter: number | null;
  setChapter: (chapter: number | null) => void;
  /** Goes up with every new draw; a test keyed on it starts over. */
  round: number;
  redraw: () => void;
  bookNames: Record<string, string>;
  active: boolean;
  backTo: string;
}

/** Holds one run of a test and hands it to `children`; the keyboard answers only while `active`. */
export function RunHost({ items, active, onFinish, children }: { items: Item[]; active: boolean; onFinish: (results: Result[]) => void; children: (run: Run) => ReactNode }) {
  const run = useRun(items, onFinish);
  useTestKeys(run, active);
  return <>{children(run)}</>;
}

/** The test through `View`, then the results in the same place; `onResults` hears every finished test. */
export function TestArea({ items, active, bank, bookNames, View, onResults }: { items: Item[]; active: boolean; bank: QuestionBank; bookNames: Record<string, string>; View: ComponentType<ViewProps>; onResults?: (results: Result[]) => void }) {
  const { stage, round, start, finish } = useTestStage(items);
  const done = (results: Result[]) => { finish(results); onResults?.(results); };
  if (stage.step === "results") return <TestResults items={stage.items} results={stage.results} topics={bank.topics} bookNames={bookNames}
    onRetake={start} onNew={() => start(items)} />;
  return <RunHost key={round} items={stage.items} active={active} onFinish={done}>
    {(run) => <View run={run} bookNames={bookNames} kinds={bank.kinds} />}
  </RunHost>;
}
