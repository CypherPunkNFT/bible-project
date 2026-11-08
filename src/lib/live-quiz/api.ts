// The live quiz's HTTP routes (design.md 6.1, 6.6), shared by the Pages Function (functions/api/live-quiz/[[path]].ts)
// and the local dev worker (server/live-quiz/dev-worker.ts):
//   POST /api/live-quiz/rooms                 create a room: picks a free six-digit code, returns it with the leader token
//   GET  /api/live-quiz/rooms/:code           does it exist, is it locked or full, and how players choose names
//   GET  /api/live-quiz/rooms/:code/socket    the WebSocket upgrade, handed to that room's Durable Object
// The binding is typed by shape here, so this file compiles for the browser's typecheck too.
import { byteLength, isRoomCode, MAX_QUESTIONS_BODY, parseCreateBody } from "./protocol";

export interface RoomStub { fetch(request: Request): Promise<Response> }
export interface RoomNamespace { idFromName(name: string): unknown; get(id: never): RoomStub }

const CODE_TRIES = 5;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const failure = (error: string, status: number) => json({ error }, status);

export const roomStub = (rooms: RoomNamespace, code: string): RoomStub => rooms.get(rooms.idFromName(`room:${code}`) as never);

/** A six-digit code, 100000–999999, from the platform's secure random numbers. */
export function randomCode(): string {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  return String(100000 + (value % 900000));
}

export async function handleLiveQuizApi(request: Request, rooms: RoomNamespace | undefined, makeCode: () => string = randomCode): Promise<Response> {
  if (!rooms) return failure("The live-game server is not set up here.", 503);
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  const parts = path.split("/").slice(3); // ["", "api", "live-quiz", ...]
  if (parts.length === 1 && parts[0] === "rooms") {
    return request.method === "POST" ? createRoom(request, rooms, makeCode) : failure("Use POST to create a room.", 405);
  }
  if (parts[0] !== "rooms" || parts.length < 2 || parts.length > 3 || !isRoomCode(parts[1])) return failure("Not found.", 404);
  if (request.method !== "GET") return failure("Use GET.", 405);
  const stub = roomStub(rooms, parts[1]);
  if (parts.length === 2) return stub.fetch(new Request("https://room/info"));
  if (parts[2] !== "socket") return failure("Not found.", 404);
  if ((request.headers.get("Upgrade") ?? "").toLowerCase() !== "websocket") return failure("Expected a WebSocket upgrade.", 426);
  return stub.fetch(request);
}

async function createRoom(request: Request, rooms: RoomNamespace, makeCode: () => string): Promise<Response> {
  const declared = Number(request.headers.get("Content-Length") ?? "0");
  if (declared > MAX_QUESTIONS_BODY) return failure("Too many questions or too much text.", 413);
  const body = await request.text();
  if (byteLength(body) > MAX_QUESTIONS_BODY) return failure("Too many questions or too much text.", 413);
  if (!parseCreateBody(body)) return failure("The questions or settings could not be read.", 400);
  for (let attempt = 0; attempt < CODE_TRIES; attempt++) {
    const code = makeCode();
    const response = await roomStub(rooms, code).fetch(new Request(`https://room/create?code=${code}`, { method: "POST", body }));
    if (response.status !== 409) return response;
  }
  return failure("Could not find a free game code. Please try again.", 503);
}
