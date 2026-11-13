import { CLOSE, IDLE_WIPE_MS, AWAY_RELEASE_MS, MAX_LIFE_MS } from "./protocol";
import { hashToken, TeamRoomCore, type Attachment, type RoomSockets, type RoomStorage } from "./core";

class MemoryStorage implements RoomStorage {
  data = new Map<string, unknown>();
  alarm: number | null = null;
  async get<T>(key: string) { return this.copy(this.data.get(key)) as T | undefined; }
  async list<T>(prefix: string) {
    const out = new Map<string, T>();
    for (const [key, value] of this.data) if (key.startsWith(prefix)) out.set(key, this.copy(value) as T);
    return out;
  }
  async put(entries: Record<string, unknown>) { for (const [key, value] of Object.entries(entries)) this.data.set(key, this.copy(value)); }
  async deleteAll() { this.data.clear(); }
  async setAlarm(at: number) { this.alarm = at; }
  async deleteAlarm() { this.alarm = null; }
  private copy(value: unknown) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
}

class FakeSocket {
  sent: unknown[] = [];
  closed: { code: number; reason: string } | null = null;
  attachment: Attachment | null = null;
  constructor(readonly name: string) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests read nested fields of whatever was sent
  last(type?: string): Record<string, any> | undefined {
    return [...this.sent].reverse().find((m) => typeof m === "object" && (!type || (m as { t: string }).t === type)) as Record<string, unknown> | undefined;
  }
}

class FakeSockets implements RoomSockets<FakeSocket> {
  list: FakeSocket[] = [];
  add(name: string) { const socket = new FakeSocket(name); this.list.push(socket); return socket; }
  all() { return this.list.filter((s) => !s.closed); }
  send(socket: FakeSocket, text: string) { if (!socket.closed) socket.sent.push(text === "pong" ? text : JSON.parse(text)); }
  close(socket: FakeSocket, code: number, reason: string) { socket.closed = { code, reason }; }
  get(socket: FakeSocket) { return socket.attachment; }
  set(socket: FakeSocket, attachment: Attachment) { socket.attachment = attachment; }
}

const BODY = JSON.stringify({ game: "memory-match", teams: ["Lions", "Eagles", "Bears"] });

async function setup() {
  let now = 1_000_000;
  const storage = new MemoryStorage();
  const sockets = new FakeSockets();
  const core = new TeamRoomCore(storage, sockets, () => now);
  const created = await core.create("48213", BODY);
  if (!("token" in created.body)) throw new Error("create failed");
  const hostToken = created.body.token;
  const connect = (name: string) => { const socket = sockets.add(name); core.open(socket); return socket; };
  const say = (socket: FakeSocket, message: unknown) => core.message(socket, JSON.stringify(message));
  const drop = async (socket: FakeSocket) => { socket.closed = { code: 1006, reason: "" }; await core.close(socket); };
  const host = connect("host");
  await say(host, { t: "host", token: hostToken });
  return { storage, sockets, core, host, hostToken, connect, say, drop, tick: (ms: number) => (now += ms), now: () => now };
}

async function claimAs(t: Awaited<ReturnType<typeof setup>>, team: string, name = `phone-${team}`) {
  const phone = t.connect(name);
  await t.say(phone, { t: "claim", team });
  const claimed = phone.last("claimed");
  if (!claimed) throw new Error(`claim failed: ${JSON.stringify(phone.last())}`);
  return { phone, token: claimed.token as string };
}

const stateOf = (host: FakeSocket, team: string) => (host.last("teams")!.teams as { id: string; state: string }[]).find((s) => s.id === team)?.state;

