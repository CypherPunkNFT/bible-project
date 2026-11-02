// Loaded into wrangler (NODE_OPTIONS --require, see deploy-worker.mjs) so a release spends its time only on what changed. Before any
// upload, wrangler took 188 seconds on this site; with these two changes, 7.
// 1. It wrote a debug-log line per file, in sequence. That line is removed; everything else still logs.
// 2. It read and fingerprinted all 7.9 GB every time (32 seconds). Its own fingerprinting code still runs for any new or changed file; a
//    file with the same size and modified time keeps the fingerprint it had. The memory is .asset-hashes.json in the release directory,
//    beside site/ so it is never uploaded.
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');

const MEMORY = path.resolve('.asset-hashes.json');
const WRANGLER_CLI = path.join('wrangler-dist', 'cli.js');
const READ = 'const contents = fs14.readFileSync(filepath);';
const FINGERPRINT = 'return blake3Wasm.hash(base64Contents + extension2).toString("hex").slice(0, 32);';
// One debug-log write per file, each re-checking that the log folder exists: 109,000 disk operations in a row, 165 seconds.
const PER_FILE_LOG = 'assetFiles.forEach((file3) => logger.debug(`/${file3}`));';

function loadMemory() {
  try {
    return JSON.parse(fs.readFileSync(MEMORY, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    console.warn(`Could not read ${MEMORY} (${error.message}); every file will be re-read this time.`);
    return {};
  }
}

let memory = null, reused = 0, read = 0;
const keyOf = (filepath) => path.relative(process.cwd(), filepath).split(path.sep).join('/');
const stampOf = (filepath) => {
  const stat = fs.statSync(filepath);
  return `${stat.size}:${stat.mtimeMs}`;
};

/** The file's earlier fingerprint, if it has not changed since. */
globalThis.__assetHashKnown = (filepath) => {
  memory ??= loadMemory();
  const known = memory[keyOf(filepath)];
  if (!known || known.stamp !== stampOf(filepath)) return undefined;
  reused += 1;
  return known.hash;
};

globalThis.__assetHashRemember = (filepath, hash) => {
  memory ??= loadMemory();
  memory[keyOf(filepath)] = { stamp: stampOf(filepath), hash };
  read += 1;
  return hash;
};

// Written even after a failed upload: the fingerprints are true whatever happened next.
process.on('exit', () => {
  if (!read && !reused) return;
  const temporary = `${MEMORY}.${process.pid}`;
  if (read) {
    fs.writeFileSync(temporary, JSON.stringify(memory));
    fs.renameSync(temporary, MEMORY);
  }
  console.log(`Asset fingerprints: ${reused} unchanged, ${read} read.`);
});

const compile = Module.prototype._compile;
Module.prototype._compile = function compileWithMemory(content, filename) {
  if (!filename.endsWith(WRANGLER_CLI)) return compile.call(this, content, filename);
  if ([READ, FINGERPRINT, PER_FILE_LOG].some((piece) => content.split(piece).length !== 2)) {
    console.warn('This wrangler version has changed, so this release runs at full length (about 3 minutes more). Update scripts/wrangler-fast-assets.cjs.');
    return compile.call(this, content, filename);
  }
  const patched = content
    .replace(PER_FILE_LOG, () => '')
    .replace(READ, () => `const known = globalThis.__assetHashKnown(filepath); if (known) return known; ${READ}`)
    .replace(FINGERPRINT, () => `return globalThis.__assetHashRemember(filepath, blake3Wasm.hash(base64Contents + extension2).toString("hex").slice(0, 32));`);
  return compile.call(this, patched, filename);
};
