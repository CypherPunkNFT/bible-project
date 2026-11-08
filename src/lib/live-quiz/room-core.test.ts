import { GRACE_MS } from "./engine";
import { CLOSE, DEFAULT_SETTINGS } from "./protocol";
import { FLOOD_LIMIT, hashToken, RoomCore } from "./room-core";
import { FakeSockets, MemoryStorage, questions, type FakeSocket } from "./live-quiz.test.fixtures";

const body = (count = 3, settings = DEFAULT_SETTINGS) => JSON.stringify({ questions: questions(count), settings });

async function setup() {
  let now = 1_000_000;
  const storage = new MemoryStorage();
  const sockets = new FakeSockets();
  const core = new RoomCore(storage, sockets, () => now);
  const created = await core.create("482913", body());
  if (!("token" in created.body)) throw new Error("create failed");
  const hostToken = created.body.token;
  const connect = (name: string) => { const socket = sockets.add(name); core.open(socket); return socket; };
  const say = (socket: FakeSocket, message: unknown) => core.message(socket, JSON.stringify(message));
  const host = connect("host");
  await say(host, { t: "host", token: hostToken });
  return { storage, sockets, core, host, hostToken, connect, say, tick: (ms: number) => (now += ms), now: () => now };
}

async function joinAs(t: Awaited<ReturnType<typeof setup>>, name: string) {
  const phone = t.connect(name);
  await t.say(phone, { t: "join", name });
  const joined = phone.last("joined");
  if (!joined) throw new Error(`join failed: ${JSON.stringify(phone.last())}`);
  return { phone, playerId: joined.playerId as string, token: joined.token as string };
}

