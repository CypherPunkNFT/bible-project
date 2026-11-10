import { yearWithEra } from "@/lib/creeds";

describe("creed years", () => {
  it.each([
    ["381", "381 AD"],
    ["AD 60", "60 AD"],
    ["c. 200", "c. 200 AD"],
    ["c. 1500 BC", "c. 1500 BC"],
    ["", ""],
    ["30 d. C.", "30 d. C."],
    ["公元 30 年", "公元 30 年"],
    ["c. 1500 a. C.", "c. 1500 a. C."],
  ])("prints %s as %s", (label, shown) => {
    expect(yearWithEra(label)).toBe(shown);
  });
});
