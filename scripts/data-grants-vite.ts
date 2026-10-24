// The grant research desk, on the local preview only (8931): every funder, deadline, partner and listing in the
// owner's grant research, read straight from the markdown files.
//   /data_grants/                      the page        (analysis-desk/grants.html, .css, .js, grants-render.js)
//   /data_grants/api/research.json     the research    ({stale, error, research}; research is what
//                                                       scripts/build-grant-research.py prints)
// The research is rebuilt in memory whenever a research file, the builder or the Grants Dashboard parser changes,
// so the page is never older than the files. Read-only: nothing here writes a file. Like /data_analysis/, none of
// this is in dist/ or the deployed site.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream';
import type { Connect, Plugin } from 'vite';
import { allowedLocalLibraryRequest } from './local-library-vite';

type Response = Parameters<Connect.NextHandleFunction>[1];
type Built = { signature: string; body: string };
type Failure = { signature: string; at: number; message: string };
export type GrantsOptions = {
  projects?: string;  // Jarvis/Projects
  dashboard?: string; // Websites/GrantsDashboard
  python?: string;
  builder?: string;
  timeoutMs?: number;
  retryAfterMs?: number;
};

const PAGE_FILES: Record<string, [string, string]> = {
  '/data_grants/': ['grants.html', 'text/html; charset=utf-8'],
  '/data_grants/index.html': ['grants.html', 'text/html; charset=utf-8'],
  '/data_grants/grants.css': ['grants.css', 'text/css; charset=utf-8'],
  '/data_grants/grants.js': ['grants.js', 'text/javascript; charset=utf-8'],
  '/data_grants/grants-render.js': ['grants-render.js', 'text/javascript; charset=utf-8'],
};
const SOURCE_FOLDERS = ['RedeemerForgeInc/Grants', 'BibleProject/AppDevelopment/Grants', 'RedeemerForgeInc/Legal/Formation'];
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'";
const MAX_OUTPUT = 32 * 1024 * 1024;

function json(response: Response, status: number, body: string): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(body);
}

/** Every file whose change should change the page: research markdown, the builder, the parser. */
function signatureOf(folders: string[], files: string[], dashboardCode: string): string {
  const parts: string[] = [];
  const add = (file: string) => {
    try { const stat = fs.statSync(file); parts.push(`${file}|${stat.size}|${stat.mtimeMs}`); } catch { parts.push(`${file}|missing`); }
  };
  for (const folder of folders) {
    let names: string[] = [];
    try { names = fs.readdirSync(folder).filter((name) => name.toLowerCase().endsWith('.md')); } catch { parts.push(`${folder}|missing`); }
    for (const name of names.sort()) add(path.join(folder, name));
  }
  files.forEach(add);
  try { fs.readdirSync(dashboardCode).filter((name) => name.endsWith('.py')).sort().forEach((name) => add(path.join(dashboardCode, name))); } catch { parts.push(`${dashboardCode}|missing`); }
  return parts.join('\n');
}

function killTree(pid: number | undefined): void {
  if (!pid) return;
  // The venv's python.exe is a launcher that starts the real interpreter as its child; stop both.
  if (process.platform === 'win32') spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }).on('error', () => {});
  else { try { process.kill(pid); } catch { /* already gone */ } }
}

