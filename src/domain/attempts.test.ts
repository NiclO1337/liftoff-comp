import { describe, expect, it } from "vitest";

import { makeEntry, type AttemptSpec } from "@/test/factories";

import {
  applyWeightChange,
  estimateWeight,
  minWeight,
  resolveResult,
} from "./attempts";
import type { AttemptNumber, Flags, Result } from "./types";

describe("resolveResult", () => {
  const cases: [Flags, Result][] = [
    [["WHITE", "WHITE", "WHITE"], "GOOD"],
    [["RED", "WHITE", "WHITE"], "GOOD"],
    [["WHITE", "RED", "WHITE"], "GOOD"],
    [["WHITE", "WHITE", "RED"], "GOOD"],
    [["RED", "RED", "WHITE"], "NO_LIFT"],
    [["RED", "WHITE", "RED"], "NO_LIFT"],
    [["WHITE", "RED", "RED"], "NO_LIFT"],
    [["RED", "RED", "RED"], "NO_LIFT"],
  ];

  it.each(cases)("%j gives %s", (flags, expected) => {
    expect(resolveResult(flags)).toBe(expected);
  });
});

describe("estimateWeight", () => {
  const cases: [
    description: string,
    attemptNumber: Exclude<AttemptNumber, 1>,
    opening: number,
    previousWeight: number,
    expected: number,
  ][] = [
    ["+4 % for attempt 2", 2, 100, 100, 104],
    ["+8 % for attempt 3", 3, 100, 104, 108],
    ["rounds down (90.48)", 2, 87, 87, 90],
    ["rounds up (93.96)", 3, 87, 90, 94],
    ["rounds to the nearest whole kg (62.4)", 2, 60, 60, 62],
    ["rounds to the nearest whole kg (64.8)", 3, 60, 62, 65],
    ["at least 1 kg over the previous attempt for attempt 2", 2, 10, 10, 11],
    ["at least 1 kg over the previous attempt for attempt 3", 3, 10, 11, 12],
    ["follows a previous weight above the estimate", 3, 100, 110, 111],
  ];

  it.each(cases)(
    "%s",
    (_description, attemptNumber, opening, previousWeight, expected) => {
      expect(estimateWeight(attemptNumber, opening, previousWeight)).toBe(
        expected,
      );
    },
  );
});

describe("minWeight", () => {
  const cases: [
    description: string,
    previous: { weightKg: number; result: Result | null } | null,
    expected: number,
  ][] = [
    ["attempt 1 has no lower limit (whole kg, at least 1)", null, 1],
    ["+1 kg after a good lift", { weightKg: 100, result: "GOOD" }, 101],
    [
      "+1 kg while the previous attempt has no result",
      { weightKg: 100, result: null },
      101,
    ],
    [
      "the same weight after a no-lift",
      { weightKg: 100, result: "NO_LIFT" },
      100,
    ],
  ];

  it.each(cases)("%s", (_description, previous, expected) => {
    expect(minWeight(previous)).toBe(expected);
  });
});

