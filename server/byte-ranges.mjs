// Workers static assets ignore byte-range requests and always send the whole file (measured 2026-10-31), but the street
// atlas (src/components/atlas/chunked-source.ts) and the Circles reader (src/pages/study/circles/runtime.mjs) read small
// slices of 25 MiB .bin files. So those files pass through the edge cache, which does answer ranges, or are cut here.
const RANGE = /^bytes=(\d+)-(\d+)$/;
const CACHE_SECONDS = 86400; // Circles files keep their names between releases, so a cached copy must expire.

/** The slice [start, end] of a stream, reading only as far as the end of the slice. */
export async function readSlice(body, start, end) {
  const reader = body.getReader();
  const out = new Uint8Array(end - start + 1);
  let position = 0, written = 0;
  while (written < out.length) {
    const { done, value } = await reader.read();
    if (done) break;
    const from = Math.max(start - position, 0), to = Math.min(value.length, end + 1 - position);
    if (from < to) {
      out.set(value.subarray(from, to), written);
      written += to - from;
    }
    position += value.length;
  }
  await reader.cancel();
  return out.subarray(0, written);
}

/** True for a request this module must answer; everything else goes to the site's normal routes. */
export function wantsByteRange(request) {
  const { pathname } = new URL(request.url);
  return request.method === "GET" && pathname.endsWith(".bin") && (pathname.startsWith("/atlas-tiles/") || pathname.startsWith("/circles/")) && RANGE.test(request.headers.get("Range") ?? "");
}

export async function serveByteRange(request, env, cache) {
  const range = request.headers.get("Range");
  const [, first, last] = RANGE.exec(range);
  const start = Number(first), end = Number(last);
  const url = new URL(request.url);
  const key = new Request(url.origin + url.pathname);
  const asRange = () => cache.match(new Request(key, { headers: { Range: range } }));
  const cached = await asRange();
  if (cached) return cached;

  const load = () => env.ASSETS.fetch(new Request(url.origin + url.pathname));
  const whole = await load();
  if (whole.status !== 200 || start > end) return whole;
  const type = whole.headers.get("Content-Type") ?? "application/octet-stream";
  const size = Number(whole.headers.get("Content-Length") ?? 0);
  if (size && start >= size) {
    await whole.body?.cancel();
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}`, "Access-Control-Allow-Origin": "*" } });
  }
  await cache.put(key, new Response(whole.body, { headers: { "Content-Type": type, "Cache-Control": `public, max-age=${CACHE_SECONDS}`, "Access-Control-Allow-Origin": "*" } }));
  const stored = await asRange();
  if (stored) return stored;

  // The cache may decline a file; cut the slice from a fresh read so the reader still gets exactly what it asked for.
  const fresh = await load();
  const bytes = await readSlice(fresh.body, start, end);
  return new Response(bytes, {
    status: 206,
    headers: { "Content-Type": type, "Content-Range": `bytes ${start}-${start + bytes.length - 1}/${size || "*"}`, "Cache-Control": `public, max-age=${CACHE_SECONDS}`, "Access-Control-Allow-Origin": "*" },
  });
}
