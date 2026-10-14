import { describe, expect, it } from "vitest";

import { good, makeEntry } from "@/test/factories";

import { estimateClock, estimateWait, liftsAhead } from "./estimate";
import { predictOrder } from "./order";
import type { EntryState, LastResult, Pace } from "./types";

describe("liftsAhead", () => {
  it("is 0 for the lifter who is next", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [100, 104, 108] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [102, 106, 110] }),
    ];

    expect(liftsAhead(predictOrder(entries, "SNATCH"), "a")).toBe(0);
  });

  it("counts attempts, not lifters", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [100, 101, 102] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [103, 108, 112] }),
    ];

    // a, a, a are all ahead of b
    expect(liftsAhead(predictOrder(entries, "SNATCH"), "b")).toBe(3);
  });

  it("counts up to the first attempt of a lifter who follows themselves", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [99, 105, 110] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [100, 101, 102] }),
    ];

    expect(liftsAhead(predictOrder(entries, "SNATCH"), "b")).toBe(1);
  });

  it("starts from the next pending attempt", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [good(100), 104, 108] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [good(101), 103, 109] }),
      makeEntry({ id: "c", lotNumber: 3, snatch: [105, 110, 115] }),
    ];

    // order: b 103, a 104, c 105, ...
    expect(liftsAhead(predictOrder(entries, "SNATCH"), "c")).toBe(2);
  });

  it("changes when a weight is edited", () => {
    const before = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [92, 96, 100] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [93, 97, 101] }),
    ];
    const raised = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [95, 96, 100] }),
      before[1],
    ];

    expect(liftsAhead(predictOrder(before, "SNATCH"), "b")).toBe(1);
    expect(liftsAhead(predictOrder(raised, "SNATCH"), "b")).toBe(0);
  });

  describe("is null", () => {
    it("for an empty order", () => {
      expect(liftsAhead([], "a")).toBeNull();
    });

    it("for a lifter who is not entered", () => {
      const order = predictOrder([makeEntry({ id: "a" })], "SNATCH");

      expect(liftsAhead(order, "unknown")).toBeNull();
    });

    it("for a lifter who is finished with this lift", () => {
      const entries = [
        makeEntry({ id: "a", snatch: [good(100), good(104), good(108)] }),
        makeEntry({ id: "b", lotNumber: 2 }),
      ];

      expect(liftsAhead(predictOrder(entries, "SNATCH"), "a")).toBeNull();
    });

    it("for a lifter who stopped or withdrew", () => {
      const entries = [
        makeEntry({
          id: "a",
          snatch: [
            { weightKg: 100, cancelled: true },
            { weightKg: 104, cancelled: true },
            { weightKg: 108, cancelled: true },
          ],
        }),
        makeEntry({ id: "b", lotNumber: 2 }),
      ];

      expect(liftsAhead(predictOrder(entries, "SNATCH"), "a")).toBeNull();
    });

    it("for the lift in play when the lifter's next attempt is in the other lift", () => {
      const entries = [
        makeEntry({ id: "a", snatch: [good(100), good(104), good(108)] }),
        makeEntry({ id: "b", lotNumber: 2, snatch: [102, 106, 110] }),
      ];

      expect(liftsAhead(predictOrder(entries, "SNATCH"), "a")).toBeNull();
      expect(liftsAhead(predictOrder(entries, "CLEAN_JERK"), "a")).toBe(0);
    });
  });
});

