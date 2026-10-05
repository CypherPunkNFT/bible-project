import { existsSync, lstatSync } from "node:fs";
import path from "node:path";

/** Never follow a linked directory when replacing generated files or writing review packets. */
export function assertOrdinaryPath(root: string, target: string) {
  const base = path.resolve(root), relative = path.relative(base, path.resolve(target));
  if (!relative || relative.startsWith(".." + path.sep) || relative === ".." || path.isAbsolute(relative)) throw new Error("Output must stay inside its intended directory.");
  let current = base;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error(`Linked output paths are not allowed: ${current}`);
  }
}
