// The Cloudflare Worker's front door, copied into each release beside the compiled functions/ routes.
import functions from "./functions/index.js";
import { serveByteRange, wantsByteRange } from "./byte-ranges.mjs";

export default {
  async fetch(request, env, context) {
    const { hostname, pathname } = new URL(request.url);
    // The temporary address shares the live database: it may read it, never add to it.
    if (hostname.endsWith(".workers.dev") && pathname.startsWith("/api/") && !["GET", "HEAD"].includes(request.method)) {
      return Response.json({ error: "Sending is switched off on this test address." }, { status: 403 });
    }
    if (wantsByteRange(request)) return serveByteRange(request, env, caches.default);
    return functions.fetch(request, env, context);
  },
};
