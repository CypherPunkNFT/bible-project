import { MAX_TIME_PENALTY, TIME_LIMIT_SECONDS, secondsBetween, timePenalty } from "./clock";

describe("map quest clock", () => {
  it("gives Beginner 90 seconds, Standard 60 and Expert 45", () => {
    expect(TIME_LIMIT_SECONDS).toEqual({ beginner: 90, standard: 60, expert: 45 });
  });

  it("takes at most 100 points on Beginner, 200 on Standard and 300 on Expert", () => {
    expect(MAX_TIME_PENALTY).toEqual({ beginner: 100, standard: 200, expert: 300 });
  });

  it("takes points off evenly as time passes, and the level's whole penalty once time is up", () => {
    expect(timePenalty(0, "expert")).toBe(0);
    expect(timePenalty(15, "expert")).toBe(100);
    expect(timePenalty(45, "expert")).toBe(300);
    expect(timePenalty(600, "expert")).toBe(300);
    expect(timePenalty(30, "standard")).toBe(100);
    expect(timePenalty(600, "standard")).toBe(200);
    expect(timePenalty(45, "beginner")).toBe(50);
    expect(timePenalty(600, "beginner")).toBe(100);
    expect(timePenalty(Number.NaN, "standard")).toBe(0);
  });

  it("counts whole seconds, never below zero", () => {
    expect(secondsBetween(1000, 5999)).toBe(4);
    expect(secondsBetween(5000, 1000)).toBe(0);
  });
});
