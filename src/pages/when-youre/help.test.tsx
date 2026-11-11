import { readFileSync } from "node:fs";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LifeData } from "@/data/resources";
import { WHEN_TOPICS } from "@/data/when-youre";
import { DEVICE_SAFETY, FALLBACK_HELP, URGENT_HELP, urgentMatches } from "@/data/when-youre/help";
import { contactHref, primaryHelpReady } from "./help-contacts";
import { installEscapeExit, EXIT_ADDRESS } from "./quick-exit";
import { UrgentHelp } from "./Help";
import { useHelpDirectory } from "./useHelpDirectory";

const mocks = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("@/data/resources", () => ({ loadResource: mocks.load }));
const life = JSON.parse(readFileSync("src/data/resources/life.json", "utf8")) as LifeData;
const entries = () => new Map(life.groups.flatMap((group) => group.entries).map((entry) => [entry.id, structuredClone(entry)]));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("help directory contracts", () => {
  it("resolves every planned support ID against the actual directory", () => {
    const all = entries();
    for (const id of [...Object.values(URGENT_HELP).flat(), ...WHEN_TOPICS.flatMap((topic) => topic.help.entries)]) expect(all.has(id), id).toBe(true);
  });
  it.each([false, true])("requires every primary contact, abuse=%s", (abused) => {
    expect(primaryHelpReady(entries(), abused)).toBe(true);
    const id = abused ? "domestic-violence-hotline" : "988-lifeline";
    for (const kind of ["call", "text", "chat"]) {
      const all = entries();
      const entry = all.get(id)!;
      entry.contact = entry.contact.filter((c) => kind === "call" ? !/phone|call|tel|voice|line/i.test(c.kind) : !c.kind.toLowerCase().includes(kind));
      expect(primaryHelpReady(all, abused), kind).toBe(false);
    }
    for (const missing of [id, "emergency-911", "find-a-helpline"]) {
      const all = entries(); all.delete(missing);
      expect(primaryHelpReady(all, abused), missing).toBe(false);
    }
  });
  it("keeps manual text instructions and chooses actual chat kinds", () => {
    const text = life.groups.flatMap((g) => g.entries).find((e) => e.id === "crisis-text-line")!.contact.find((c) => /text/i.test(c.kind))!;
    expect(contactHref(text)).toMatch(/^sms:/);
    expect(text.note).toBeTruthy();
    expect(contactHref({ kind: "chat", value: "javascript:alert(1)" })).toBeNull();
    expect(contactHref({ kind: "phone", value: "+1 (555) 123-4567" })).toBe("tel:+15551234567");
  });
});

describe("local crisis navigation aid", () => {
  it.each(["self-harm", "SELF HARM", "selfharm", "I want to die", "kill myself", "end my life", "hurt myself"])("recognises %s", (query) => {
    expect(urgentMatches(query)).toContain("thinking-of-suicide");
  });
  it("offers both kinds of help without diagnosing the reader", () => {
    expect(urgentMatches("My partner hits me and I’m self-harming")).toEqual(["thinking-of-suicide", "abused"]);
    expect(urgentMatches("worried")).toEqual([]);
  });
});

describe("Escape quick exit", () => {
  it("ignores repeats, resets expired pairs, exits promptly and cleans up", () => {
    let time = 0;
    const exit = vi.fn();
    const remove = installEscapeExit(window, exit, () => time);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: "Escape", repeat: true });
    expect(exit).not.toHaveBeenCalled();
    time = 1001;
    fireEvent.keyDown(window, { key: "Escape" });
    expect(exit).not.toHaveBeenCalled();
    time = 1200;
    fireEvent.keyDown(window, { key: "Escape" });
    expect(exit).toHaveBeenCalledTimes(1);
    remove();
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(exit).toHaveBeenCalledTimes(1);
    expect(EXIT_ADDRESS).toBe("https://www.google.com/");
  });
});

function LoadHelp() { const directory = useHelpDirectory(); return <UrgentHelp topic="abused" directory={directory} />; }

describe("urgent help availability", () => {
  it.each(["pending", "null", "rejected"])("retains fallback and retry during %s loads", async (mode) => {
    mocks.load.mockImplementation(() => mode === "pending" ? new Promise(() => {}) : mode === "null" ? Promise.resolve(null) : Promise.reject(new Error("offline")));
    render(<MemoryRouter><LoadHelp /></MemoryRouter>);
    expect(screen.getByText(FALLBACK_HELP, { exact: false })).toBeVisible();
    expect(screen.getByText(DEVICE_SAFETY)).toBeVisible();
    expect(screen.getByRole("button", { name: /Leave this page/ })).toBeVisible();
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: "Retry help directory" }));
    await waitFor(() => expect(mocks.load.mock.calls.length).toBeGreaterThan(1));
  });
  it("retains full fallback when a primary contact alone is missing", () => {
    const all = entries();
    all.get("domestic-violence-hotline")!.contact = all.get("domestic-violence-hotline")!.contact.filter((c) => !/chat/i.test(c.kind));
    render(<MemoryRouter><UrgentHelp topic="abused" directory={{ entries: all, retry: vi.fn() }} /></MemoryRouter>);
    expect(screen.getByText(FALLBACK_HELP, { exact: false })).toBeVisible();
    expect(screen.getByRole("region").querySelectorAll("p")).toHaveLength(0);
  });
});
