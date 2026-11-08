import { handleLiveQuizApi, type RoomNamespace } from "./api";
import { DEFAULT_SETTINGS } from "./protocol";
import { questions } from "./live-quiz.test.fixtures";

/** A namespace whose rooms answer create with 409 while their code is "taken". */
function namespace(taken: Set<string>) {
  const calls: { name: string; url: string; method: string }[] = [];
  const rooms: RoomNamespace = {
    idFromName: (name: string) => name,
    get: ((id: string) => ({
      fetch: async (request: Request) => {
        calls.push({ name: id, url: request.url, method: request.method });
        if (request.url.includes("/create")) {
          const code = id.slice("room:".length);
          return new Response(JSON.stringify({ code }), { status: taken.has(code) ? 409 : 201 });
        }
        return new Response(JSON.stringify({ exists: true }), { status: 200 });
      },
    })) as never,
  };
  return { rooms, calls };
}

const create = (body: string) => new Request("https://site/api/live-quiz/rooms", { method: "POST", body });
const goodBody = JSON.stringify({ questions: questions(3), settings: DEFAULT_SETTINGS });

describe("live quiz API", () => {
  it("creates a room, trying another code when one is in use", async () => {
    const { rooms, calls } = namespace(new Set(["111111"]));
    const codes = ["111111", "222222"];
    const response = await handleLiveQuizApi(create(goodBody), rooms, () => codes.shift()!);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ code: "222222" });
    expect(calls.map((c) => c.name)).toEqual(["room:111111", "room:222222"]);
  });

  it("gives up after five codes in use", async () => {
    const { rooms } = namespace(new Set(["111111"]));
    expect((await handleLiveQuizApi(create(goodBody), rooms, () => "111111")).status).toBe(503);
  });

  it("refuses bad or oversized bodies before touching a room", async () => {
    const { rooms, calls } = namespace(new Set());
    expect((await handleLiveQuizApi(create("{}"), rooms)).status).toBe(400);
    expect((await handleLiveQuizApi(create("x".repeat(70 * 1024)), rooms)).status).toBe(413);
    expect(calls).toHaveLength(0);
  });

  it("routes the join check and the socket upgrade to the room, and nothing else", async () => {
    const { rooms, calls } = namespace(new Set());
    expect((await handleLiveQuizApi(new Request("https://site/api/live-quiz/rooms/482913"), rooms)).status).toBe(200);
    expect((await handleLiveQuizApi(new Request("https://site/api/live-quiz/rooms/482913/socket"), rooms)).status).toBe(426);
    expect((await handleLiveQuizApi(new Request("https://site/api/live-quiz/rooms/482913/socket", { headers: { Upgrade: "websocket" } }), rooms)).status).toBe(200);
    expect((await handleLiveQuizApi(new Request("https://site/api/live-quiz/rooms/012345"), rooms)).status).toBe(404);
    expect((await handleLiveQuizApi(new Request("https://site/api/live-quiz/rooms/48291x"), rooms)).status).toBe(404);
    expect((await handleLiveQuizApi(new Request("https://site/api/live-quiz/rooms/482913", { method: "DELETE" }), rooms)).status).toBe(405);
    expect(calls.map((c) => c.name)).toEqual(["room:482913", "room:482913"]);
  });

  it("says plainly when the room binding is missing", async () => {
    expect((await handleLiveQuizApi(create(goodBody), undefined)).status).toBe(503);
  });
});
