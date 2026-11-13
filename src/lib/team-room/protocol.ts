// Team play's messages (docs/features/team-play/design.md, sections 2 and Review 1-8): the shapes the room, the
// laptop and the team phones send each other, their limits, and a validator for everything that arrives. The room knows
// no game rules: the laptop sends each team a `view` (any JSON its game defines) and phones send `input` (any JSON).
// Shared by the browser bundle, the Pages Function build and the room bundle, so: relative imports only, no DOM.

export const TEAM_GAMES = ["memory-match", "map-quest"] as const;
export type TeamGame = (typeof TEAM_GAMES)[number];

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 6;
export const TEAM_NAME_MAX = 20;
export const TOKEN_MAX = 64;

/** Bytes. */
export const MAX_CREATE_BODY = 2048;
export const MAX_PHONE_MESSAGE = 1024;
export const MAX_HOST_MESSAGE = 16 * 1024;
export const MAX_SOCKETS = 60;

/** A held team whose phone has been away this long may be claimed by another phone (Review 2). */
export const AWAY_RELEASE_MS = 2 * 60_000;
/** The room is wiped this long after its last message, and in any case this long after it was made. */
export const IDLE_WIPE_MS = 3 * 60 * 60_000;
export const MAX_LIFE_MS = 12 * 60 * 60_000;
/** The wipe alarm is moved at most this often (each move is a storage write; Review 7). */
export const REARM_EVERY_MS = 5 * 60_000;

/** Heartbeat (Review 5): a phone sends the text PING; the room answers PONG without waking. */
export const PING = "ping";
export const PONG = "pong";

/** Socket close codes. All are final: the page does not reconnect after them. */
export const CLOSE = { replaced: 4002, ended: 4003, notFound: 4004, teamTaken: 4006 } as const;
export const FINAL_CLOSES: readonly number[] = Object.values(CLOSE);

export type ErrorCode = "bad-message" | "auth" | "team-held" | "team-taken" | "unknown-team" | "not-found";

// ---- Client → room -------------------------------------------------------------------------------------------------

export type HostMessage =
  | { t: "host"; token: string }
  | { t: "view"; team: string; view: unknown }
  | { t: "free"; team: string }
  | { t: "end" };

export type PhoneMessage =
  | { t: "claim"; team: string }
  | { t: "rejoin"; team: string; token: string }
  | { t: "input"; data: unknown };

export type ClientMessage = HostMessage | PhoneMessage;
export type Role = "none" | "host" | "team";

// ---- Room → client -------------------------------------------------------------------------------------------------

/** open: a phone may take it; held: its phone is here; away: its phone dropped and still holds it. */
export type TeamState = "open" | "held" | "away";
export interface TeamStatus { id: string; name: string; state: TeamState }

export type ServerMessage =
  | { t: "teams"; teams: TeamStatus[] }
  | { t: "input"; team: string; data: unknown }
  | { t: "claimed"; team: string; name: string; token: string }
  | { t: "view"; view: unknown }
  | { t: "host"; online: boolean }
  | { t: "error"; code: ErrorCode; message: string };

export interface RoomInfo { exists: boolean; game: TeamGame | null; teams: TeamStatus[] }

// ---- Validation ----------------------------------------------------------------------------------------------------

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export const isTeamCode = (code: string) => /^[1-9]\d{4}$/.test(code);

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isShortText = (value: unknown, max: number): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
/** A control character (line breaks, tabs, C1 codes): never part of a team name. */
const hasControl = (text: string) => Array.from(text).some((char) => {
  const code = char.charCodeAt(0);
  return code < 0x20 || (code >= 0x7f && code <= 0x9f);
});

/** A team name as the leader typed it, trimmed and with runs of spaces closed up, or null if unusable. */
export function cleanTeamName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim();
  if (!name || name.length > TEAM_NAME_MAX || hasControl(name)) return null;
  return name;
}

/** The create request: a game and 2-6 distinct team names. */
export function parseCreateBody(raw: string): { game: TeamGame; teams: string[] } | null {
  if (byteLength(raw) > MAX_CREATE_BODY) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(value) || !TEAM_GAMES.includes(value.game as TeamGame) || !Array.isArray(value.teams)) return null;
  if (value.teams.length < MIN_TEAMS || value.teams.length > MAX_TEAMS) return null;
  const teams = value.teams.map(cleanTeamName);
  if (teams.some((name) => name === null)) return null;
  if (new Set(teams.map((name) => name!.toLowerCase())).size !== teams.length) return null;
  return { game: value.game as TeamGame, teams: teams as string[] };
}

export type Parsed = { ok: true; message: ClientMessage } | { ok: false };

/** Reads one socket message, given who sent it: a socket may only send its role's messages. A phone signs in once
 *  (claim or rejoin) per connection; changing team means a new connection. */
export function parseClientMessage(raw: string, role: Role): Parsed {
  const limit = role === "host" ? MAX_HOST_MESSAGE : MAX_PHONE_MESSAGE;
  if (raw.length > limit || byteLength(raw) > limit) return { ok: false };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  if (!isObject(value) || typeof value.t !== "string") return { ok: false };
  const ok = (message: ClientMessage): Parsed => ({ ok: true, message });
  switch (value.t) {
    case "host":
      return role !== "team" && isShortText(value.token, TOKEN_MAX) ? ok({ t: "host", token: value.token }) : { ok: false };
    case "claim":
      return role === "none" && isShortText(value.team, 8) ? ok({ t: "claim", team: value.team }) : { ok: false };
    case "rejoin":
      return role === "none" && isShortText(value.team, 8) && isShortText(value.token, TOKEN_MAX)
        ? ok({ t: "rejoin", team: value.team, token: value.token }) : { ok: false };
    case "input":
      return role === "team" && "data" in value ? ok({ t: "input", data: value.data }) : { ok: false };
    case "view":
      return role === "host" && isShortText(value.team, 8) && "view" in value ? ok({ t: "view", team: value.team, view: value.view }) : { ok: false };
    case "free":
      return role === "host" && isShortText(value.team, 8) ? ok({ t: "free", team: value.team }) : { ok: false };
    case "end":
      return role === "host" ? ok({ t: "end" }) : { ok: false };
    default:
      return { ok: false };
  }
}
