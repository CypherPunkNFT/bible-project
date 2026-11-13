import { handleTeamRoomApi, type RoomNamespace } from "./api";

/** A namespace whose rooms answer create with 409 while their code is "taken". */
function namespace(taken: Set<string>) {
  const calls: { name: string; url: string }[] = [];
  const rooms: RoomNamespace = {
    idFromName: (name: string) => name,
    get: ((id: string) => ({
      fetch: async (request: Request) => {
        calls.push({ name: id, url: request.url });
        if (request.url.includes("/create")) {
          const code = id.slice("team:".length);
          return new Response(JSON.stringify({ code }), { status: taken.has(code) ? 409 : 201 });
        }
        return new Response(JSON.stringify({ exists: true }), { status: 200 });
      },
    })) as never,
  };
  return { rooms, calls };
}

const create = (body: string) => new Request("https://site/api/team-room/rooms", { method: "POST", body });
const goodBody = JSON.stringify({ game: "map-quest", teams: ["Lions", "Eagles"] });

describe("team room API", () => {
  it("creates a room, trying another code when one is in use", async () => {
    const { rooms, calls } = namespace(new Set(["11111"]));
    const codes = ["11111", "22222"];
    const response = await handleTeamRoomApi(create(goodBody), rooms, () => codes.shift()!);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ code: "22222" });
    expect(calls.map((c) => c.name)).toEqual(["team:11111", "team:22222"]);
  });

  it("gives up after five codes in use", async () => {
    const { rooms } = namespace(new Set(["11111"]));
    expect((await handleTeamRoomApi(create(goodBody), rooms, () => "11111")).status).toBe(503);
  });

  it("refuses bad or oversized bodies before touching a room", async () => {
    const { rooms, calls } = namespace(new Set());
    expect((await handleTeamRoomApi(create("{}"), rooms)).status).toBe(400);
    expect((await handleTeamRoomApi(create("x".repeat(3000)), rooms)).status).toBe(413);
    expect(calls).toHaveLength(0);
  });

  it("routes the join check and the socket upgrade to the room, and nothing else", async () => {
    const { rooms, calls } = namespace(new Set());
    const at = (path: string, init?: RequestInit) => handleTeamRoomApi(new Request(`https://site/api/team-room/rooms/${path}`, init), rooms);
    expect((await at("48213")).status).toBe(200);
    expect((await at("48213/socket")).status).toBe(426);
    expect((await at("48213/socket", { headers: { Upgrade: "websocket" } })).status).toBe(200);
    expect((await at("01234")).status).toBe(404);
    expect((await at("482913")).status).toBe(404);
    expect((await at("48213", { method: "DELETE" })).status).toBe(405);
    expect(calls.map((c) => c.name)).toEqual(["team:48213", "team:48213"]);
  });

  it("says plainly when the room binding is missing", async () => {
    expect((await handleTeamRoomApi(create(goodBody), undefined)).status).toBe(503);
  });
});
