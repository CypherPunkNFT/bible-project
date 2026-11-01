// Brings dist/ up to date file by file, so a build copies only what changed and never has to rename dist/,
// which Windows refuses while the preview on 8931 or anything else holds it open.
import fs from 'node:fs';
import path from 'node:path';

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const LOCK_WAIT_MS = 15 * 60 * 1000;

function retryWhileHeld(action, what) {
  for (let attempt = 1; ; attempt++) {
    try { return action(); } catch (error) {
      if (attempt >= 40 || !['EPERM', 'EBUSY', 'EACCES'].includes(error.code)) throw new Error(`dist mirror: could not ${what} (${error.code}, attempt ${attempt})`, { cause: error });
      pause(250);
    }
  }
}

function processIsAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
}

/** Waits for other builds to finish with dist/. Returns false when this process already holds the lock, so the outer holder releases it. */
export function acquireDistLock(root) {
  const lock = path.join(root, '.dist-lock'), deadline = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
      process.once('exit', () => releaseDistLock(root));
      return true;
    } catch (error) {
      if (error.code !== 'EEXIST') throw new Error(`dist lock: could not create ${lock} (${error.code})`, { cause: error });
    }
    const holder = Number(fs.readFileSync(lock, 'utf8'));
    if (holder === process.pid) return false;
    if (holder && !processIsAlive(holder)) { fs.rmSync(lock, { force: true }); continue; }
    if (Date.now() > deadline) throw new Error(`dist lock: process ${holder} still holds ${lock} after ${LOCK_WAIT_MS / 60000} minutes`);
    pause(1000);
  }
}

export function releaseDistLock(root) {
  const lock = path.join(root, '.dist-lock');
  if (fs.existsSync(lock) && Number(fs.readFileSync(lock, 'utf8')) === process.pid) fs.rmSync(lock, { force: true });
}

function listFiles(root) {
  const files = new Map();
  if (!fs.existsSync(root)) return files;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() || (entry.isSymbolicLink() && fs.statSync(full).isDirectory())) walk(full);
      else files.set(path.relative(root, full), full);
    }
  };
  walk(root);
  return files;
}

function needsCopy(source, target) {
  if (!fs.existsSync(target)) return true;
  const from = fs.statSync(source), to = fs.statSync(target);
  return from.size !== to.size || from.mtimeMs > to.mtimeMs;
}

/** dist/ becomes public/ plus the finished build, with the build winning. The page shell goes last so it never names a file not yet there. */
export function mirrorIntoDist({ publicDir, stage, dist }) {
  if (!fs.existsSync(path.join(stage, 'index.html'))) throw new Error(`dist mirror: ${stage} has no index.html; dist/ left as it was`);
  const sources = new Map([...listFiles(publicDir), ...listFiles(stage)]);
  const shell = path.normalize('index.html');
  const ordered = [...sources.keys()].filter((name) => name !== shell).concat(shell);
  let copied = 0, removed = 0;
  for (const name of ordered) {
    const source = sources.get(name), target = path.join(dist, name);
    if (!needsCopy(source, target)) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    retryWhileHeld(() => fs.copyFileSync(source, target), `copy ${source} to ${target}`);
    copied++;
  }
  for (const [name, target] of listFiles(dist)) {
    if (sources.has(name)) continue;
    retryWhileHeld(() => fs.rmSync(target, { force: true }), `remove ${target}`);
    removed++;
  }
  return { copied, removed, total: sources.size };
}