export function dataGrantsPlugin(siteRoot: string, options: GrantsOptions = {}): Plugin {
  const site = path.resolve(siteRoot);
  const pages = path.join(site, 'analysis-desk');
  const projects = path.resolve(options.projects ?? path.join(site, '..', '..'));
  const dashboard = path.resolve(options.dashboard ?? path.join(projects, 'Websites', 'GrantsDashboard'));
  const python = options.python ?? path.join(site, '..', 'KnowledgeBase', '.venv', 'Scripts', 'python.exe');
  const builder = options.builder ?? path.join(site, 'scripts', 'build-grant-research.py');
  const timeoutMs = options.timeoutMs ?? 30000;
  const retryAfterMs = options.retryAfterMs ?? 60000;
  const folders = SOURCE_FOLDERS.map((folder) => path.join(projects, folder));
  let built: Built | undefined;
  let failure: Failure | undefined;
  let running: Promise<void> | undefined;

  /** One build at a time, never tied to a single request, so a closed tab cannot stop it. */
  function rebuild(signature: string): Promise<void> {
    running ??= new Promise<void>((resolve) => {
      const env: Record<string, string> = {};
      for (const key of ['SystemRoot', 'SYSTEMROOT', 'TEMP', 'TMP', 'PATH', 'Path']) if (process.env[key]) env[key] = process.env[key] as string;
      const child = spawn(python, ['-I', '-B', '-X', 'utf8', builder, '--projects', projects, '--dashboard', dashboard],
        { cwd: site, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      const out: Buffer[] = [];
      let size = 0, stderr = '', settled = false;
      const finish = (message?: string, body?: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (body !== undefined) { built = { signature, body }; failure = undefined; }
        else {
          failure = { signature, at: Date.now(), message: message ?? 'The grant research could not be read.' };
          console.error(`grant research: ${failure.message}${stderr ? `\n${stderr}` : ''}`);
        }
        running = undefined;
        resolve();
      };
      const timer = setTimeout(() => { killTree(child.pid); finish(`Reading the research took longer than ${timeoutMs / 1000} seconds.`); }, timeoutMs);
      child.stdout.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_OUTPUT) { killTree(child.pid); finish('The research is larger than this page can hold.'); return; }
        out.push(chunk);
      });
      child.stderr.on('data', (chunk: Buffer) => { if (stderr.length < 8000) stderr += chunk.toString(); });
      child.on('error', (error) => finish(`The research reader could not start (${(error as NodeJS.ErrnoException).code ?? 'error'}).`));
      child.on('close', (code) => {
        if (settled) return;
        const body = Buffer.concat(out).toString('utf8');
        if (code === 0) {
          try { if (typeof JSON.parse(body) === 'object') { finish(undefined, body); return; } } catch { /* reported below */ }
          finish('The research reader returned something that is not the research.');
          return;
        }
        // Only the builder's own last line reaches the page; a traceback stays in the preview's console.
        const last = stderr.trim().split(/\r?\n/).pop() ?? '';
        finish(last.startsWith('grant research: ') ? last.slice('grant research: '.length) : `The research reader stopped (exit ${code}).`);
      });
    });
    return running;
  }

  async function research(): Promise<{ status: number; body: string }> {
    const signature = signatureOf(folders, [builder], path.join(dashboard, 'dashboard'));
    const failedRecently = failure && failure.signature === signature && Date.now() - failure.at < retryAfterMs;
    // A reading takes well under a second, so the page waits for it; after a failure the last good copy is
    // served, marked stale, and the files are not read again for retryAfterMs unless they change.
    if (built?.signature !== signature && !failedRecently) await rebuild(signature);
    if (!built) return { status: 503, body: JSON.stringify({ error: failure?.message ?? 'The grant research is not read yet.' }) };
    const stale = built.signature !== signature;
    const error = stale && failure?.signature === signature ? failure.message : null;
    return { status: 200, body: `{"stale":${stale},"error":${JSON.stringify(error)},"research":${built.body}}` };
  }

  function sendFile(request: Connect.IncomingMessage, response: Response, file: string, type: string): void {
    response.setHeader('Content-Type', type);
    if (type.startsWith('text/html')) response.setHeader('Content-Security-Policy', CSP);
    if (request.method === 'HEAD') { response.end(); return; }
    pipeline(fs.createReadStream(file), response, (error) => {
      if (error && error.code !== 'ERR_STREAM_PREMATURE_CLOSE') console.error(`grant research: could not send ${file}`, error);
    });
  }

  const handle: Connect.NextHandleFunction = (request, response, next) => {
    const url = (request.url ?? '').split('?')[0];
    if (url !== '/data_grants' && !url.startsWith('/data_grants/')) return next();
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    if (!allowedLocalLibraryRequest(request)) { response.statusCode = 403; response.end('Available only through the local preview.'); return; }
    if (url === '/data_grants') { response.statusCode = 302; response.setHeader('Location', '/data_grants/'); response.end(); return; }
    if (url === '/data_grants/api/research.json') {
      if (request.method === 'HEAD') { response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.end(); return; }
      research().then((result) => json(response, result.status, result.body), (error: Error) => {
        console.error('grant research: could not answer', error);
        json(response, 503, JSON.stringify({ error: 'The grant research could not be read.' }));
      });
      return;
    }
    const page = PAGE_FILES[url];
    if (!page) { response.statusCode = 404; response.setHeader('Content-Type', 'text/plain; charset=utf-8'); response.end(`not found: ${url}`); return; }
    sendFile(request, response, path.join(pages, page[0]), page[1]);
  };

  return {
    name: 'data-grants',
    configureServer(server) { server.middlewares.use(handle); },
    configurePreviewServer(server) { server.middlewares.use(handle); },
  };
}
