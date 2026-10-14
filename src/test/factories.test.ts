import { describe, expect, it } from "vitest";

import { makeAttempt, makeEntry } from "./factories";

describe("makeAttempt", () => {
  it("builds a pending attempt without a result", () => {
    expect(makeAttempt()).toMatchObject({
      weightKg: 100,
      cancelled: false,
      flags: null,
      resultAt: null,
    });
  });

  it("applies overrides", () => {
    expect(makeAttempt({ weightKg: 95, cancelled: true })).toMatchObject({
      weightKg: 95,
      cancelled: true,
    });
  });
});

describe("makeEntry", () => {
  it("builds three attempts per lift in order", () => {
    const entry = makeEntry({
      snatch: [100, 104, 108],
      cleanJerk: [120, 125, 130],
    });

    expect(entry.attempts.map((a) => [a.lift, a.number, a.weightKg])).toEqual([
      ["SNATCH", 1, 100],
      ["SNATCH", 2, 104],
      ["SNATCH", 3, 108],
      ["CLEAN_JERK", 1, 120],
      ["CLEAN_JERK", 2, 125],
      ["CLEAN_JERK", 3, 130],
    ]);
  });

  it("gives every attempt a unique id", () => {
    const ids = makeEntry().attempts.map((a) => a.id);

    expect(new Set(ids).size).toBe(6);
  });

  it("accepts attempt overrides in place of a bare weight", () => {
    const resultAt = new Date("2026-10-18T14:00:00Z");
    const entry = makeEntry({
      snatch: [
        { weightKg: 100, flags: ["WHITE", "WHITE", "RED"], resultAt },
        104,
        108,
      ],
    });

    expect(entry.attempts[0]).toMatchObject({
      weightKg: 100,
      flags: ["WHITE", "WHITE", "RED"],
      resultAt,
    });
  });

  it("sets id and lot number", () => {
    expect(makeEntry({ id: "e7", lotNumber: 7 })).toMatchObject({
      id: "e7",
      lotNumber: 7,
    });
  });
});
