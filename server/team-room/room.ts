// Team play's Durable Object, one per five-digit code (docs/features/team-play/design.md, section 2). It only adapts
// Cloudflare's storage, hibernating WebSockets and alarm to the core; every rule lives in src/lib/team-room/. The
// release bundles this file with its imports into worker/team-room.mjs (scripts/prepare-testimonies-release.ts);
// locally `npm run live-quiz:dev` serves it too (server/live-quiz/dev-worker.ts).
import { DurableObject } from "cloudflare:workers";
import { TeamRoomCore, type Attachment, type RoomSockets, type RoomStorage } from "../../src/lib/team-room/core";
import { PING, PONG } from "../../src/lib/team-room/protocol";

export class TeamRoom extends DurableObject {
  private readonly core: TeamRoomCore<WebSocket>;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env as Cloudflare.Env);
    const storage: RoomStorage = {
      get: (key) => ctx.storage.get(key),
      list: (prefix) => ctx.storage.list({ prefix }),
      put: (entries) => ctx.storage.put(entries),
      deleteAll: () => ctx.storage.deleteAll(),
      setAlarm: (at) => ctx.storage.setAlarm(at),
      deleteAlarm: () => ctx.storage.deleteAlarm(),
    };
    const sockets: RoomSockets<WebSocket> = {
      all: () => ctx.getWebSockets(),
      send: (socket, text) => socket.send(text),
      close: (socket, code, reason) => socket.close(code, reason),
      get: (socket) => socket.deserializeAttachment() as Attachment | null,
      set: (socket, attachment) => socket.serializeAttachment(attachment),
    };
    this.core = new TeamRoomCore(storage, sockets);
    // Phones' heartbeats are answered without waking the room (design Review 5).
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG));
    // A woken object has lost its memory: rebuild the room before any message or alarm is handled.
    void ctx.blockConcurrencyWhile(() => this.core.load());
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const headers = { "Cache-Control": "no-store" };
    if (url.pathname === "/create" && request.method === "POST") {
      const result = await this.core.create(url.searchParams.get("code") ?? "", await request.text());
      return Response.json(result.body, { status: result.status, headers });
    }
    if (url.pathname === "/info") return Response.json(this.core.info(), { headers });
    if ((request.headers.get("Upgrade") ?? "").toLowerCase() === "websocket") {
      if (!this.core.canAccept()) return Response.json({ error: "No game with that code." }, { status: 404 });
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      this.core.open(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    await this.core.message(socket, message);
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    await this.core.close(socket);
    // Finish the closing handshake with a normal code; the incoming one (1005, 1006) may not be sent back.
    try {
      socket.close(1000, "Closed");
    } catch (error) {
      console.warn("team-room: the socket was already closed", error);
    }
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    await this.core.close(socket);
  }

  async alarm(): Promise<void> {
    await this.core.alarm();
  }
}
