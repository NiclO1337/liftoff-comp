import { describe, expect, it } from "vitest";

import { good, makeEntry, noLift } from "@/test/factories";

import { predictOrder, sortForDisplay } from "./order";
import type { EntryState, QueuedAttempt } from "./types";

/** `["a", 1]` is attempt 1 of entry "a". */
const summary = (order: QueuedAttempt[]) =>
  order.map(({ entryId, attempt }) => [entryId, attempt.number]);

const ids = (entries: EntryState[]) => entries.map((entry) => entry.id);

describe("predictOrder", () => {
  it("is empty without entries", () => {
    expect(predictOrder([], "SNATCH")).toEqual([]);
  });

  it("orders every pending attempt by weight", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [100, 104, 108] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [102, 106, 110] }),
      makeEntry({ id: "c", lotNumber: 3, snatch: [101, 105, 109] }),
    ];

    expect(summary(predictOrder(entries, "SNATCH"))).toEqual([
      ["a", 1],
      ["c", 1],
      ["b", 1],
      ["a", 2],
      ["c", 2],
      ["b", 2],
      ["a", 3],
      ["c", 3],
      ["b", 3],
    ]);
  });

  describe("a tie on weight", () => {
    it("goes to the lower attempt number first", () => {
      const entries = [
        makeEntry({ id: "a", lotNumber: 1, snatch: [good(100), 105, 110] }),
        makeEntry({ id: "b", lotNumber: 2, snatch: [105, 108, 112] }),
      ];

      expect(summary(predictOrder(entries, "SNATCH")).slice(0, 2)).toEqual([
        ["b", 1],
        ["a", 2],
      ]);
    });

    it("then to the lower lot number", () => {
      const entries = [
        makeEntry({ id: "a", lotNumber: 2, snatch: [100, 104, 108] }),
        makeEntry({ id: "b", lotNumber: 1, snatch: [100, 104, 108] }),
      ];

      expect(summary(predictOrder(entries, "SNATCH")).slice(0, 2)).toEqual([
        ["b", 1],
        ["a", 1],
      ]);
    });
  });

  it("lets a lifter follow themselves when the next weight is still the lowest", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [100, 101, 102] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [105, 108, 112] }),
    ];

    expect(summary(predictOrder(entries, "SNATCH")).slice(0, 4)).toEqual([
      ["a", 1],
      ["a", 2],
      ["a", 3],
      ["b", 1],
    ]);
  });

  it("starts at the next pending attempt of each lifter", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [good(100), 104, 108] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [noLift(102), 102, 106] }),
    ];

    expect(summary(predictOrder(entries, "SNATCH"))).toEqual([
      ["b", 2],
      ["a", 2],
      ["b", 3],
      ["a", 3],
    ]);
  });

  it("skips cancelled attempts and lifters who stopped", () => {
    const entries = [
      makeEntry({
        id: "a",
        lotNumber: 1,
        snatch: [
          good(100),
          { weightKg: 104, cancelled: true },
          { weightKg: 108, cancelled: true },
        ],
      }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [102, 106, 110] }),
    ];

    expect(summary(predictOrder(entries, "SNATCH"))).toEqual([
      ["b", 1],
      ["b", 2],
      ["b", 3],
    ]);
  });

  it("only looks at the lift it is asked for", () => {
    const entries = [
      makeEntry({
        id: "a",
        lotNumber: 1,
        snatch: [100, 104, 108],
        cleanJerk: [130, 134, 138],
      }),
      makeEntry({
        id: "b",
        lotNumber: 2,
        snatch: [102, 106, 110],
        cleanJerk: [125, 129, 133],
      }),
    ];

    const order = predictOrder(entries, "CLEAN_JERK");

    expect(order.map((queued) => queued.attempt.lift)).toEqual(
      Array(6).fill("CLEAN_JERK"),
    );
    expect(order[0]).toMatchObject({ entryId: "b", lotNumber: 2 });
    expect(order[0].attempt.weightKg).toBe(125);
  });

  it("changes the first attempt when a lifter raises their weight", () => {
    const before = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [92, 96, 100] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [93, 97, 101] }),
    ];
    const raised = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [95, 96, 100] }),
      before[1],
    ];

    expect(predictOrder(before, "SNATCH")[0].entryId).toBe("a");
    expect(predictOrder(raised, "SNATCH")[0].entryId).toBe("b");
  });

  it("does not change the entries", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [102, 106, 110] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [100, 104, 108] }),
    ];
    const copy = structuredClone(entries);

    predictOrder(entries, "SNATCH");

    expect(entries).toEqual(copy);
  });
});

