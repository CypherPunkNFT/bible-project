import { createServer } from 'node:http';

// The old review URL points to the original preview; it never serves another checkout or build.
createServer((request, response) => {
  const route = request.url?.startsWith('/') ? request.url : '/';
  response.writeHead(307, {
    Location: `http://127.0.0.1:8931${route}`,
    'Cache-Control': 'no-store',
  });
  response.end();
}).listen(8941, '127.0.0.1');
