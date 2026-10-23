// The question explorer, on the local preview only (8931): every quiz question, its check, and a rapid test run.
//   /data_questions/                    the page            (analysis-desk/questions.html, .css, .js)
//   /data_questions/api/questions.json  the questions       (.local/question-explorer/questions.json, written by
//                                                             scripts/build-question-bank.py)
//   /data_questions/api/flags           the owner's flags   (content/questions/flags.json, for the next chat to fix)
//   POST /data_questions/api/flag       save or remove one flag {id, note, remove?}
// Like /data_analysis/, none of this is in dist/ or the deployed site.
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream';
import type { Connect, Plugin } from 'vite';
import { allowedLocalLibraryRequest } from './local-library-vite';

type Response = Parameters<Connect.NextHandleFunction>[1];
type Snapshot = Record<string, unknown>;
type Flags = { about: string; flags: Record<string, Snapshot> };

const PAGE_FILES: Record<string, [string, string]> = {
  '/data_questions/': ['questions.html', 'text/html; charset=utf-8'],
  '/data_questions/index.html': ['questions.html', 'text/html; charset=utf-8'],
  '/data_questions/questions.css': ['questions.css', 'text/css; charset=utf-8'],
  '/data_questions/questions.js': ['questions.js', 'text/javascript; charset=utf-8'],
};
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'";
const ABOUT = 'Questions the owner flagged while test-taking on the local question explorer (/data_questions/). Each is keyed by '
  + 'question id, with the note and the wording as it was shown. Fix the question at its source, then remove the flag.';
const MAX_BODY = 8000;
const MAX_NOTE = 1000;

