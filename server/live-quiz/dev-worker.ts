// Local development only (design.md 6.4): `npm run live-quiz:dev` runs this under wrangler on 127.0.0.1:8928, with
// Miniflare playing the Durable Object, its alarm and hibernation. Vite's dev server (8930) and the preview (8931)
// proxy /api/live-quiz to it. No Cloudflare account, no cost. The release uses functions/api/live-quiz/ instead.
import { handleLiveQuizApi, type RoomNamespace } from "../../src/lib/live-quiz/api";

export { LiveQuizRoom } from "./room";

interface DevEnv { LIVE_QUIZ: RoomNamespace }

export default {
  fetch(request: Request, env: DevEnv): Promise<Response> | Response {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith("/api/live-quiz/")) return Response.json({ error: "Only /api/live-quiz/ is served here." }, { status: 404 });
    return handleLiveQuizApi(request, env.LIVE_QUIZ);
  },
};