describe("sortForDisplay", () => {
  it("orders lifters by the weight of their next pending attempt", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [105, 108, 112] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [100, 104, 108] }),
      makeEntry({ id: "c", lotNumber: 3, snatch: [102, 106, 110] }),
    ];

    expect(ids(sortForDisplay(entries, "SNATCH"))).toEqual(["b", "c", "a"]);
  });

  it("looks past attempts that already have a result", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [good(90), 110, 114] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [100, 104, 108] }),
    ];

    expect(ids(sortForDisplay(entries, "SNATCH"))).toEqual(["b", "a"]);
  });

  it("breaks a tie by attempt number, then by lot number", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 3, snatch: [100, 104, 108] }),
      makeEntry({ id: "b", lotNumber: 1, snatch: [good(95), 100, 108] }),
      makeEntry({ id: "c", lotNumber: 2, snatch: [100, 104, 108] }),
    ];

    expect(ids(sortForDisplay(entries, "SNATCH"))).toEqual(["c", "a", "b"]);
  });

  it("puts finished and stopped lifters at the bottom, by lot number", () => {
    const finished = makeEntry({
      id: "finished",
      lotNumber: 4,
      snatch: [good(80), noLift(84), good(86)],
    });
    const stopped = makeEntry({
      id: "stopped",
      lotNumber: 2,
      snatch: [
        good(70),
        { weightKg: 74, cancelled: true },
        { weightKg: 78, cancelled: true },
      ],
    });
    const withdrawn = makeEntry({
      id: "withdrawn",
      lotNumber: 3,
      snatch: [
        { weightKg: 60, cancelled: true },
        { weightKg: 64, cancelled: true },
        { weightKg: 68, cancelled: true },
      ],
    });
    const active = makeEntry({
      id: "active",
      lotNumber: 1,
      snatch: [150, 155, 160],
    });

    expect(
      ids(sortForDisplay([finished, stopped, active, withdrawn], "SNATCH")),
    ).toEqual(["active", "stopped", "withdrawn", "finished"]);
  });

  it("is per lift: finished in the Snatch is still first in line for the Clean & Jerk", () => {
    const entries = [
      makeEntry({
        id: "a",
        lotNumber: 1,
        snatch: [good(80), good(84), good(88)],
        cleanJerk: [110, 114, 118],
      }),
      makeEntry({
        id: "b",
        lotNumber: 2,
        snatch: [100, 104, 108],
        cleanJerk: [120, 124, 128],
      }),
    ];

    expect(ids(sortForDisplay(entries, "SNATCH"))).toEqual(["b", "a"]);
    expect(ids(sortForDisplay(entries, "CLEAN_JERK"))).toEqual(["a", "b"]);
  });

  it("puts the lifter whose attempt moved first when a weight changes", () => {
    const before = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [92, 96, 100] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [93, 97, 101] }),
    ];
    const raised = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [95, 96, 100] }),
      before[1],
    ];

    expect(ids(sortForDisplay(before, "SNATCH"))).toEqual(["a", "b"]);
    expect(ids(sortForDisplay(raised, "SNATCH"))).toEqual(["b", "a"]);
  });

  it("returns a new array and leaves the entries alone", () => {
    const entries = [
      makeEntry({ id: "a", lotNumber: 1, snatch: [105, 108, 112] }),
      makeEntry({ id: "b", lotNumber: 2, snatch: [100, 104, 108] }),
    ];

    const sorted = sortForDisplay(entries, "SNATCH");

    expect(sorted).not.toBe(entries);
    expect(ids(entries)).toEqual(["a", "b"]);
  });
});
