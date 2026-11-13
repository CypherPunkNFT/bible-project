// Team play's room, everything that is not Cloudflare-specific (docs/features/team-play/design.md, section 2 and
// Review 1-8): who is the laptop and which phone holds which team, passing phones' inputs to the laptop and the
// laptop's views to the phones, remembering each team's latest view, and wiping the room when its time is up. It knows
// no game rules. server/team-room/room.ts adapts the real Durable Object to this; the tests use in-memory fakes.
import {
  AWAY_RELEASE_MS, CLOSE, IDLE_WIPE_MS, MAX_LIFE_MS, MAX_SOCKETS, PING, PONG, REARM_EVERY_MS, parseClientMessage,
  parseCreateBody, type ErrorCode, type Role, type RoomInfo, type ServerMessage, type TeamGame, type TeamState, type TeamStatus,
} from "./protocol";

export interface RoomStorage {
  get<T>(key: string): Promise<T | undefined>;
  list<T>(prefix: string): Promise<Map<string, T>>;
  put(entries: Record<string, unknown>): Promise<void>;
  deleteAll(): Promise<void>;
  setAlarm(at: number): Promise<void>;
  deleteAlarm(): Promise<void>;
}

/** Who a socket is, kept in its hibernation attachment so it survives the object sleeping. */
export interface Attachment { role: Role; team: string | null }

export interface RoomSockets<S> {
  all(): S[];
  send(socket: S, text: string): void;
  close(socket: S, code: number, reason: string): void;
  get(socket: S): Attachment | null;
  set(socket: S, attachment: Attachment): void;
}

export interface TeamSlot { id: string; name: string; tokenHash: string | null }

export interface RoomRecord {
  code: string;
  game: TeamGame;
  hostTokenHash: string;
  createdAt: number;
  lastActive: number;
  teams: TeamSlot[];
}

/** Messages one socket may send per FLOOD_WINDOW_MS; more are dropped quietly (Review 6). */
export const FLOOD_LIMIT = { host: 120, team: 20, none: 10 } as const;
export const FLOOD_WINDOW_MS = 10_000;

