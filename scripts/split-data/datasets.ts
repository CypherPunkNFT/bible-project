// The data sets scripts/split-data.ts cuts into small files (src/lib/split-data.ts). To add one: describe its rows and
// layers here, read it on the page through the manifest, and give its page an entry in data-budgets.json.
import type { Dataset } from "./engine.ts";

type Row = Record<string, unknown>;
const dates = (row: Row) => ((row.facts as Row | undefined)?.dates ?? {}) as Row;

/** The Scholars population (scripts/reconcile-scholar-population.py, 9,111 contributors, 23 MB): the page's opening
 *  draws only the timeline of supported birth years (eligibleBirth in src/pages/teachers/scholars/population.ts), so
 *  those rows go first. The list layer keeps everything the cards, filters, sort, directory, numbers, timelines and
 *  table rows read; the work titles (shown on cards, 0.7 MB compressed) come with the whole list; the search text of
 *  every work title (6 MB) only once someone searches; the rest (sources, evidence, join basis, example ids) only when
 *  a record is opened. */
const scholars: Dataset = {
  name: "scholars",
  source: "public/content/scholar-population/index.json",
  rows: (source) => source.entries as Row[],
  id: (row) => row.id as string,
  head: (source) => ({ schemaVersion: source.schemaVersion, builtAt: source.builtAt, summary: source.summary, factSummary: source.factSummary }),
  extra: (source) => ({ sourceCredits: source.sourceCredits, reconciliation: source.reconciliation }),
  opening: (row) => ["documented-profile", "source-supported"].includes(dates(row).status as string) && Number.isFinite(dates(row).born),
  layers: {
    list: {
      id: 1, name: 1, profileId: 1, aliases: 1, verifiedAliases: 1, contributorIds: 1, roles: 1, traditions: 1, collections: 1,
      records: 1, readable: 1, supplements: 1, sourceLifeDates: 1, addedFrom: 1, counts: 1, profileAvailability: 1,
      fields: { "*": { count: 1 } },
      identity: { status: 1, entityType: 1, reviewRequired: 1, candidateIds: 1 },
      facts: { kind: 1, faith: 1, expertise: 1, expertiseBasis: 1, collections: 1, recordedTraditions: 1, sourceContributorIds: 1,
        dates: { status: 1, era: 1, born: 1, died: 1, floruit: 1, approximate: 1, sourceConflict: 1, basis: 1 } },
    },
    titles: { fields: { "*": { example: { title: 1 } } } },
    search: { searchText: 1 },
  },
  detailShards: 64,
};

export const DATASETS: Dataset[] = [scholars];
