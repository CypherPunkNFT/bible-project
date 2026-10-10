import fs from "node:fs";
import path from "node:path";

export interface AcquiredProfile {
  id: string; profileId: string; side: string; records: number; readable: number;
  titles: string[]; titleRoutes: Record<string, string>;
}
export function acquiredInput(site: string): { addresses: Record<string, string>; contributors: AcquiredProfile[] } {
  const file = path.join(site, ".local/teacher-library/teacher-input.json");
  if (!fs.existsSync(file)) throw new Error("Run scripts/build-acquired-teachers.py before building Teachers pages.");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