describe("estimateWait", () => {
  const pace: Pace = {
    different: { minSeconds: 75, maxSeconds: 90 },
    same: { minSeconds: 100, maxSeconds: 120 },
  };
  const lastAt = new Date("2026-10-18T14:00:00Z");
  const secondsLater = (seconds: number) =>
    new Date(lastAt.getTime() + seconds * 1000);

  /** "last" has just lifted. `others` lift once each, at 100 kg and up, then "me" at 120 kg. */
  function groupWith(others: number): EntryState[] {
    return [
      makeEntry({ id: "last", lotNumber: 1, snatch: [good(99), 140, 145] }),
      ...Array.from({ length: others }, (_, index) =>
        makeEntry({
          id: `other-${index}`,
          lotNumber: index + 2,
          snatch: [100 + index, 130 + index, 150 + index],
        }),
      ),
      makeEntry({ id: "me", lotNumber: 99, snatch: [120, 125, 130] }),
    ];
  }
  const lastByAnother: LastResult = { entryId: "last", at: lastAt };

  const wait = (
    entries: EntryState[],
    last: LastResult | null,
    now: Date,
    entryId = "me",
    usedPace = pace,
  ) =>
    estimateWait(predictOrder(entries, "SNATCH"), entryId, usedPace, last, now);

  it("7 lifts ahead of different lifters is 7 × 75 s to 7 × 90 s, which shows as 9–11 min", () => {
    expect(wait(groupWith(7), lastByAnother, lastAt)).toEqual({
      minSeconds: 525,
      maxSeconds: 630,
    });
  });

  it("is 0 when the lifter is next", () => {
    expect(wait(groupWith(0), lastByAnother, lastAt)).toEqual({
      minSeconds: 0,
      maxSeconds: 0,
    });
  });

  it("takes the time already waited off the first step only", () => {
    expect(wait(groupWith(7), lastByAnother, secondsLater(30))).toEqual({
      minSeconds: 75 - 30 + 6 * 75,
      maxSeconds: 90 - 30 + 6 * 90,
    });
  });

  it("does not let a long pause wipe out the other steps", () => {
    expect(wait(groupWith(7), lastByAnother, secondsLater(600))).toEqual({
      minSeconds: 6 * 75,
      maxSeconds: 6 * 90,
    });
  });

  it("treats a now before the last result as no time waited", () => {
    expect(wait(groupWith(3), lastByAnother, secondsLater(-60))).toEqual({
      minSeconds: 3 * 75,
      maxSeconds: 3 * 90,
    });
  });

  it("uses the same-lifter interval when a lifter follows themselves", () => {
    const entries = [
      makeEntry({ id: "last", lotNumber: 1, snatch: [good(99), 140, 145] }),
      makeEntry({ id: "x", lotNumber: 2, snatch: [100, 101, 150] }),
      makeEntry({ id: "me", lotNumber: 99, snatch: [120, 125, 130] }),
    ];

    // x lifts twice in a row, then me: step 1 is different, step 2 is the same lifter
    expect(wait(entries, lastByAnother, lastAt)).toEqual({
      minSeconds: 75 + 100,
      maxSeconds: 90 + 120,
    });
  });

  it("makes the first step a same-lifter step when the last lifter is next again", () => {
    const entries = [
      makeEntry({ id: "x", lotNumber: 2, snatch: [good(100), 101, 150] }),
      makeEntry({ id: "me", lotNumber: 99, snatch: [120, 125, 130] }),
    ];
    const last: LastResult = { entryId: "x", at: lastAt };

    expect(wait(entries, last, lastAt)).toEqual({
      minSeconds: 100,
      maxSeconds: 120,
    });
  });

  it("uses the pace of the group", () => {
    const quick: Pace = {
      different: { minSeconds: 60, maxSeconds: 60 },
      same: { minSeconds: 90, maxSeconds: 90 },
    };

    expect(wait(groupWith(2), lastByAnother, lastAt, "me", quick)).toEqual({
      minSeconds: 120,
      maxSeconds: 120,
    });
  });

  it("changes when a weight is edited", () => {
    const raised = groupWith(3).map((entry) =>
      entry.id === "other-0"
        ? makeEntry({ id: "other-0", lotNumber: 2, snatch: [125, 130, 150] })
        : entry,
    );

    // other-0 now lifts after "me", so only 2 lifts are ahead
    expect(wait(raised, lastByAnother, lastAt)).toEqual({
      minSeconds: 2 * 75,
      maxSeconds: 2 * 90,
    });
  });

  describe("is null", () => {
    it("until the lift has a result", () => {
      expect(wait(groupWith(3), null, lastAt)).toBeNull();
    });

    it("for a lifter who has nothing left in this lift", () => {
      expect(wait(groupWith(3), lastByAnother, lastAt, "unknown")).toBeNull();
    });
  });
});

