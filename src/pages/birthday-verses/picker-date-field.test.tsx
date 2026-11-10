// The occasion picker's birthday date field (docs/features/birthday-verses/design.md 7.5): shown in the Birthday
// occasion only, with the date's reference and note, the picker's own "Add to our list", and the date page's link.
// The date itself never goes into the picker's address.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lastAddress, renderAt, serveBerean } from "@/pages/occasion-verses/test-kit";

beforeEach(() => {
  serveBerean();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 2, 16, 12, 0));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("occasion picker: the birthday date field", () => {
  it("starts on today, follows the chosen date, and links to that date's page", () => {
    renderAt("/occasion-verses?o=birthday");
    const field = screen.getByRole("region", { name: "Your verse for your birthday" });
    expect(field).toHaveTextContent("John 3:16");
    expect(within(field).getByRole("link", { name: "Open this date's page and card" })).toHaveAttribute("href", "/birthday-verses/march-16");
    fireEvent.change(within(field).getByLabelText("Month"), { target: { value: "2" } });
    fireEvent.change(within(field).getByLabelText("Day"), { target: { value: "29" } });
    expect(within(field).getByRole("link", { name: "Open this date's page and card" })).toHaveAttribute("href", "/birthday-verses/february-29");
    expect(lastAddress()).toBe("/occasion-verses?o=birthday");
  });

  it("adds the date's verse to our list by its key, never the date", async () => {
    renderAt("/occasion-verses?o=birthday");
    const field = screen.getByRole("region", { name: "Your verse for your birthday" });
    fireEvent.click(within(field).getByRole("checkbox", { name: "Add to our list" }));
    await waitFor(() => expect(lastAddress()).toBe("/occasion-verses?o=birthday&list=john-3-16"));
    expect(lastAddress()).not.toMatch(/march|03-16/);
  });

  it("is not shown for other occasions", () => {
    renderAt("/occasion-verses?o=wedding");
    expect(screen.queryByRole("region", { name: "Your verse for your birthday" })).toBeNull();
  });
});
