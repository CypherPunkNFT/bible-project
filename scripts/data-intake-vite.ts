// The data intake desk, on the local preview only (8931): what the download jobs fetched, file by file.
//   /data_intake/                     the cards        (intake/index.html)
//   /data_intake/<slug>/              one intake       (intake/view.html, reading intake/<slug>/catalogue.json)
//   /data_intake/files/<slug>/<path>  a downloaded file, read in place from the intake's folder (never copied)
//   /data_intake/reference_books/     the acquisition desk that used to be /data_acquisition/ (which now forwards here)
// Built by scripts/build-data-intake.py. Like /mockups/, none of this is in dist/ or the deployed site.
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream';
import type { Connect, Plugin } from 'vite';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jsonl': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.csv': 'text/plain; charset=utf-8', '.tsv': 'text/plain; charset=utf-8',
  '.xml': 'text/plain; charset=utf-8', '.log': 'text/plain; charset=utf-8', '.py': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.tif': 'image/tiff', '.tiff': 'image/tiff', '.jp2': 'image/jp2',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.flac': 'audio/flac',
};
// Downloaded pages and SVGs are shown as text, never run on this site's address.
const AS_TEXT = new Set(['.html', '.htm', '.svg', '.js', '.mjs']);
const SLUG = /^[a-z0-9_]{1,60}$/;

function notFound(response: Parameters<Connect.NextHandleFunction>[1], what: string): void {
  response.statusCode = 404;
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.end(`not found: ${what}`);
}

/** Send one file, honouring a byte range so audio can seek and long texts can be read in part. */
function send(request: Connect.IncomingMessage, response: Parameters<Connect.NextHandleFunction>[1], file: string, raw: boolean): void {
  const ext = path.extname(file).toLowerCase();
  const size = fs.statSync(file).size;
  const type = raw && AS_TEXT.has(ext) ? 'text/plain; charset=utf-8' : (TYPES[ext] ?? 'application/octet-stream');
  response.setHeader('Content-Type', type);
  response.setHeader('Accept-Ranges', 'bytes');
  response.setHeader('Cache-Control', 'no-cache');
  if (raw) response.setHeader('X-Content-Type-Options', 'nosniff');
  let start = 0, end = size - 1;
  const range = /^bytes=(\d*)-(\d*)$/.exec(String(request.headers.range ?? ''));
  if (range && size > 0) {
    start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) { response.statusCode = 416; response.setHeader('Content-Range', `bytes */${size}`); response.end(); return; }
    response.statusCode = 206;
    response.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
  }
  response.setHeader('Content-Length', size === 0 ? 0 : end - start + 1);
  if (request.method === 'HEAD' || size === 0) { response.end(); return; }
  pipeline(fs.createReadStream(file, { start, end }), response, (error) => {
    if (error && error.code !== 'ERR_STREAM_PREMATURE_CLOSE') console.error(`data intake: could not send ${file}`, error);
  });
}

export function dataIntakePlugin(siteRoot: string): Plugin {
  const site = path.resolve(siteRoot);
  const pages = path.join(site, 'intake');
  const project = path.resolve(site, '..');
  const referenceDirs = [path.join(site, 'dist', 'data_acquisition'), path.join(site, 'public', 'data_acquisition')];

  /** The folder an intake was downloaded into, as its catalogue records it, kept inside the project. */
  function intakeFolder(slug: string): string | null {
    const catalogue = path.join(pages, slug, 'catalogue.json');
    if (!fs.existsSync(catalogue)) return null;
    const folder = path.resolve(project, JSON.parse(fs.readFileSync(catalogue, 'utf8')).folder as string);
    return folder.startsWith(project + path.sep) ? folder : null;
  }

  const handle: Connect.NextHandleFunction = (request, response, next) => {
    const url = (request.url ?? '').split('?')[0];
    if (url === '/data_acquisition' || url === '/data_acquisition/' || url === '/data_acquisition/index.html') {
      response.statusCode = 302;
      response.setHeader('Location', '/data_intake/reference_books/');
      response.end();
      return;
    }
    if (url === '/data_intake') { response.statusCode = 302; response.setHeader('Location', '/data_intake/'); response.end(); return; }
    if (!url.startsWith('/data_intake/')) return next();
    if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) { response.statusCode = 405; response.end(); return; }
    let rest: string;
    try { rest = decodeURIComponent(url.slice('/data_intake/'.length)); } catch { return notFound(response, url); }
    const [first, ...tail] = rest.split('/');
    let file: string | null = null;
    let raw = false;

    if (first === 'reference_books') {
      const relative = tail.join('/') || 'index.html';
      for (const dir of referenceDirs) {
        const candidate = path.resolve(dir, relative.endsWith('/') ? `${relative}index.html` : relative);
        if (candidate.startsWith(dir + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; break; }
      }
    } else if (first === 'files' && SLUG.test(tail[0] ?? '')) {
      const folder = intakeFolder(tail[0]);
      const candidate = folder ? path.resolve(folder, tail.slice(1).join('/')) : '';
      if (folder && candidate.startsWith(folder + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) { file = candidate; raw = true; }
    } else if (first === '' || /^[\w-]+\.(?:html|css|js|json)$/.test(first) && tail.length === 0) {
      const candidate = path.join(pages, first || 'index.html');
      if (fs.existsSync(candidate)) file = candidate;
    } else if (SLUG.test(first) && fs.existsSync(path.join(pages, first, 'catalogue.json'))) {
      if (tail.length === 0) { response.statusCode = 302; response.setHeader('Location', `/data_intake/${first}/`); response.end(); return; }
      const leaf = tail.join('/');
      file = leaf === '' || leaf === 'index.html' ? path.join(pages, 'view.html') : leaf === 'catalogue.json' ? path.join(pages, first, 'catalogue.json') : null;
    }
    if (!file) return notFound(response, url);
    try {
      send(request, response, file, raw);
    } catch (error) {
      console.error(`data intake: could not read ${file}`, error);
      if (!response.headersSent) { response.statusCode = 503; response.end(); } else response.destroy();
    }
  };

  return {
    name: 'data-intake',
    configureServer(server) { server.middlewares.use(handle); },
    configurePreviewServer(server) { server.middlewares.use(handle); },
  };
}
