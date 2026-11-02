// Reading a file for the first time costs this PC about 2.6 ms from the USB disk one at a time, and 0.3-0.5 ms with
// several threads, so a long sequential read first gets the files into Windows's memory this way. It only reads.
import fs from 'node:fs';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';

const THREADS = 16;

export function readAhead(files) {
  const workers = Array.from({ length: THREADS }, (_, index) => new Promise((resolve, reject) => {
    const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { readFiles: files.filter((_, at) => at % THREADS === index) } });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', (code) => reject(new Error(`A read-ahead thread stopped early (exit code ${code}).`)));
  }));
  return Promise.all(workers);
}

if (!isMainThread && workerData?.readFiles) {
  for (const file of workerData.readFiles) fs.readFileSync(file);
  parentPort.postMessage(workerData.readFiles.length);
}
