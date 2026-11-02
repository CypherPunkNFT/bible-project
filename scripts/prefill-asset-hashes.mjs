// Before an upload, works out wrangler's fingerprint of every new or changed file on several threads and leaves them in the
// memory scripts/wrangler-fast-assets.cjs reads (.asset-hashes.json, beside site/), so wrangler itself reads almost nothing.
// Same sum as wrangler's own hashFile; a file changed afterwards no longer matches its stamp, and wrangler reads it.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

const THREADS = 16;
// The sum below is a copy of wrangler's. Read this version's hashFile again before adding another here.
const CHECKED_WRANGLER = '4.147.0';
const stampOf = (stat) => `${stat.size}:${stat.mtimeMs}`;

/** What wrangler 4.147.0 computes for an asset (hashFile in wrangler-dist/cli.js). */
export function assetHash(blake3, file) {
  const base64 = fs.readFileSync(file).toString('base64');
  return blake3.hash(base64 + path.extname(file).substring(1)).toString('hex').slice(0, 32);
}

function hashOnThread(files, wrangler) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { hashFiles: files, wrangler } });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => reject(new Error(`A fingerprint thread stopped early (exit code ${code}).`)));
  });
}

/** Returns how many files the memory already knew and how many were fingerprinted now. */
export async function prefillAssetHashes(packageDir, wrangler) {
  const version = createRequire(wrangler)('../package.json').version;
  if (version !== CHECKED_WRANGLER) return { skipped: `wrangler is ${version}, this was checked against ${CHECKED_WRANGLER}; it will read every file itself` };
  const memoryFile = path.join(packageDir, '.asset-hashes.json'), site = path.join(packageDir, 'site');
  const memory = fs.existsSync(memoryFile) ? JSON.parse(fs.readFileSync(memoryFile, 'utf8')) : {};
  const keyOf = (file) => path.relative(packageDir, file).split(path.sep).join('/');
  const files = fs.readdirSync(site, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => path.join(entry.parentPath, entry.name));
  const todo = files.filter((file) => memory[keyOf(file)]?.stamp !== stampOf(fs.statSync(file)));
  if (!todo.length) return { known: files.length, read: 0 };
  const parts = await Promise.all(Array.from({ length: THREADS }, (_, index) => hashOnThread(todo.filter((_, at) => at % THREADS === index), wrangler)));
  for (const part of parts) for (const [file, entry] of part) memory[keyOf(file)] = entry;
  const temporary = `${memoryFile}.${process.pid}`;
  fs.writeFileSync(temporary, JSON.stringify(memory));
  fs.renameSync(temporary, memoryFile);
  return { known: files.length - todo.length, read: todo.length };
}

if (!isMainThread && workerData?.hashFiles) {
  const blake3 = createRequire(workerData.wrangler)('blake3-wasm');
  // The stamp is taken first: a file that changes during its reading then fails the check and gets read again.
  // A file that cannot be read is left out, so wrangler meets it and reports the real error.
  parentPort.postMessage(workerData.hashFiles.flatMap((file) => {
    try {
      const stamp = stampOf(fs.statSync(file));
      return [[file, { stamp, hash: assetHash(blake3, file) }]];
    } catch (error) {
      console.warn(`Could not fingerprint ${file} in advance: ${error.message}`);
      return [];
    }
  }));
}
