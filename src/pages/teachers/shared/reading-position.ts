/** Manual reader positions are one-based in URLs and zero-based in page requests. */
export function readingPosition(value: string | null, pages: number): { page: number; message: string } {
  if (value === null) return { page: 0, message: "" };
  const requested = /^[1-9]\d*$/.test(value) ? Number(value) : NaN;
  if (Number.isSafeInteger(requested) && requested <= pages) return { page: requested - 1, message: "" };
  return { page: 0, message: `This reading page is unavailable. Enter a whole page number from 1 to ${pages}. Showing reading page 1.` };
}
