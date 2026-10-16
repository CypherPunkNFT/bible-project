/** Josephus is retained for the Scholars collection, not used in general reading material. */
export function isScholarsOnlySource(text: string): boolean {
  return /\bjosephus\b|gutenberg\.org\/ebooks\/2848\b/i.test(text);
}
