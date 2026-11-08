import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { CLOSE } from "@/lib/live-quiz/protocol";
import { useRoomSocket } from "./useRoomSocket";

/** A stand-in WebSocket the test opens, feeds and closes by hand. */
class FakeSocket {
  static OPEN = 1;
  static all: FakeSocket[] = [];
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  constructor(public url: string) { FakeSocket.all.push(this); }
  send(data: string) { this.sent.push(data); }
  close() { this.readyState = 3; }
  open() { this.readyState = 1; this.onopen?.(); }
  state() { this.onmessage?.({ data: JSON.stringify({ t: "state", serverNow: Date.now() }) }); }
  drop(code = 1006) { this.readyState = 3; this.onclose?.({ code }); }
}

const roomInfo = (exists: boolean) => vi.fn(() => Promise.resolve(new Response(JSON.stringify({ exists }), { status: 200 })));
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });

beforeEach(() => {
  FakeSocket.all = [];
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", FakeSocket);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function playing() {
  const hook = renderHook(() => useRoomSocket("482913", () => ({ t: "join", name: "Sam" }), () => {}));
  const first = FakeSocket.all[0];
  act(() => { first.open(); first.state(); });
  expect(hook.result.current.status).toBe("open");
  act(() => first.drop());
  expect(hook.result.current.status).toBe("reconnecting");
  act(() => { vi.advanceTimersByTime(500); });
  return hook;
}

describe("the live quiz's connection", () => {
  it("signs in on open and goes on with backoff after a drop", () => {
    vi.stubGlobal("fetch", roomInfo(true));
    playing();
    expect(FakeSocket.all).toHaveLength(2);
    expect(JSON.parse(FakeSocket.all[0].sent[0])).toEqual({ t: "join", name: "Sam" });
  });

  it("stops and says the game has gone when a refused reconnect finds no room", async () => {
    const fetch = roomInfo(false);
    vi.stubGlobal("fetch", fetch);
    const hook = playing();
    act(() => FakeSocket.all[1].drop()); // turned away before it opened
    await flush();
    expect(fetch).toHaveBeenCalledWith("/api/live-quiz/rooms/482913", expect.objectContaining({ cache: "no-store" }));
    expect(hook.result.current.status).toBe("closed");
    expect(hook.result.current.closeCode).toBe(CLOSE.notFound);
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(FakeSocket.all).toHaveLength(2); // no more tries
  });

  it("keeps trying while the room is still there, and asks only once per outage", async () => {
    const fetch = roomInfo(true);
    vi.stubGlobal("fetch", fetch);
    const hook = playing();
    act(() => FakeSocket.all[1].drop());
    await flush();
    expect(hook.result.current.status).toBe("reconnecting");
    act(() => { vi.advanceTimersByTime(1000); });
    expect(FakeSocket.all).toHaveLength(3);
    act(() => FakeSocket.all[2].drop());
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("ignores the answer if a newer connection opened meanwhile", async () => {
    let answer: (response: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { answer = resolve; })));
    const hook = playing();
    act(() => FakeSocket.all[1].drop());
    act(() => { vi.advanceTimersByTime(1000); FakeSocket.all[2].open(); FakeSocket.all[2].state(); });
    answer(new Response(JSON.stringify({ exists: false }), { status: 200 }));
    await flush();
    expect(hook.result.current.status).toBe("open");
  });
});