const MESSAGES: Record<ErrorCode, string> = {
  "bad-message": "That message could not be read.",
  auth: "This screen could not be confirmed as the game's big screen.",
  "team-held": "This team already has a phone. Ask the leader to tap Free.",
  "team-taken": "Another phone has this team now. Ask the leader if you need it back.",
  "unknown-team": "There is no team like that in this game.",
  "not-found": "No game with that code. Check the big screen.",
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

export interface CreateResult { status: number; body: { code: string; token: string } | { error: string } }

export const wipeAt = (room: RoomRecord) => Math.min(room.lastActive + IDLE_WIPE_MS, room.createdAt + MAX_LIFE_MS);

export class TeamRoomCore<S extends object> {
  private room: RoomRecord | null = null;
  /** When each held team's last phone dropped; kept in memory (a woken room counts from when it woke). */
  private readonly awaySince = new Map<string, number>();
  private readonly recent = new WeakMap<S, number[]>();
  private armedAt = 0;

  constructor(private readonly storage: RoomStorage, private readonly sockets: RoomSockets<S>, private readonly clock: () => number = Date.now) {}

  /** Rebuilds the room from storage: on every wake from hibernation. */
  async load(): Promise<void> {
    this.room = (await this.storage.get<RoomRecord>("room")) ?? null;
    if (!this.room) return;
    const now = this.clock();
    for (const slot of this.room.teams) if (slot.tokenHash && !this.online(slot.id)) this.awaySince.set(slot.id, now);
  }

  get record(): RoomRecord | null { return this.room; }

  info(): RoomInfo {
    if (!this.room) return { exists: false, game: null, teams: [] };
    return { exists: true, game: this.room.game, teams: this.teamStatuses() };
  }

  canAccept(): boolean {
    return Boolean(this.room && this.sockets.all().length < MAX_SOCKETS);
  }

  /** Claims this object for a new room, if it is free. */
  async create(code: string, rawBody: string): Promise<CreateResult> {
    if (this.room) return { status: 409, body: { error: "That code is in use." } };
    const parsed = parseCreateBody(rawBody);
    if (!parsed) return { status: 400, body: { error: "The game or team names could not be read." } };
    const token = randomToken();
    const hostTokenHash = await hashToken(token);
    if (this.room) return { status: 409, body: { error: "That code is in use." } };
    const now = this.clock();
    const teams = parsed.teams.map((name, n) => ({ id: `t${n + 1}`, name, tokenHash: null }));
    this.room = { code, game: parsed.game, hostTokenHash, createdAt: now, lastActive: now, teams };
    await this.storage.put({ room: this.room });
    await this.arm(true);
    return { status: 201, body: { code, token } };
  }

  open(socket: S): void {
    this.sockets.set(socket, { role: "none", team: null });
  }

  async message(socket: S, data: string | ArrayBuffer): Promise<void> {
    if (data === PING) return this.sendText(socket, PONG); // only where the platform's auto-response is missing
    if (!this.room) return this.sockets.close(socket, CLOSE.notFound, MESSAGES["not-found"]);
    const attachment = this.sockets.get(socket) ?? { role: "none", team: null };
    if (this.flooded(socket, attachment.role)) return;
    if (typeof data !== "string") return this.send(socket, errorMessage("bad-message"));
    const parsed = parseClientMessage(data, attachment.role);
    if (!parsed.ok) return this.send(socket, errorMessage("bad-message"));
    const message = parsed.message;
    this.room.lastActive = this.clock();
    switch (message.t) {
      case "host": return this.signInHost(socket, message.token);
      case "claim": return this.claim(socket, message.team);
      case "rejoin": return this.rejoin(socket, message.team, message.token);
      case "input": return this.input(socket, attachment.team!, message.data);
      case "view": return this.view(socket, message.team, message.view);
      case "free": return this.free(message.team);
      case "end": return this.wipe();
    }
  }

  async close(socket: S): Promise<void> {
    const attachment = this.sockets.get(socket);
    this.sockets.set(socket, { role: "none", team: null });
    if (!this.room || !attachment) return;
    if (attachment.role === "host" && !this.hostOnline()) this.toPhones({ t: "host", online: false });
    if (attachment.role === "team" && attachment.team && !this.online(attachment.team)) {
      this.awaySince.set(attachment.team, this.clock());
      this.sendTeams();
    }
  }

  async alarm(): Promise<void> {
    if (!this.room) return;
    if (this.clock() >= wipeAt(this.room)) return this.wipe();
    await this.arm(true);
  }

  // ---- Signing in --------------------------------------------------------------------------------------------------

  private async signInHost(socket: S, token: string): Promise<void> {
    const hash = await hashToken(token);
    if (!this.room) return;
    if (hash !== this.room.hostTokenHash) {
      this.send(socket, errorMessage("auth"));
      return this.sockets.close(socket, CLOSE.notFound, MESSAGES.auth);
    }
    for (const { socket: other, attachment } of this.live()) {
      if (other === socket || attachment.role !== "host") continue;
      this.sockets.set(other, { role: "none", team: null });
      this.sockets.close(other, CLOSE.replaced, "Opened on another screen.");
    }
    this.sockets.set(socket, { role: "host", team: null });
    this.send(socket, { t: "teams", teams: this.teamStatuses() });
    this.toPhones({ t: "host", online: true });
    await this.arm();
  }

  /** Review 1: the token is hashed first, then the team is checked and taken with no await in between. */
  private async claim(socket: S, team: string): Promise<void> {
    const token = randomToken();
    const tokenHash = await hashToken(token);
    const slot = this.slot(team);
    if (!this.room) return;
    if (!slot) return this.send(socket, errorMessage("unknown-team"));
    if (!this.claimable(slot)) return this.send(socket, errorMessage("team-held"));
    this.closeTeam(slot.id, CLOSE.teamTaken, MESSAGES["team-taken"]);
    slot.tokenHash = tokenHash;
    this.awaySince.delete(slot.id);
    this.sockets.set(socket, { role: "team", team: slot.id });
    this.send(socket, { t: "claimed", team: slot.id, name: slot.name, token });
    await this.welcomePhone(socket, slot.id);
  }

  private async rejoin(socket: S, team: string, token: string): Promise<void> {
    const tokenHash = await hashToken(token);
    const slot = this.slot(team);
    if (!this.room) return;
    if (!slot || !slot.tokenHash || slot.tokenHash !== tokenHash) {
      this.send(socket, errorMessage("team-taken"));
      return this.sockets.close(socket, CLOSE.teamTaken, MESSAGES["team-taken"]);
    }
    for (const { socket: other, attachment } of this.live()) {
      if (other === socket || attachment.team !== slot.id) continue;
      this.sockets.set(other, { role: "none", team: null });
      this.sockets.close(other, CLOSE.replaced, "Opened on another tab.");
    }
    this.awaySince.delete(slot.id);
    this.sockets.set(socket, { role: "team", team: slot.id });
    await this.welcomePhone(socket, slot.id);
  }

  /** A phone that has just taken or retaken its team: its latest view, whether the big screen is here, and the laptop told. */
  private async welcomePhone(socket: S, team: string): Promise<void> {
    const view = await this.storage.get<unknown>(`v:${team}`);
    if (view !== undefined) this.send(socket, { t: "view", view });
    this.send(socket, { t: "host", online: this.hostOnline() });
    this.sendTeams();
    await this.storage.put({ room: this.room });
    await this.arm();
  }

  // ---- Relaying ----------------------------------------------------------------------------------------------------

  private async input(socket: S, team: string, data: unknown): Promise<void> {
    const host = this.live().filter((s) => s.attachment.role === "host");
    if (!host.length) return this.send(socket, { t: "host", online: false });
    for (const { socket: screen } of host) this.send(screen, { t: "input", team, data });
    await this.arm();
  }

  /** Review 4: a view for "*" replaces every team's stored view; a team's own replaces just its own. */
  private async view(socket: S, team: string, view: unknown): Promise<void> {
    if (!this.room) return;
    const targets = team === "*" ? this.room.teams.map((slot) => slot.id) : this.slot(team) ? [team] : [];
    if (!targets.length) return this.send(socket, errorMessage("unknown-team"));
    await this.storage.put(Object.fromEntries(targets.map((id) => [`v:${id}`, view])));
    for (const { socket: phone, attachment } of this.live()) {
      if (attachment.role === "team" && targets.includes(attachment.team!)) this.send(phone, { t: "view", view });
    }
    await this.arm();
  }

  private async free(team: string): Promise<void> {
    const slot = this.slot(team);
    if (!slot || !this.room) return;
    this.closeTeam(slot.id, CLOSE.teamTaken, "The leader freed this team for another phone.");
    slot.tokenHash = null;
    this.awaySince.delete(slot.id);
    await this.storage.put({ room: this.room });
    this.sendTeams();
  }

  // ---- Lifetime ----------------------------------------------------------------------------------------------------

  /** Moves the wipe alarm, at most every REARM_EVERY_MS unless forced (Review 7); writes lastActive with it. */
  private async arm(force = false): Promise<void> {
    if (!this.room) return;
    const now = this.clock();
    if (!force && now - this.armedAt < REARM_EVERY_MS) return;
    this.armedAt = now;
    await this.storage.put({ room: this.room });
    await this.storage.setAlarm(wipeAt(this.room));
  }

  /** Ends the room for every screen; nothing about it outlives it. */
  private async wipe(): Promise<void> {
    this.room = null;
    this.awaySince.clear();
    for (const socket of this.sockets.all()) this.sockets.close(socket, CLOSE.ended, "This game has ended.");
    await this.storage.deleteAlarm();
    await this.storage.deleteAll();
  }

  // ---- Who is here -------------------------------------------------------------------------------------------------

  private slot(team: string): TeamSlot | undefined {
    return this.room?.teams.find((slot) => slot.id === team);
  }

  private live(): { socket: S; attachment: Attachment }[] {
    const out: { socket: S; attachment: Attachment }[] = [];
    for (const socket of this.sockets.all()) {
      const attachment = this.sockets.get(socket);
      if (attachment && attachment.role !== "none") out.push({ socket, attachment });
    }
    return out;
  }

  private online(team: string): boolean {
    return this.live().some((s) => s.attachment.role === "team" && s.attachment.team === team);
  }

  private hostOnline(): boolean {
    return this.live().some((s) => s.attachment.role === "host");
  }

  /** Free, or held by a phone that has been away AWAY_RELEASE_MS (Review 2). */
  private claimable(slot: TeamSlot): boolean {
    if (!slot.tokenHash) return true;
    if (this.online(slot.id)) return false;
    const since = this.awaySince.get(slot.id);
    return since !== undefined && this.clock() - since >= AWAY_RELEASE_MS;
  }

  private teamStatuses(): TeamStatus[] {
    return (this.room?.teams ?? []).map((slot) => {
      const state: TeamState = this.online(slot.id) ? "held" : this.claimable(slot) ? "open" : "away";
      return { id: slot.id, name: slot.name, state };
    });
  }

  // ---- Sending -----------------------------------------------------------------------------------------------------

  private sendText(socket: S, text: string): void {
    try {
      this.sockets.send(socket, text);
    } catch (error) {
      console.warn("team-room: a send to a closing socket failed", error);
    }
  }

  private send(socket: S, message: ServerMessage): void {
    this.sendText(socket, JSON.stringify(message));
  }

  private sendTeams(): void {
    const message: ServerMessage = { t: "teams", teams: this.teamStatuses() };
    for (const { socket, attachment } of this.live()) if (attachment.role === "host") this.send(socket, message);
  }

  private toPhones(message: ServerMessage): void {
    for (const { socket, attachment } of this.live()) if (attachment.role === "team") this.send(socket, message);
  }

  private closeTeam(team: string, code: number, reason: string): void {
    for (const { socket, attachment } of this.live()) {
      if (attachment.role !== "team" || attachment.team !== team) continue;
      if (code === CLOSE.teamTaken) this.send(socket, { t: "error", code: "team-taken", message: reason });
      this.sockets.set(socket, { role: "none", team: null });
      this.sockets.close(socket, code, reason);
    }
  }

  private flooded(socket: S, role: Role): boolean {
    const now = this.clock();
    const times = (this.recent.get(socket) ?? []).filter((at) => now - at < FLOOD_WINDOW_MS);
    times.push(now);
    this.recent.set(socket, times);
    if (times.length <= FLOOD_LIMIT[role]) return false;
    if (role === "host") console.warn(`team-room: the big screen sent over ${FLOOD_LIMIT.host} messages in ${FLOOD_WINDOW_MS} ms; dropping`);
    return true;
  }
}
