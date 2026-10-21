export const TEXT_CHUNK: number;
export const XREF_CHUNK: number;
export function packReaderData(site: string): {
  text: { before: number; after: number };
  xref: { before: number; after: number };
  stamp: string;
  stampedFiles: number;
};
