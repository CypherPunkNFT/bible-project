import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckNotesProvider, Checked } from "./CheckNotes";
import { markRequest, notesById, parseChecked, plainText, type CheckNote } from "./checked";

const note = (id: string, status: CheckNote["status"], extra: Partial<CheckNote> = {}): CheckNote => ({
  id, path: ".a", was: `[check: what ${id} asked]`, status, before: "old words", after: "new words", note: `Found for ${id}.`, marker: true, ...extra,
});

describe("parseChecked and plainText", () => {
  it("splits plain and checked runs in order", () => {
    expect(parseChecked("A {{check:c1}}b{{/check}} c {{check:c2}}{{/check}}.")).toEqual([
      { kind: "plain", text: "A " }, { kind: "check", id: "c1", text: "b" }, { kind: "plain", text: " c " },
      { kind: "check", id: "c2", text: "" }, { kind: "plain", text: "." },
    ]);
  });
  it("reads malformed markers as plain words and never nests", () => {
    expect(parseChecked("x {{check:c1}}y")).toEqual([{ kind: "plain", text: "x {{check:c1}}y" }]);
    expect(parseChecked("{{check:c1}}a {{check:c2}}b{{/check}}")).toEqual([{ kind: "check", id: "c1", text: "a {{check:c2}}b" }]);
  });
  it("strips markers for plain uses", () => {
    expect(plainText("The {{check:c3}}Shephelah{{/check}} rises{{check:c4}}{{/check}}.")).toBe("The Shephelah rises.");
    expect(plainText("no markers")).toBe("no markers");
  });
  it("keeps the first of a repeated id and drops malformed notes", () => {
    const map = notesById([note("c1", "confirmed"), note("c1", "open"), { nope: 1 }, null]);
    expect([...map.keys()]).toEqual(["c1"]);
    expect(map.get("c1")?.status).toBe("confirmed");
    expect(notesById("not a list").size).toBe(0);
  });
  it("shows the mark's request without its brackets", () => {
    expect(markRequest("[check: Jericho's height]")).toBe("Jericho's height");
    expect(markRequest("[check]")).toBe("Check this.");
  });
});

describe("Checked and the note sheet", () => {
  const notes = [note("c1", "corrected"), note("c2", "open", { before: "", after: "" })];
  const page = () => render(<CheckNotesProvider notes={notes}>
    <p><Checked text="It rises {{check:c1}}new words{{/check}} here{{check:c2}}{{/check}} and {{check:c9}}unknown{{/check}}." /></p>
  </CheckNotesProvider>);

  it("highlights known notes as buttons and leaves unknown ids as text", () => {
    page();
    expect(screen.getByRole("button", { name: "new words" })).toHaveClass("chk-mark", "chk-corrected");
    expect(screen.getByRole("button", { name: "new words" }).tagName).toBe("SPAN");
    expect(screen.getByRole("button", { name: /Editor's note: Still open/ })).toHaveClass("chk-dot", "chk-open");
    expect(screen.queryByRole("button", { name: "unknown" })).toBeNull();
    expect(screen.getByText(/unknown/)).toBeInTheDocument();
  });

  it("opens the note on click, shows what changed, and closes on Escape", () => {
    const { container } = page();
    const sheet = () => container.ownerDocument.querySelector(".ms-sheet.chk-panel");
    expect(sheet()).not.toHaveClass("open");
    fireEvent.click(screen.getByRole("button", { name: "new words" }));
    expect(sheet()).toHaveClass("open");
    expect(screen.getByText("what c1 asked")).toBeInTheDocument();
    expect(screen.getByText("old words")).toHaveClass("chk-before");
    expect(screen.getByText("Found for c1.")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(sheet()).not.toHaveClass("open");
  });

  it("opens by keyboard (Enter) too", () => {
    const { container } = page();
    fireEvent.keyDown(screen.getByRole("button", { name: "new words" }), { key: "Enter" });
    expect(container.ownerDocument.querySelector(".ms-sheet.chk-panel")).toHaveClass("open");
  });

  it("calls onOpen so the page can close its own sheet first", () => {
    let closed = 0;
    render(<CheckNotesProvider notes={notes} onOpen={() => { closed += 1; }}><Checked text="{{check:c1}}new words{{/check}}" /></CheckNotesProvider>);
    fireEvent.click(screen.getByRole("button", { name: "new words" }));
    expect(closed).toBe(1);
  });

  it("renders plain words outside a provider", () => {
    render(<p><Checked text="Plain {{check:c1}}words{{/check}}." /></p>);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Plain words.")).toBeInTheDocument();
  });
});
