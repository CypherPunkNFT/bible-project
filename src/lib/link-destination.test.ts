import { describe, expect, it } from "vitest";
import { leadsToBgea } from "./link-destination";

describe("leadsToBgea", () => {
  it("names billygraham.org and its subdomains", () => {
    expect(leadsToBgea("https://billygraham.org/articles/billy-graham-a-message-for-mothers")).toBe(true);
    expect(leadsToBgea("https://static.billygraham.org/cms-uploads/2025/2/18757_Hymns_for_the_Soul_8c68899dee.pdf")).toBe(true);
    expect(leadsToBgea("http://BillyGraham.org./sermons/3-unsolved-problems")).toBe(true);
  });

  it("leaves every other address alone", () => {
    for (const url of ["https://billygraham.org.example.com/", "https://evilbillygraham.org/", "https://billygraham.org@example.com/",
      "https://www.truthforlife.org/resources/sermon/temptation-cd/", "javascript:alert(1)", "/teachers/works/held-1", "", null, undefined])
      expect(leadsToBgea(url)).toBe(false);
  });
});
