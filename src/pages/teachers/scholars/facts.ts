import type { Era, Faith, Field } from '@/data/teachers/pages-types';

/** Attribution evidence, not a claim that each source credit is a distinct scholar. */
export interface ContributorFact {
  kind: 'person' | 'person-candidate' | 'organization-candidate' | 'unresolved';
  dates: {
    status: 'documented-profile' | 'source-supported' | 'conflicting' | 'needs-review' | 'missing';
    era: Era | null;
    born?: number;
    died?: number | null;
    floruit?: number;
    basis?: string;
    evidence: { label: string; workId: string; field: string; sourceUrl?: string; parsed: unknown }[];
    legacyLabels?: string[];
  };
  expertise: Field[];
  expertiseBasis: string;
  subjects: Partial<Record<Field, { basis: string; workId?: string | null }>>;
  faith: Faith | null;
  recordedTraditions: string[];
  collections: string[];
  sourceContributorIds: string[];
  identityReview?: boolean;
}

export interface ContributorFacts {
  schemaVersion: 1;
  inputs: Record<string, string>;
  summary: {
    catalogueEntries: number;
    sourceContributors: number;
    documentedProfiles: number;
    dateStatus: Record<ContributorFact['dates']['status'], number>;
    eras: Record<Era | 'unknown', number>;
    kinds: Record<ContributorFact['kind'], number>;
    subjectCounts: Record<Field, number>;
    expertiseCounts: Record<Field, number>;
    identityReviewEntries: number;
  };
  entries: Record<string, ContributorFact>;
}

// Shared selectors for the staged section upgrades. Unknown is always retained.
export const contributorEra = (fact?: ContributorFact): Era | 'unknown' => fact?.dates.era ?? 'unknown';
export const contributorSubjects = (fact?: ContributorFact): Field[] => Object.keys(fact?.subjects ?? {}) as Field[];
