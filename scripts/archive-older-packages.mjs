import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs';
import path from 'node:path';

// Each package is about 6 GB and Cloudflare's version history is the way back, so older ones leave once this one is live.
// Newer ones stay: another chat may have prepared one and not released it yet. Rename only: never a copy, never a delete.
export function archiveOlderPackages(current, archive) {
  const parent = path.dirname(current), moved = [];
  if (path.basename(parent) !== '.release') return moved;
  const cutoff = statSync(current).birthtimeMs, tree = path.basename(path.dirname(parent));
  for (const name of readdirSync(parent)) {
    const older = path.join(parent, name);
    if (older === current || statSync(older).birthtimeMs >= cutoff) continue;
    const target = path.join(archive, `${tree}__${name}`);
    try {
      mkdirSync(archive, { recursive: true });
      if (existsSync(target)) throw new Error('already in the archive');
      renameSync(older, target);
      moved.push(name);
      console.log(`Moved the older package ${name} to ${target}`);
    } catch (error) {
      console.warn(`Could not move the older package ${older} to ${target}: ${error.code ?? error.message}`);
    }
  }
  return moved;
}