describe("estimateClock", () => {
  const pace: Pace = {
    different: { minSeconds: 75, maxSeconds: 90 },
    same: { minSeconds: 100, maxSeconds: 120 },
  };
  const at = (time: string) => new Date(`2026-10-18T${time}Z`);
  const hhmm = (date: Date | null) => date?.toISOString().slice(11, 16);

  /** Nobody has lifted yet. `others` lift once each, then "me". */
  function lineUp(others: number): EntryState[] {
    return [
      ...Array.from({ length: others }, (_, index) =>
        makeEntry({
          id: `other-${index}`,
          lotNumber: index + 1,
          snatch: [100 + index, 130 + index, 150 + index],
        }),
      ),
      makeEntry({ id: "me", lotNumber: 99, snatch: [120, 125, 130] }),
    ];
  }

  const clock = (
    entries: EntryState[],
    startsAt: string,
    now: string,
    entryId = "me",
    usedPace = pace,
  ) =>
    estimateClock(
      predictOrder(entries, "SNATCH"),
      entryId,
      usedPace,
      at(startsAt),
      at(now),
    );

  it("a 13:50 start with 7 lifts ahead is around 14:00", () => {
    expect(hhmm(clock(lineUp(7), "13:50:00", "13:00:00"))).toBe("14:00");
  });

  it("a 14:45 Clean & Jerk start with 7 lifts ahead is around 14:55", () => {
    expect(hhmm(clock(lineUp(7), "14:45:00", "13:00:00"))).toBe("14:55");
  });

  it("is the start time itself when the lifter is next", () => {
    expect(hhmm(clock(lineUp(0), "13:50:00", "13:00:00"))).toBe("13:50");
  });

  it("uses the middle of each interval, so the same-lifter steps use 110 s", () => {
    const entries = [
      makeEntry({ id: "x", lotNumber: 1, snatch: [100, 101, 102] }),
      makeEntry({ id: "me", lotNumber: 99, snatch: [120, 125, 130] }),
    ];

    // x lifts three times in a row: 82.5 + 2 × 110 s = 302.5 s, so 14:05:02 is 14:05.
    // Three different lifters would be 247.5 s and round to 14:04.
    expect(hhmm(clock(entries, "14:00:00", "13:00:00"))).toBe("14:05");
  });

  it("counts from now when the scheduled start has passed", () => {
    expect(hhmm(clock(lineUp(7), "13:50:00", "14:20:00"))).toBe("14:30");
  });

  it("does not move before the start time while the start is still ahead", () => {
    expect(clock(lineUp(7), "13:50:00", "13:00:00")).toEqual(
      clock(lineUp(7), "13:50:00", "13:49:59"),
    );
  });

  it("rounds to the nearest minute, down and up", () => {
    const down: Pace = {
      different: { minSeconds: 70, maxSeconds: 70 },
      same: pace.same,
    };
    const up: Pace = {
      different: { minSeconds: 100, maxSeconds: 100 },
      same: pace.same,
    };

    expect(hhmm(clock(lineUp(1), "14:00:00", "13:00:00", "me", down))).toBe(
      "14:01",
    );
    expect(hhmm(clock(lineUp(1), "14:00:00", "13:00:00", "me", up))).toBe(
      "14:02",
    );
  });

  it("returns a whole minute, also when counting from a now with seconds", () => {
    const result = clock(lineUp(0), "13:50:00", "14:20:20");

    expect(result?.toISOString()).toBe("2026-10-18T14:20:00.000Z");
  });

  it("uses the pace of the group", () => {
    const slow: Pace = {
      different: { minSeconds: 180, maxSeconds: 180 },
      same: { minSeconds: 240, maxSeconds: 240 },
    };

    expect(hhmm(clock(lineUp(2), "14:00:00", "13:00:00", "me", slow))).toBe(
      "14:06",
    );
  });

  it("changes when a weight is edited", () => {
    const raised = lineUp(3).map((entry) =>
      entry.id === "other-0"
        ? makeEntry({ id: "other-0", lotNumber: 1, snatch: [125, 130, 150] })
        : entry,
    );

    // 2 lifts ahead instead of 3: 2 × 82.5 s = 165 s, so 14:02:45 is 14:03
    expect(hhmm(clock(raised, "14:00:00", "13:00:00"))).toBe("14:03");
  });

  it("is null for a lifter who has nothing left in this lift", () => {
    expect(clock(lineUp(3), "14:00:00", "13:00:00", "unknown")).toBeNull();
  });
});
