import { handleTeamRoomApi, type RoomNamespace } from "../../../src/lib/team-room/api";

/** Team play's room binding (scripts/prepare-testimonies-release.ts adds it to the release's wrangler.jsonc). */
interface TeamRoomEnv { TEAM_ROOM?: RoomNamespace }

export const onRequest: PagesFunction<TeamRoomEnv> = ({ request, env }) => handleTeamRoomApi(request, env.TEAM_ROOM);