describe("applyWeightChange: validation", () => {
  const resultAt = new Date("2026-10-18T14:00:00Z");
  const good = (weightKg: number): Exclude<AttemptSpec, number> => ({
    weightKg,
    flags: ["WHITE", "WHITE", "RED"],
    resultAt,
  });
  const noLift = (weightKg: number): Exclude<AttemptSpec, number> => ({
    weightKg,
    flags: ["RED", "RED", "WHITE"],
    resultAt,
  });
  const snatch = (...specs: AttemptSpec[]) =>
    makeEntry({ snatch: specs }).attempts.slice(0, specs.length);

  describe("refuses", () => {
    const cases: [
      description: string,
      lift: ReturnType<typeof snatch>,
      attemptNumber: AttemptNumber,
      newWeight: number,
      reason: "NOT_WHOLE" | "TOO_LOW" | "TOO_HIGH",
      limit: number | undefined,
    ][] = [
      ["a fraction", snatch(90, 92, 94), 2, 92.5, "NOT_WHOLE", undefined],
      ["NaN", snatch(90, 92, 94), 2, NaN, "NOT_WHOLE", undefined],
      ["Infinity", snatch(90, 92, 94), 2, Infinity, "NOT_WHOLE", undefined],
      ["zero kg", snatch(90, 92, 94), 1, 0, "TOO_LOW", 1],
      [
        "the same weight while the previous attempt has no result",
        snatch(90, 92, 94),
        2,
        90,
        "TOO_LOW",
        91,
      ],
      [
        "the same weight after a good lift",
        snatch(good(92), 94, 96),
        2,
        92,
        "TOO_LOW",
        93,
      ],
      [
        "a lower weight after a no-lift",
        snatch(noLift(92), 94, 96),
        2,
        91,
        "TOO_LOW",
        92,
      ],
      [
        "attempt 3 at or below attempt 2",
        snatch(90, 92, 94),
        3,
        92,
        "TOO_LOW",
        93,
      ],
      [
        "attempt 1 raised to the weight of a next attempt that has a good result",
        snatch(90, good(92), 94),
        1,
        92,
        "TOO_HIGH",
        91,
      ],
      [
        "attempt 1 raised over a next attempt that has a result",
        snatch(90, good(92), 94),
        1,
        95,
        "TOO_HIGH",
        91,
      ],
      [
        "attempt 2 raised over attempt 3, which has a result",
        snatch(good(90), good(92), good(94)),
        2,
        94,
        "TOO_HIGH",
        93,
      ],
      [
        "a weight above a next attempt that may repeat after a no-lift",
        snatch(noLift(90), good(90), 94),
        1,
        91,
        "TOO_HIGH",
        90,
      ],
    ];

    it.each(cases)(
      "%s",
      (_description, lift, attemptNumber, newWeight, reason, limit) => {
        const change = applyWeightChange(lift, attemptNumber, newWeight);

        expect(change).toEqual(
          limit === undefined
            ? { ok: false, reason }
            : { ok: false, reason, limit },
        );
      },
    );
  });

  describe("accepts", () => {
    const cases: [
      description: string,
      lift: ReturnType<typeof snatch>,
      attemptNumber: AttemptNumber,
      newWeight: number,
    ][] = [
      ["exactly the minimum while pending", snatch(90, 92, 94), 2, 91],
      [
        "exactly the minimum after a good lift",
        snatch(good(92), 94, 96),
        2,
        93,
      ],
      ["a repeat after a no-lift", snatch(noLift(92), 94, 96), 2, 92],
      ["any lower weight for attempt 1", snatch(90, 92, 94), 1, 50],
      ["the lowest whole weight for attempt 1", snatch(90, 92, 94), 1, 1],
      ["no upper limit for attempt 3", snatch(90, 92, 94), 3, 200],
      [
        "raising over a next attempt without a result",
        snatch(90, 92, 94),
        1,
        95,
      ],
      [
        "exactly one below a next attempt that has a result",
        snatch(90, good(92), 94),
        1,
        91,
      ],
      [
        "the same weight as a next attempt after a no-lift",
        snatch(noLift(90), good(90), 94),
        1,
        90,
      ],
      ["the current weight again", snatch(90, 92, 94), 2, 92],
    ];

    it.each(cases)("%s", (_description, lift, attemptNumber, newWeight) => {
      expect(applyWeightChange(lift, attemptNumber, newWeight).ok).toBe(true);
    });
  });

  describe("on success", () => {
    it("sets the weight and confirms an estimate, leaving the result alone", () => {
      const lift = snatch(90, { ...good(92), isEstimated: true }, 96);

      const change = applyWeightChange(lift, 2, 93);

      expect(change.ok && change.lift[1]).toMatchObject({
        weightKg: 93,
        isEstimated: false,
        flags: ["WHITE", "WHITE", "RED"],
        resultAt,
      });
    });

    it("does not change the input", () => {
      const lift = snatch(90, 92, 94);

      applyWeightChange(lift, 2, 93);

      expect(lift.map((a) => a.weightKg)).toEqual([90, 92, 94]);
    });
  });
});