describe("team room core", () => {
  it("creates a room once, keeping only the laptop token's hash, and refuses bad bodies", async () => {
    const t = await setup();
    const stored = JSON.stringify([...t.storage.data.values()]);
    expect(stored).not.toContain(t.hostToken);
    expect(stored).toContain(await hashToken(t.hostToken));
    expect((await t.core.create("48213", BODY)).status).toBe(409);
    const fresh = new TeamRoomCore(new MemoryStorage(), new FakeSockets());
    expect((await fresh.create("11111", JSON.stringify({ game: "memory-match", teams: ["Solo"] }))).status).toBe(400);
    expect((await fresh.create("11111", JSON.stringify({ game: "memory-match", teams: ["A", "a"] }))).status).toBe(400);
    expect((await fresh.create("11111", JSON.stringify({ game: "chess", teams: ["A", "B"] }))).status).toBe(400);
    expect(t.host.last("teams")!.teams).toEqual([
      { id: "t1", name: "Lions", state: "open" }, { id: "t2", name: "Eagles", state: "open" }, { id: "t3", name: "Bears", state: "open" }]);
  });

  it("refuses a wrong laptop token, and a second laptop screen replaces the first", async () => {
    const t = await setup();
    const impostor = t.connect("impostor");
    await t.say(impostor, { t: "host", token: "not-the-token" });
    expect(impostor.last("error")).toMatchObject({ code: "auth" });
    expect(impostor.closed?.code).toBe(CLOSE.notFound);
    const second = t.connect("host2");
    await t.say(second, { t: "host", token: t.hostToken });
    expect(t.host.closed?.code).toBe(CLOSE.replaced);
    expect(second.last("teams")).toBeTruthy();
  });

  it("gives a team to one phone only, even when two claim at once (Review 1)", async () => {
    const t = await setup();
    const a = t.connect("a");
    const b = t.connect("b");
    await Promise.all([t.say(a, { t: "claim", team: "t1" }), t.say(b, { t: "claim", team: "t1" })]);
    const winners = [a, b].filter((p) => p.last("claimed"));
    expect(winners).toHaveLength(1);
    expect([a, b].find((p) => !p.last("claimed"))!.last("error")).toMatchObject({ code: "team-held" });
    expect(stateOf(t.host, "t1")).toBe("held");
  });

  it("keeps a team for its phone while it is away, and releases it after two minutes (Review 2)", async () => {
    const t = await setup();
    const first = await claimAs(t, "t1");
    await t.drop(first.phone);
    expect(stateOf(t.host, "t1")).toBe("away");
    const stranger = t.connect("stranger");
    await t.say(stranger, { t: "claim", team: "t1" });
    expect(stranger.last("error")).toMatchObject({ code: "team-held" });
    const back = t.connect("back");
    await t.say(back, { t: "rejoin", team: "t1", token: first.token });
    expect(back.last("host")).toEqual({ t: "host", online: true });
    await t.drop(back);
    t.tick(AWAY_RELEASE_MS);
    const other = t.connect("other");
    await t.say(other, { t: "claim", team: "t1" });
    expect(other.last("claimed")).toBeTruthy();
    const late = t.connect("late");
    await t.say(late, { t: "rejoin", team: "t1", token: first.token });
    expect(late.closed?.code).toBe(CLOSE.teamTaken);
  });

  it("lets the leader free a held team for another phone", async () => {
    const t = await setup();
    const { phone } = await claimAs(t, "t2");
    await t.say(t.host, { t: "free", team: "t2" });
    expect(phone.closed?.code).toBe(CLOSE.teamTaken);
    expect(stateOf(t.host, "t2")).toBe("open");
    await claimAs(t, "t2", "new");
  });

  it("passes inputs to the laptop and views to the phones, remembering each team's latest (Review 4)", async () => {
    const t = await setup();
    const lions = await claimAs(t, "t1");
    const eagles = await claimAs(t, "t2");
    await t.say(lions.phone, { t: "input", data: { flip: 3, v: 7 } });
    expect(t.host.last("input")).toEqual({ t: "input", team: "t1", data: { flip: 3, v: 7 } });
    await t.say(t.host, { t: "view", team: "*", view: { v: 1 } });
    await t.say(t.host, { t: "view", team: "t2", view: { v: 2 } });
    expect(lions.phone.last("view")!.view).toEqual({ v: 1 });
    expect(eagles.phone.last("view")!.view).toEqual({ v: 2 });
    await t.say(t.host, { t: "view", team: "t9", view: {} });
    expect(t.host.last("error")).toMatchObject({ code: "unknown-team" });
    await t.drop(eagles.phone);
    const again = t.connect("again");
    await t.say(again, { t: "rejoin", team: "t2", token: eagles.token });
    expect(again.last("view")!.view).toEqual({ v: 2 });
    await t.say(t.host, { t: "view", team: "*", view: { v: 3 } });
    const bears = await claimAs(t, "t3");
    expect(bears.phone.last("view")!.view).toEqual({ v: 3 });
  });

  it("tells phones when the big screen leaves, and refuses inputs while it is away", async () => {
    const t = await setup();
    const { phone } = await claimAs(t, "t1");
    await t.drop(t.host);
    expect(phone.last("host")).toEqual({ t: "host", online: false });
    phone.sent = [];
    await t.say(phone, { t: "input", data: 1 });
    expect(phone.last("host")).toEqual({ t: "host", online: false });
    const host = t.connect("host-again");
    await t.say(host, { t: "host", token: t.hostToken });
    expect(phone.last("host")).toEqual({ t: "host", online: true });
  });

  it("only lets each role send its own messages", async () => {
    const t = await setup();
    const { phone } = await claimAs(t, "t1");
    await t.say(phone, { t: "view", team: "*", view: {} });
    expect(phone.last("error")).toMatchObject({ code: "bad-message" });
    await t.say(phone, { t: "end" });
    expect(t.core.record).not.toBeNull();
    await t.say(t.host, { t: "input", data: 1 });
    expect(t.host.last("error")).toMatchObject({ code: "bad-message" });
  });

  it("drops a phone's flood quietly instead of closing it, and answers pings", async () => {
    const t = await setup();
    const { phone } = await claimAs(t, "t1");
    for (let n = 0; n < 40; n++) await t.say(phone, { t: "input", data: n });
    expect(phone.closed).toBeNull();
    expect(t.host.sent.filter((m) => (m as { t: string }).t === "input").length).toBeLessThan(25);
    await t.core.message(phone, "ping");
    expect(phone.sent.at(-1)).toBe("pong");
  });

  it("survives hibernation: a core rebuilt from storage keeps the teams and their tokens", async () => {
    const t = await setup();
    const lions = await claimAs(t, "t1");
    const woken = new TeamRoomCore(t.storage, t.sockets, t.now);
    await woken.load();
    const tab = t.sockets.add("tab");
    woken.open(tab);
    await woken.message(tab, JSON.stringify({ t: "rejoin", team: "t1", token: lions.token }));
    expect(lions.phone.closed?.code).toBe(CLOSE.replaced);
    expect(tab.last("host")).toEqual({ t: "host", online: true });
  });

  it("ends at once on End, and wipes itself when idle or too old", async () => {
    const t = await setup();
    const { phone } = await claimAs(t, "t1");
    await t.say(t.host, { t: "end" });
    expect(phone.closed?.code).toBe(CLOSE.ended);
    expect(t.storage.data.size).toBe(0);

    const idle = await setup();
    expect(idle.storage.alarm).toBe(idle.now() + IDLE_WIPE_MS);
    idle.tick(IDLE_WIPE_MS);
    await idle.core.alarm();
    expect(idle.core.record).toBeNull();
    expect(idle.storage.data.size).toBe(0);

    const busy = await setup();
    const { phone: p } = await claimAs(busy, "t1");
    for (let hour = 0; hour < 12; hour++) {
      busy.tick(60 * 60_000);
      await busy.say(p, { t: "input", data: hour });
      await busy.core.alarm();
    }
    expect(busy.core.record).toBeNull();
    expect(MAX_LIFE_MS).toBe(12 * 60 * 60_000);
  });
});
