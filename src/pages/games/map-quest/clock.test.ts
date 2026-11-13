import { MAX_TIME_PENALTY, TIME_LIMIT_SECONDS, secondsBetween, timePenalty } from "./clock";

describe("map quest clock", () => {
  it("gives Beginner 90 seconds, Standard 60 and Expert 45", () => {
    expect(TIME_LIMIT_SECONDS).toEqual({ beginner: 90, standard: 60, expert: 45 });
  });

  it("takes points off evenly as time passes, and the whole penalty once time is up", () => {
    expect(timePenalty(0, "expert")).toBe(0);
    expect(timePenalty(15, "expert")).toBe(100);
    expect(timePenalty(45, "expert")).toBe(MAX_TIME_PENALTY);
    expect(timePenalty(600, "expert")).toBe(MAX_TIME_PENALTY);
    expect(timePenalty(45, "beginner")).toBe(150);
    expect(timePenalty(Number.NaN, "standard")).toBe(0);
  });

  it("counts whole seconds, never below zero", () => {
    expect(secondsBetween(1000, 5999)).toBe(4);
    expect(secondsBetween(5000, 1000)).toBe(0);
  });
});
