type Split = { skipped: string } | Record<string, number>;
export function ownFolder(site: string, relative: string, file: string): string;
export function splitReleaseFiles(site: string): { scholarIndex: Split; sourceDirectory: Split };
