import { describe, expect, it } from "vitest";
import { assignRoles, roleOf } from "./people-roles";

const people = [
  { id: "david", n: "David", b: "Anointed king of Israel, ancestor of Jesus Christ" },
  { id: "solomon", n: "Solomon", b: "Son of David, king of Israel, known for his wisdom." },
  { id: "saul", n: "Saul", b: "First king of Israel, anointed by Samuel" },
  { id: "kish", n: "Kish", b: "Father of Saul, the first king of Israel" },
  { id: "moses", n: "Moses", b: "Prophet who led Israel out of Egypt" },
  { id: "aaron", n: "Aaron", b: "Moses' brother, first high priest of Israel" },
  { id: "othniel", n: "Othniel", b: "First judge of Israel, Caleb's nephew" },
  { id: "kenaz", n: "Kenaz", b: "Father of Othniel, a judge of Israel" },
  { id: "mehetabel", n: "Mehetabel", b: "Wife of Hadar, king of Edom." },
  { id: "hamutal", n: "Hamutal", b: "Mother of Jehoahaz and Zedekiah, kings of Judah." },
  { id: "joah", n: "Joah", b: "Son of Joahaz, King Josiah's secretary" },
  { id: "abner", n: "Abner", b: "Saul's cousin and commander of his army" },
];

describe("person roles", () => {
  const roles = assignRoles(people);
  it("reads the person's own role", () => {
    expect(["david", "solomon", "saul", "moses", "aaron", "othniel", "joah", "abner"].map((id) => roles.get(id))).toEqual(["king", "king", "king", "prophet", "priest", "judge", "leader", "warrior"]);
  });
  it("does not take a relative's role for the person's", () => {
    expect(["kish", "kenaz", "mehetabel", "hamutal"].map((id) => roles.get(id))).toEqual(["family", "family", "family", "family"]);
  });
  it("knows the family line", () => {
    expect(roleOf("Son of Peleg, ancestor of Abraham")).toBe("family");
  });
});