function json(response: Response, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export function dataQuestionsPlugin(siteRoot: string): Plugin {
  const site = path.resolve(siteRoot);
  const pages = path.join(site, 'analysis-desk');
  const dataFile = path.join(site, '.local', 'question-explorer', 'questions.json');
  const flagsFile = path.join(site, 'content', 'questions', 'flags.json');
  let cache: { stamp: number; byId: Map<string, Snapshot> } | undefined;
  let writing = false;

  /** The built questions by id, re-read when the build rewrites the file; a half-read file keeps the last good copy. */
  function questions(): Map<string, Snapshot> | undefined {
    let stamp: number;
    try { stamp = fs.statSync(dataFile).mtimeMs; } catch { return cache?.byId; }
    if (cache?.stamp === stamp) return cache.byId;
    try {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8')) as { columns: string[]; rows: unknown[][] };
      const byId = new Map<string, Snapshot>();
      for (const row of data.rows) {
        const q = Object.fromEntries(data.columns.map((c, i) => [c, row[i]]));
        byId.set(String(q.id), q);
      }
      cache = { stamp, byId };
    } catch (error) {
      console.error(`question explorer: could not read ${dataFile}; keeping the last good copy`, error);
    }
    return cache?.byId;
  }

  /** Always from disk, so a flag another chat removed or edited is never written back. */
  function readFlags(): Flags {
    if (!fs.existsSync(flagsFile)) return { about: ABOUT, flags: {} };
    const data = JSON.parse(fs.readFileSync(flagsFile, 'utf8')) as Flags;
    if (!data || typeof data.flags !== 'object' || Array.isArray(data.flags)) throw Error(`${flagsFile} has no "flags" object`);
    return data;
  }

  function writeFlags(data: Flags): void {
    const temporary = `${flagsFile}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(data, null, 1) + '\n', 'utf8');
    try { fs.renameSync(temporary, flagsFile); } catch (error) { fs.rmSync(temporary, { force: true }); throw error; }
  }

  function saveFlag(input: Record<string, unknown>): { status: number; body: unknown } {
    const id = input.id, note = input.note ?? '', remove = input.remove === true;
    if (typeof id !== 'string' || typeof note !== 'string' || note.length > MAX_NOTE) {
      return { status: 400, body: { error: `A flag needs a question id and a note of at most ${MAX_NOTE} characters.` } };
    }
    const byId = questions();
    if (!byId) return { status: 503, body: { error: 'The questions are not built yet: run python scripts/build-question-bank.py.' } };
    const q = byId.get(id);
    if (!q) return { status: 404, body: { error: `No question with id ${JSON.stringify(id).slice(0, 120)} in the last build.` } };
    const data = readFlags();
    if (remove) delete data.flags[id];
    else {
      data.flags[id] = {
        note: note.trim(), flagged: new Date().toISOString(), status: q.status, collection: q.collection,
        question: q.question, answer: q.answer, right: q.right, options: q.options, reference: q.reference,
      };
    }
    writeFlags(data);
    return { status: 200, body: { saved: !remove, removed: remove, id, count: Object.keys(data.flags).length } };
  }

  function sendFile(request: Connect.IncomingMessage, response: Response, file: string, type: string): void {
    response.setHeader('Content-Type', type);
    if (type.startsWith('text/html')) response.setHeader('Content-Security-Policy', CSP);
    if (request.method === 'HEAD') { response.end(); return; }
    pipeline(fs.createReadStream(file), response, (error) => {
      if (error && error.code !== 'ERR_STREAM_PREMATURE_CLOSE') console.error(`question explorer: could not send ${file}`, error);
    });
  }

  const handle: Connect.NextHandleFunction = (request, response, next) => {
    const url = (request.url ?? '').split('?')[0];
    if (url !== '/data_questions' && !url.startsWith('/data_questions/')) return next();
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    if (url === '/data_questions/api/flag') {
      const post = request.method === 'POST';
      const allowed = allowedLocalLibraryRequest({ headers: request.headers, method: 'GET', socket: request.socket });
      if (!post || !allowed || request.headers.origin !== `http://${request.headers.host}`
        || !String(request.headers['content-type'] ?? '').startsWith('application/json')) {
        json(response, 403, { error: 'Flags are saved only by POST from this local page, same origin, as JSON.' });
        return;
      }
      if (writing) { json(response, 409, { error: 'Another flag is being saved. Nothing was changed; try again.' }); return; }
      let body = '';
      request.on('data', (chunk) => {
        body += chunk.toString();
        if (body.length > MAX_BODY) { json(response, 413, { error: 'The flag is too large.' }); request.destroy(); }
      });
      request.on('end', () => {
        if (response.writableEnded) return;
        let input: unknown;
        try { input = JSON.parse(body); } catch { json(response, 400, { error: 'The flag is not valid JSON.' }); return; }
        if (!input || typeof input !== 'object' || Array.isArray(input)
          || Object.keys(input).some((k) => !['id', 'note', 'remove'].includes(k))) {
          json(response, 400, { error: 'A flag has only id, note and remove.' });
          return;
        }
        writing = true;
        try {
          const result = saveFlag(input as Record<string, unknown>);
          json(response, result.status, result.body);
        } catch (error) {
          console.error('question explorer: could not save a flag', error);
          json(response, 503, { error: `The flag could not be saved: ${(error as Error).message}` });
        } finally { writing = false; }
      });
      return;
    }

    if (!allowedLocalLibraryRequest(request)) { response.statusCode = 403; response.end('Available only through the local preview.'); return; }
    if (url === '/data_questions') { response.statusCode = 302; response.setHeader('Location', '/data_questions/'); response.end(); return; }
    if (url === '/data_questions/api/flags') {
      try { json(response, 200, readFlags()); } catch (error) { json(response, 503, { error: (error as Error).message }); }
      return;
    }
    if (url === '/data_questions/api/questions.json') {
      if (!fs.existsSync(dataFile)) { json(response, 404, { error: 'The questions are not built yet: run python scripts/build-question-bank.py.' }); return; }
      sendFile(request, response, dataFile, 'application/json; charset=utf-8');
      return;
    }
    const page = PAGE_FILES[url];
    if (!page) { response.statusCode = 404; response.setHeader('Content-Type', 'text/plain; charset=utf-8'); response.end(`not found: ${url}`); return; }
    sendFile(request, response, path.join(pages, page[0]), page[1]);
  };

  return {
    name: 'data-questions',
    configureServer(server) { server.middlewares.use(handle); },
    configurePreviewServer(server) { server.middlewares.use(handle); },
  };
}
