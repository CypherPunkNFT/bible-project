// Everything the room's Durable Object does that is not Cloudflare-specific (design.md 6.3, 6.6, 6.7): loading and
// writing the room through a small storage interface, checking tokens by their hash, handing each socket message to
// the engine, sending each screen what it may see, keeping the one alarm, and wiping the room when its time is up.
// server/live-quiz/room.ts adapts the real object to this; the tests use in-memory fakes.
import {
  applyAnswer, applyHostAction, canRejoin, cleanupAt, closeIfEveryoneAnswered, createRoom, join, nextWakeAt, onDeadline, playerList, setLeaderOnline,
  type Effects, type PlayerRecord, type Room, type RoomRecord,
} from "./engine";
import {
  CLOSE, MAX_PLAYERS, parseClientMessage, parseCreateBody, type ErrorCode, type RoomInfo, type Role, type ServerMessage,
} from "./protocol";
import { answeredCount, hostView, playerRows, playerView } from "./views";

export interface RoomStorage {
  get<T>(key: string): Promise<T | undefined>;
  list<T>(prefix: string): Promise<Map<string, T>>;
  put(entries: Record<string, unknown>): Promise<void>;
  delete(keys: string[]): Promise<void>;
  deleteAll(): Promise<void>;
  setAlarm(at: number): Promise<void>;
  deleteAlarm(): Promise<void>;
}

/** Who a socket is, kept in its hibernation attachment so it survives the object sleeping. */
export interface Attachment { role: Role; playerId: string | null }

export interface RoomSockets<S> {
  all(): S[];
  send(socket: S, text: string): void;
  close(socket: S, code: number, reason: string): void;
  get(socket: S): Attachment | null;
  set(socket: S, attachment: Attachment): void;
}

/** More than this many messages from one socket in FLOOD_WINDOW_MS closes it (incoming messages are billed). */
export const FLOOD_LIMIT = 20;
export const FLOOD_WINDOW_MS = 10_000;
/** Sockets one room accepts: a full room of phones plus a few leader tabs and reconnects in flight. */
export const MAX_SOCKETS = MAX_PLAYERS + 50;

const MESSAGES: Record<ErrorCode, string> = {
  "bad-message": "That message could not be read.",
  "not-found": "No game with that code — check the screen.",
  locked: "This game is locked. Ask the leader to unlock it.",
  full: "This game is full.",
  "name-taken": "That name is taken — try adding a letter.",
  "name-invalid": "Please choose a name of 1 to 16 letters.",
  "name-blocked": "Please choose another name.",
  "name-picker": "This game uses the name picker.",
  removed: "The leader removed you from this game.",
  auth: "This connection could not be confirmed.",
  "too-late": "Time's up.",
  paused: "The game is paused.",
  "not-allowed": "That can't be done right now.",
  "too-many": "Too many messages.",
};

export const errorMessage = (code: ErrorCode): ServerMessage => ({ t: "error", code, message: MESSAGES[code] });

const toBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...Array.from(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function randomToken(bytes = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function hashToken(token: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface CreateResult { status: number; body: { code: string; roomId: string; token: string } | { error: string } }

export class RoomCore<S extends object> {
  private state: Room | null = null;
  private readonly recent = new WeakMap<S, number[]>();

  constructor(private readonly storage: RoomStorage, private readonly sockets: RoomSockets<S>, private readonly clock: () => number = Date.now) {}

  /** Rebuilds the room from storage: on every wake from hibernation. */
  async load(): Promise<void> {
    const room = await this.storage.get<RoomRecord>("room");
    if (!room) { this.state = null; return; }
    const players: Record<string, PlayerRecord> = {};
    for (const [, player] of await this.storage.list<PlayerRecord>("p:")) players[player.id] = player;
    this.state = { room, players };
  }

  get room(): Room | null { return this.state; }

  info(): RoomInfo {
    const room = this.state?.room;
    if (!room || room.phase === "ended") return { exists: false, roomId: null, locked: false, full: false, names: "typed" };
    return { exists: true, roomId: room.roomId, locked: room.locked, full: playerList(this.state!).length >= MAX_PLAYERS, names: room.settings.names };
  }

  /** Whether a new socket may open: the room exists, has not ended, and is not flooded with sockets. */
  canAccept(): boolean {
    return Boolean(this.state && this.state.room.phase !== "ended" && this.sockets.all().length < MAX_SOCKETS);
  }

  /** Claims this object for a new room, if it is free. */
  async create(code: string, rawBody: string): Promise<CreateResult> {
    if (this.state) return { status: 409, body: { error: "That code is in use." } };
    const parsed = parseCreateBody(rawBody);
    if (!parsed) return { status: 400, body: { error: "The questions or settings could not be read." } };
    const token = randomToken();
    const roomId = randomToken(9);
    this.state = createRoom({ roomId, code, now: this.clock(), hostTokenHash: await hashToken(token), ...parsed });
    await this.storage.put({ room: this.state.room });
    await this.arm();
    return { status: 201, body: { code, roomId, token } };
  }

  open(socket: S): void {
    this.sockets.set(socket, { role: "none", playerId: null });
  }

  async message(socket: S, data: string | ArrayBuffer): Promise<void> {
    if (!this.state) return this.sockets.close(socket, CLOSE.notFound, "No game with that code.");
    if (this.flooded(socket)) return this.sockets.close(socket, CLOSE.flood, "Too many messages.");
    if (typeof data !== "string") return this.send(socket, errorMessage("bad-message"));
    const attachment = this.sockets.get(socket) ?? { role: "none", playerId: null };
    const parsed = parseClientMessage(data, attachment.role);
    if (!parsed.ok) return this.send(socket, errorMessage("bad-message"));
    const message = parsed.message;
    if (message.t === "host") return this.signInHost(socket, message.token);
    if (message.t === "join") return this.join(socket, message.name);
    if (message.t === "rejoin") return this.rejoin(socket, message.playerId, message.token);
    if (!this.state) return;
    const now = this.clock();
    if (message.t === "answer") {
      const result = applyAnswer(this.state, attachment.playerId ?? "", message.index, message.choice, now, this.connected());
      return result.ok ? this.apply(result.effects) : this.send(socket, errorMessage(result.error));
    }
    const result = applyHostAction(this.state, message, now, this.connected());
    if (!result.ok) return this.send(socket, errorMessage(result.error));
    if (message.t === "kick") this.closePlayer(message.playerId, CLOSE.kicked, MESSAGES.removed);
    await this.apply(result.effects);
    if (message.t === "end") await this.finish();
  }

  async close(socket: S): Promise<void> {
    if (!this.state) return;
    const attachment = this.sockets.get(socket);
    this.sockets.set(socket, { role: "none", playerId: null });
    if (attachment?.role === "host") {
      await this.apply(setLeaderOnline(this.state, this.hostConnected(socket), this.clock()), socket);
    } else if (attachment?.role === "player") {
      // The player who left may have been the last one everyone was waiting for.
      const closing = closeIfEveryoneAnswered(this.state, this.clock(), this.connected(socket));
      await this.apply({ ...closing, host: true }, socket);
    }
  }

  async alarm(): Promise<void> {
    if (!this.state) return;
    const now = this.clock();
    if (now >= cleanupAt(this.state.room)) return this.wipe();
    await this.apply(onDeadline(this.state, now, this.hostConnected()));
  }

  // ---- Signing in --------------------------------------------------------------------------------------------------

  private async signInHost(socket: S, token: string): Promise<void> {
    const hash = await hashToken(token);
    if (!this.state) return;
    if (hash !== this.state.room.hostTokenHash) {
      this.send(socket, errorMessage("auth"));
      return this.sockets.close(socket, CLOSE.notFound, MESSAGES.auth);
    }
    for (const other of this.sockets.all()) {
      if (other !== socket && this.sockets.get(other)?.role === "host") {
        this.sockets.set(other, { role: "none", playerId: null });
        this.sockets.close(other, CLOSE.replaced, "Opened on another screen.");
      }
    }
    this.sockets.set(socket, { role: "host", playerId: null });
    const changed = setLeaderOnline(this.state, true, this.clock());
    await this.apply(changed);
    if (!changed.broadcast) this.send(socket, hostView(this.state, this.clock(), this.connected()));
  }

  private async join(socket: S, name: string): Promise<void> {
    const token = randomToken();
    const tokenHash = await hashToken(token);
    if (!this.state) return;
    const playerId = randomToken(9);
    const result = join(this.state, { playerId, name, tokenHash, now: this.clock() });
    if (!result.ok) return this.send(socket, errorMessage(result.error));
    this.sockets.set(socket, { role: "player", playerId });
    this.send(socket, { t: "joined", playerId, token, name: result.name! });
    await this.apply(result.effects);
  }

  private async rejoin(socket: S, playerId: string, token: string): Promise<void> {
    const tokenHash = await hashToken(token);
    if (!this.state) return;
    const refused = canRejoin(this.state, playerId, tokenHash);
    if (refused) {
      this.send(socket, errorMessage(refused));
      return this.sockets.close(socket, refused === "removed" ? CLOSE.kicked : CLOSE.notFound, MESSAGES[refused]);
    }
    this.closePlayer(playerId, CLOSE.replaced, "Opened on another tab.");
    this.sockets.set(socket, { role: "player", playerId });
    this.send(socket, playerView(this.state, playerId, this.clock(), this.hostConnected())!);
    this.sendHostUpdates();
  }

  // ---- Effects -----------------------------------------------------------------------------------------------------

  /** Writes what changed, re-arms the alarm, then tells the screens. `leaving`: a socket that is closing. */
  private async apply(effects: Effects, leaving?: S): Promise<void> {
    if (!this.state) return;
    const entries: Record<string, unknown> = {};
    if (effects.room) entries.room = this.state.room;
    for (const id of effects.players) if (this.state.players[id]) entries[`p:${id}`] = this.state.players[id];
    if (Object.keys(entries).length) await this.storage.put(entries);
    if (effects.removed.length) await this.storage.delete(effects.removed.map((id) => `p:${id}`));
    await this.arm(leaving);
    if (!this.state) return;
    if (effects.broadcast) this.broadcast(leaving);
    else {
      if (effects.host) this.sendHostUpdates(leaving);
      for (const id of effects.players) this.sendPlayer(id);
    }
  }

  private async arm(leaving?: S): Promise<void> {
    if (this.state) await this.storage.setAlarm(nextWakeAt(this.state.room, this.hostConnected(leaving)));
  }

  /** Ends the room for every screen after "End": they have its final snapshot; the sockets close. */
  private async finish(): Promise<void> {
    for (const socket of this.sockets.all()) this.sockets.close(socket, CLOSE.ended, "This game has ended.");
  }

  /** Wipes the room: nothing about its players outlives it. Later messages on old sockets find no room and write nothing. */
  private async wipe(): Promise<void> {
    this.state = null;
    for (const socket of this.sockets.all()) this.sockets.close(socket, CLOSE.ended, "This game has ended.");
    await this.storage.deleteAlarm();
    await this.storage.deleteAll();
  }

  // ---- Sending -----------------------------------------------------------------------------------------------------

  private send(socket: S, message: ServerMessage): void {
    try {
      this.sockets.send(socket, JSON.stringify(message));
    } catch (error) {
      console.warn("live-quiz: a send to a closing socket failed", error);
    }
  }

  private live(leaving?: S): { socket: S; attachment: Attachment }[] {
    const out: { socket: S; attachment: Attachment }[] = [];
    for (const socket of this.sockets.all()) {
      const attachment = this.sockets.get(socket);
      if (socket !== leaving && attachment && attachment.role !== "none") out.push({ socket, attachment });
    }
    return out;
  }

  private connected(leaving?: S): Set<string> {
    return new Set(this.live(leaving).filter((s) => s.attachment.role === "player").map((s) => s.attachment.playerId!));
  }

  private hostConnected(leaving?: S): boolean {
    return this.live(leaving).some((s) => s.attachment.role === "host");
  }

  private broadcast(leaving?: S): void {
    const state = this.state!;
    const now = this.clock();
    const connected = this.connected(leaving);
    const hostOnline = this.hostConnected(leaving);
    for (const { socket, attachment } of this.live(leaving)) {
      const view = attachment.role === "host" ? hostView(state, now, connected) : playerView(state, attachment.playerId!, now, hostOnline);
      if (view) this.send(socket, view);
    }
  }

  private sendHostUpdates(leaving?: S): void {
    const state = this.state!;
    const connected = this.connected(leaving);
    const players: ServerMessage = { t: "players", players: playerRows(state, connected) };
    const answered: ServerMessage = { t: "answered", ...answeredCount(state) };
    for (const { socket, attachment } of this.live(leaving)) {
      if (attachment.role !== "host") continue;
      this.send(socket, players);
      this.send(socket, answered);
    }
  }

  private sendPlayer(playerId: string): void {
    const state = this.state!;
    const view = playerView(state, playerId, this.clock(), this.hostConnected());
    if (!view) return;
    for (const { socket, attachment } of this.live()) if (attachment.playerId === playerId) this.send(socket, view);
  }

  private closePlayer(playerId: string, code: number, reason: string): void {
    for (const { socket, attachment } of this.live()) {
      if (attachment.role !== "player" || attachment.playerId !== playerId) continue;
      if (code === CLOSE.kicked) this.send(socket, errorMessage("removed"));
      this.sockets.set(socket, { role: "none", playerId: null });
      this.sockets.close(socket, code, reason);
    }
  }

  private flooded(socket: S): boolean {
    const now = this.clock();
    const times = (this.recent.get(socket) ?? []).filter((at) => now - at < FLOOD_WINDOW_MS);
    times.push(now);
    this.recent.set(socket, times);
    return times.length > FLOOD_LIMIT;
  }
}
