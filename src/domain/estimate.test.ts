import { describe, expect, it } from "vitest";

import { good, makeEntry } from "@/test/factories";

import { liftsAhead } from "./estimate";
import { predictOrder } from "./order";

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
