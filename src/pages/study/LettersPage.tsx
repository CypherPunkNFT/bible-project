import { LettersBrowse } from "@/components/letters/browse/LettersBrowse";

/**
 * The New Testament letters (Study → Letters): a home of four collections and four ways in across all twenty-one,
 * each a page of cards opening section pages. Built from the sourced research in BibleProject/Research/Letters/
 * (data in src/data/letters/, components in src/components/letters/browse/).
 */
export default function LettersPage() {
  return <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6"><LettersBrowse /></div>;
}