describe("room core", () => {
  it("creates a room once, keeping only the leader token's hash", async () => {
    const t = await setup();
    const stored = JSON.stringify([...t.storage.data.values()]);
    expect(stored).not.toContain(t.hostToken);
    expect(stored).toContain(await hashToken(t.hostToken));
    expect((await t.core.create("482913", body())).status).toBe(409);
    expect(t.host.last("state")).toMatchObject({ role: "host", phase: "lobby", code: "482913" });
  });

  it("refuses a bad create body and a wrong leader token", async () => {
    const core = new RoomCore(new MemoryStorage(), new FakeSockets());
    expect((await core.create("111111", JSON.stringify({ questions: [], settings: DEFAULT_SETTINGS }))).status).toBe(400);
    const t = await setup();
    const impostor = t.connect("impostor");
    await t.say(impostor, { t: "host", token: "not-the-token" });
    expect(impostor.last("error")).toMatchObject({ code: "auth" });
    expect(impostor.closed?.code).toBe(CLOSE.notFound);
  });

  it("survives hibernation: a fresh core rebuilt from storage carries on the same game", async () => {
    const t = await setup();
    const { phone, playerId } = await joinAs(t, "Sam");
    await t.say(t.host, { t: "start" });
    const woken = new RoomCore(t.storage, t.sockets, t.now);
    await woken.load();
    expect(woken.room?.room.phase).toBe("read");
    expect(woken.room?.players[playerId].name).toBe("Sam");
    t.tick(10_000);
    await woken.alarm(); // the read window's deadline
    expect(woken.room?.room.phase).toBe("answer");
    expect(phone.last("state")).toMatchObject({ phase: "answer", correct: null });
  });

  it("keeps one alarm on the next deadline and lets it close the answer window after the grace", async () => {
    const t = await setup();
    const { phone } = await joinAs(t, "Sam");
    await joinAs(t, "Ann");
    await t.say(t.host, { t: "start" });
    const room = t.core.room!.room;
    expect(t.storage.alarm).toBe(room.closesAt);
    t.tick(room.closesAt! - t.now());
    await t.core.alarm();
    expect(t.storage.alarm).toBe(room.closesAt! + GRACE_MS);
    await t.say(phone, { t: "answer", index: 0, choice: room.questions[0].correct });
    expect(phone.last("state")).toMatchObject({ you: { choice: room.questions[0].correct } });
    expect(t.host.last("answered")).toMatchObject({ count: 1, of: 2 });
    t.tick(room.closesAt! + GRACE_MS - t.now());
    await t.core.alarm();
    expect(t.core.room!.room.phase).toBe("reveal");
    expect(phone.last("state")).toMatchObject({ phase: "reveal", you: { result: { right: true, points: 1000 } } });
  });

  it("lets a dropped phone rejoin as itself, and replaces an older tab", async () => {
    const t = await setup();
    const { phone, playerId, token } = await joinAs(t, "Sam");
    const again = t.connect("second tab");
    await t.say(again, { t: "rejoin", playerId, token });
    expect(phone.closed?.code).toBe(CLOSE.replaced);
    expect(again.last("state")).toMatchObject({ role: "player", you: { name: "Sam" } });
    const thief = t.connect("thief");
    await t.say(thief, { t: "rejoin", playerId, token: "guess" });
    expect(thief.closed?.code).toBe(CLOSE.notFound);
  });

  it("closes a removed player's socket and refuses their token afterwards", async () => {
    const t = await setup();
    const { phone, playerId, token } = await joinAs(t, "Sam");
    await t.say(t.host, { t: "kick", playerId });
    expect(phone.closed?.code).toBe(CLOSE.kicked);
    const back = t.connect("back");
    await t.say(back, { t: "rejoin", playerId, token });
    expect(back.last("error")).toMatchObject({ code: "removed" });
    expect(back.closed?.code).toBe(CLOSE.kicked);
  });

  it("closes the question when the last unanswered phone drops", async () => {
    const t = await setup();
    const sam = await joinAs(t, "Sam");
    const ann = await joinAs(t, "Ann");
    await t.say(t.host, { t: "next", phase: "lobby", index: -1 }); // a stale press does nothing
    await t.say(t.host, { t: "start" });
    await t.say(t.host, { t: "skip", phase: "read", index: 0 });
    await t.say(sam.phone, { t: "answer", index: 0, choice: 0 });
    expect(t.core.room!.room.phase).toBe("answer");
    t.sockets.close(ann.phone, 1006, "");
    await t.core.close(ann.phone);
    expect(t.core.room!.room.phase).toBe("reveal");
  });

  it("only lets the leader socket control the game", async () => {
    const t = await setup();
    const { phone } = await joinAs(t, "Sam");
    await t.say(phone, { t: "start" });
    expect(phone.last("error")).toMatchObject({ code: "bad-message" });
    expect(t.core.room!.room.phase).toBe("lobby");
  });

  it("closes a socket that floods the room with messages", async () => {
    const t = await setup();
    const { phone } = await joinAs(t, "Sam");
    for (let i = 0; i < FLOOD_LIMIT + 1; i++) await t.say(phone, { t: "answer", index: 0, choice: 0 });
    expect(phone.closed?.code).toBe(CLOSE.flood);
  });

  it("wipes the room at clean-up time and writes nothing afterwards", async () => {
    const t = await setup();
    const { phone } = await joinAs(t, "Sam");
    t.tick(7 * 3600_000);
    await t.core.alarm();
    expect(t.storage.data.size).toBe(0);
    expect(t.storage.alarm).toBeNull();
    expect(phone.closed?.code).toBe(CLOSE.ended);
    const late = t.connect("late");
    await t.say(late, { t: "join", name: "Ann" });
    expect(t.storage.data.size).toBe(0);
    expect(t.core.info().exists).toBe(false);
  });

  it("ends the game for everyone on End", async () => {
    const t = await setup();
    const { phone } = await joinAs(t, "Sam");
    await t.say(t.host, { t: "end" });
    expect(phone.last("state")).toMatchObject({ phase: "ended" });
    expect(phone.closed?.code).toBe(CLOSE.ended);
    expect(t.core.canAccept()).toBe(false);
  });
});
