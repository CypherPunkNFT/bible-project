import { yearWithEra } from "@/lib/creeds";

describe("creed years", () => {
  it.each([
    ["381", "381 AD"],
    ["AD 60", "60 AD"],
    ["c. 200", "c. 200 AD"],
    ["c. 1500 BC", "c. 1500 BC"],
    ["", ""],
  ])("prints %s as %s", (label, shown) => {
    expect(yearWithEra(label)).toBe(shown);
  });
});
