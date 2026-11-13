// The Cloudflare Worker's front door, copied into each release beside the compiled functions/ routes.
import functions from "./functions/index.js";
import { serveByteRange, wantsByteRange } from "./byte-ranges.mjs";
// The live quiz's room, bundled beside this file by scripts/prepare-testimonies-release.ts (design: docs/features/live-quiz/).
export { LiveQuizRoom } from "./live-quiz-room.mjs";
// Team play's room, bundled the same way (design: docs/features/team-play/).
export { TeamRoom } from "./team-room.mjs";

export default {
  async fetch(request, env, context) {
    const { hostname, pathname } = new URL(request.url);
    // The temporary address shares the live database: it may read it, never add to it. The live quiz and team play
    // touch no database, so creating a room (a POST) stays allowed there.
    const roomApi = pathname.startsWith("/api/live-quiz/") || pathname.startsWith("/api/team-room/");
    if (hostname.endsWith(".workers.dev") && pathname.startsWith("/api/") && !roomApi && !["GET", "HEAD"].includes(request.method)) {
      return Response.json({ error: "Sending is switched off on this test address." }, { status: 403 });
    }
    if (wantsByteRange(request)) return serveByteRange(request, env, caches.default);
    return functions.fetch(request, env, context);
  },
};
