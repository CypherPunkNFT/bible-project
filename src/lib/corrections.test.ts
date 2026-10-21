import { composeCorrection, correctionProblem, type Correction } from "@/lib/corrections";

const complete: Correction = { label: "Wrong fact or date", page: "/library?part=history#parts", title: "The library", message: "Nehemiah is c. 430 BC.", email: "" };

describe("corrections", () => {
  it("accepts a complete correction", () => {
    expect(correctionProblem(complete)).toBeNull();
  });

  it("refuses an unknown label, a missing message and a page that is not a path on this site", () => {
    expect(correctionProblem({ ...complete, label: "Spam" })).toMatch(/kind of correction/);
    expect(correctionProblem({ ...complete, message: "   " })).toMatch(/describe/);
    expect(correctionProblem({ ...complete, page: "https://elsewhere.example/" })).toMatch(/page address/);
    expect(correctionProblem({ ...complete, page: "//elsewhere.example/" })).toMatch(/page address/);
  });

  it("writes the subject as Content correction and the page as its own line", () => {
    const mail = composeCorrection(complete, "https://bibleproject.io");
    expect(mail.subject).toBe("Content correction: Wrong fact or date");
    expect(mail.text).toContain("Page: https://bibleproject.io/library?part=history#parts");
    expect(mail.text).toContain("Nehemiah is c. 430 BC.");
    expect(mail.text).toContain("Email: (none given)");
  });
});
