// The question bank's figures shown on the Study page (question-summary.json) match the bank itself
// (data/questions/bank.json); when the bank is rebuilt, run node scripts/question-summary.mjs.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error -- a plain .mjs build script with no type declarations
import { summarise } from "../../scripts/question-summary.mjs";
import SUMMARY from "./question-summary.json";

const SITE = path.resolve(__dirname, "../..");

describe("question-summary.json", () => {
  it("matches the question bank", () => {
    const bank = JSON.parse(fs.readFileSync(path.join(SITE, "data/questions/bank.json"), "utf8"));
    expect(SUMMARY).toEqual(summarise(bank));
  });
});
