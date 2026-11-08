// The live quiz's Durable Object, one per room code (docs/features/live-quiz/design.md 6.1–6.7). It only adapts
// Cloudflare's storage, hibernating WebSockets and alarm to room-core's interfaces; every rule lives in
// src/lib/live-quiz/. The release bundles this file with its imports into worker/live-quiz-room.mjs
// (scripts/prepare-testimonies-release.ts); locally `npm run live-quiz:dev` runs it under wrangler (dev-worker.ts).
import { DurableObject } from "cloudflare:workers";
import { RoomCore, type Attachment, type RoomSockets, type RoomStorage } from "../../src/lib/live-quiz/room-core";

export class LiveQuizRoom extends DurableObject {
  private readonly core: RoomCore<WebSocket>;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env as Cloudflare.Env);
    const storage: RoomStorage = {
      get: (key) => ctx.storage.get(key),
      list: (prefix) => ctx.storage.list({ prefix }),
      put: (entries) => ctx.storage.put(entries),
      delete: async (keys) => { await ctx.storage.delete(keys); },
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
    this.core = new RoomCore(storage, sockets);
    // A woken object has lost its memory: rebuild the room before any message or alarm is handled.
    void ctx.blockConcurrencyWhile(() => this.core.load());
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/create" && request.method === "POST") {
      const result = await this.core.create(url.searchParams.get("code") ?? "", await request.text());
      return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
    }
    if (url.pathname === "/info") return Response.json(this.core.info(), { headers: { "Cache-Control": "no-store" } });
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
      console.warn("live-quiz: the socket was already closed", error);
    }
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    await this.core.close(socket);
  }

  async alarm(): Promise<void> {
    await this.core.alarm();
  }
}
