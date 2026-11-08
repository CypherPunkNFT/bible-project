// Shared fixtures for the live quiz's tests: questions, rooms and in-memory fakes of the Durable Object's storage and
// sockets. Imported only by *.test.ts files.
import { createRoom, type Room } from "./engine";
import { DEFAULT_SETTINGS, type QuizQuestion, type RoomSettings } from "./protocol";
import type { Attachment, RoomSockets, RoomStorage } from "./room-core";

export const question = (n: number, patch: Partial<QuizQuestion> = {}): QuizQuestion => ({
  id: `q${n}`, text: `Question number ${n}?`, leadIn: null, options: ["Alpha", "Beta", "Gamma", "Delta"], correct: n % 4,
  reference: `Genesis ${n}:1`, link: { book: "GEN", chapter: n, verse: 1 }, ...patch,
});

export const questions = (count: number) => Array.from({ length: count }, (_, i) => question(i + 1));

export function makeRoom(count = 3, settings: Partial<RoomSettings> = {}, now = 1_000_000): Room {
  return createRoom({ roomId: "room1", code: "482913", now, hostTokenHash: "hosthash", settings: { ...DEFAULT_SETTINGS, ...settings }, questions: questions(count) });
}

export class MemoryStorage implements RoomStorage {
  data = new Map<string, unknown>();
  alarm: number | null = null;
  writes = 0;
  async get<T>(key: string) { return this.copy(this.data.get(key)) as T | undefined; }
  async list<T>(prefix: string) {
    const out = new Map<string, T>();
    for (const [key, value] of this.data) if (key.startsWith(prefix)) out.set(key, this.copy(value) as T);
    return out;
  }
  async put(entries: Record<string, unknown>) {
    for (const [key, value] of Object.entries(entries)) { this.data.set(key, this.copy(value)); this.writes++; }
  }
  async delete(keys: string[]) { for (const key of keys) this.data.delete(key); }
  async deleteAll() { this.data.clear(); }
  async setAlarm(at: number) { this.alarm = at; }
  async deleteAlarm() { this.alarm = null; }
  // Storage keeps a copy, as the real one serialises: later changes in memory must be written to count.
  private copy(value: unknown) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
}

export class FakeSocket {
  sent: Record<string, unknown>[] = [];
  closed: { code: number; reason: string } | null = null;
  attachment: Attachment | null = null;
  constructor(readonly name: string) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests read nested fields of whatever was sent
  last(type?: string) { return [...this.sent].reverse().find((m) => !type || m.t === type) as Record<string, any> | undefined; }
}

export class FakeSockets implements RoomSockets<FakeSocket> {
  list: FakeSocket[] = [];
  add(name: string) { const socket = new FakeSocket(name); this.list.push(socket); return socket; }
  all() { return this.list.filter((s) => !s.closed); }
  send(socket: FakeSocket, text: string) { if (!socket.closed) socket.sent.push(JSON.parse(text)); }
  close(socket: FakeSocket, code: number, reason: string) { socket.closed = { code, reason }; }
  get(socket: FakeSocket) { return socket.attachment; }
  set(socket: FakeSocket, attachment: Attachment) { socket.attachment = attachment; }
}
