// Team play's HTTP routes (docs/features/team-play/design.md, section 2), shared by the Pages Function
// (functions/api/team-room/[[path]].ts) and the local dev worker (server/live-quiz/dev-worker.ts):
//   POST /api/team-room/rooms                create a room: picks a free five-digit code, returns it with the laptop's token
//   GET  /api/team-room/rooms/:code          does it exist, which game, and each team's state (for the join page)
//   GET  /api/team-room/rooms/:code/socket   the WebSocket upgrade, handed to that room's Durable Object
// The binding is typed by shape here, so this file compiles for the browser's typecheck too.
import { byteLength, isTeamCode, MAX_CREATE_BODY, parseCreateBody } from "./protocol";

export interface RoomStub { fetch(request: Request): Promise<Response> }
export interface RoomNamespace { idFromName(name: string): unknown; get(id: never): RoomStub }

const CODE_TRIES = 5;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const failure = (error: string, status: number) => json({ error }, status);

export const roomStub = (rooms: RoomNamespace, code: string): RoomStub => rooms.get(rooms.idFromName(`team:${code}`) as never);

/** A five-digit code, 10000-99999, from the platform's secure random numbers. */
export function randomTeamCode(): string {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  return String(10000 + (value % 90000));
}

export async function handleTeamRoomApi(request: Request, rooms: RoomNamespace | undefined, makeCode: () => string = randomTeamCode): Promise<Response> {
  if (!rooms) return failure("The team-game server is not set up here.", 503);
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  const parts = path.split("/").slice(3); // ["", "api", "team-room", ...]
  if (parts.length === 1 && parts[0] === "rooms") {
    return request.method === "POST" ? createRoom(request, rooms, makeCode) : failure("Use POST to create a room.", 405);
  }
  if (parts[0] !== "rooms" || parts.length < 2 || parts.length > 3 || !isTeamCode(parts[1])) return failure("Not found.", 404);
  if (request.method !== "GET") return failure("Use GET.", 405);
  const stub = roomStub(rooms, parts[1]);
  if (parts.length === 2) return stub.fetch(new Request("https://room/info"));
  if (parts[2] !== "socket") return failure("Not found.", 404);
  if ((request.headers.get("Upgrade") ?? "").toLowerCase() !== "websocket") return failure("Expected a WebSocket upgrade.", 426);
  return stub.fetch(request);
}

async function createRoom(request: Request, rooms: RoomNamespace, makeCode: () => string): Promise<Response> {
  const declared = Number(request.headers.get("Content-Length") ?? "0");
  if (declared > MAX_CREATE_BODY) return failure("Too many teams or names too long.", 413);
  const body = await request.text();
  if (byteLength(body) > MAX_CREATE_BODY) return failure("Too many teams or names too long.", 413);
  if (!parseCreateBody(body)) return failure("The game or team names could not be read.", 400);
  for (let attempt = 0; attempt < CODE_TRIES; attempt++) {
    const code = makeCode();
    const response = await roomStub(rooms, code).fetch(new Request(`https://room/create?code=${code}`, { method: "POST", body }));
    if (response.status !== 409) return response;
  }
  return failure("Could not find a free game code. Please try again.", 503);
}
