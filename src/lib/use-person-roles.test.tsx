// On a translated page the people rows hold translated descriptions; the roles still come from the English list.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { PersonRow } from "@/lib/study";

const english = [
  { id: "david", n: "David", b: "Anointed king of Israel, ancestor of Jesus Christ" },
  { id: "moses", n: "Moses", b: "Prophet who led Israel out of Egypt" },
  { id: "aaron", n: "Aaron", b: "Moses' brother, first high priest of Israel" },
  { id: "tribe", n: "Judah", b: "Tribe of Judah", g: 1 },
] as unknown as PersonRow[];
vi.mock("@/lib/study", () => ({ loadEnglishPeople: () => Promise.resolve(english) }));
const { usePersonRoles } = await import("./use-person-roles");

afterEach(cleanup);

describe("usePersonRoles", () => {
  it("reads the roles from the English descriptions, for the rows given only", async () => {
    const spanish = [
      { id: "david", n: "David", b: "Rey ungido de Israel, antepasado de Jesucristo" },
      { id: "moses", n: "Moisés", b: "Profeta que sacó a Israel de Egipto" },
      { id: "aaron", n: "Aarón", b: "Hermano de Moisés, primer sumo sacerdote de Israel" },
    ] as unknown as PersonRow[];
    const { result } = renderHook(() => usePersonRoles(spanish));
    await waitFor(() => expect(result.current.get("david")).toBe("king"));
    expect(result.current.get("moses")).toBe("prophet");
    expect(result.current.get("aaron")).toBe("priest");
    expect(result.current.has("tribe")).toBe(false);
  });
});
