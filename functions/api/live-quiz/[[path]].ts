import { handleLiveQuizApi, type RoomNamespace } from "../../../src/lib/live-quiz/api";

/** The live quiz's room binding (scripts/prepare-testimonies-release.ts adds it to the release's wrangler.jsonc). */
interface LiveQuizEnv { LIVE_QUIZ?: RoomNamespace }

export const onRequest: PagesFunction<LiveQuizEnv> = ({ request, env }) => handleLiveQuizApi(request, env.LIVE_QUIZ);
