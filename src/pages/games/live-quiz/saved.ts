// What the live quiz keeps in this browser's localStorage, for the room's life only (design.md 6.5, 7.1, 7.2): the
// leader's token and choices, so a reload resumes the same room; a phone's player id and token, so it rejoins as
// itself; and a phone's "removed from this game" mark. Keyed by code and the room's own id, since codes are reused
// after a room is wiped.
import type { PickFilters } from "@/lib/live-quiz/pick";

const ROOM_LIFE_MS = 6 * 3600_000;
const HOST_KEY = "bible-live-quiz:host";
const playerKey = (code: string) => `bible-live-quiz:player:${code}`;
const removedKey = (code: string, roomId: string) => `bible-live-quiz:removed:${code}:${roomId}`;

export interface SavedHost { code: string; roomId: string; token: string; savedAt: number; filters: PickFilters; count: number; theme: string }
export interface SavedPlayer { code: string; roomId: string; playerId: string; token: string; savedAt: number }

function read<T extends { savedAt: number }>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as T;
    if (typeof value?.savedAt !== "number" || Date.now() - value.savedAt > ROOM_LIFE_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch (error) {
    console.warn(`live-quiz: could not read ${key} from this browser's storage`, error);
    return null;
  }
}

function write(key: string, value: unknown | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`live-quiz: could not save ${key} in this browser's storage`, error);
  }
}

export const savedHost = () => read<SavedHost>(HOST_KEY);
export const saveHost = (host: SavedHost | null) => write(HOST_KEY, host);

export const savedPlayer = (code: string) => read<SavedPlayer>(playerKey(code));
export const savePlayer = (code: string, player: SavedPlayer | null) => write(playerKey(code), player);

export const isRemoved = (code: string, roomId: string) => read<{ savedAt: number }>(removedKey(code, roomId)) !== null;
export const markRemoved = (code: string, roomId: string) => write(removedKey(code, roomId), { savedAt: Date.now() });
