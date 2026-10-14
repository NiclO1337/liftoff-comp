import { describe, expect, it } from "vitest";

import { makeEntry, type AttemptSpec } from "@/test/factories";

import {
  applyResultChange,
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

describe("applyWeightChange: validation", () => {
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
        "a done attempt 1 corrected to the weight of a done attempt 2",
        snatch(good(90), good(92), 94),
        1,
        92,
        "TOO_HIGH",
        91,
      ],
      [
        "a done attempt 2 corrected to the weight of a done attempt 3",
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
        "a done attempt corrected to one below the next done attempt",
        snatch(good(90), good(92), 94),
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
    it("sets the weight and confirms an estimate", () => {
      const lift = snatch(good(90), { weightKg: 92, isEstimated: true }, 96);

      const change = applyWeightChange(lift, 2, 93);

      expect(change.ok && change.lift[1]).toMatchObject({
        weightKg: 93,
        isEstimated: false,
      });
    });

    it("leaves the result of a done attempt alone", () => {
      const lift = snatch(good(90), 92, 96);

      const change = applyWeightChange(lift, 1, 91);

      expect(change.ok && change.lift[0]).toMatchObject({
        weightKg: 91,
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

describe("applyWeightChange: cascade", () => {
  const weights = (lift: ReturnType<typeof snatch>) =>
    lift.map((attempt) => attempt.weightKg);
  const estimated = (lift: ReturnType<typeof snatch>) =>
    lift.map((attempt) => attempt.isEstimated);

  function change(
    lift: ReturnType<typeof snatch>,
    attemptNumber: AttemptNumber,
    newWeight: number,
  ) {
    const result = applyWeightChange(lift, attemptNumber, newWeight);
    if (!result.ok) throw new Error(`Refused: ${result.reason}`);
    return result.lift;
  }

  describe("raising moves the later attempts up", () => {
    const cases: [
      description: string,
      lift: ReturnType<typeof snatch>,
      attemptNumber: AttemptNumber,
      newWeight: number,
      expectedWeights: number[],
      expectedEstimated: boolean[],
    ][] = [
      [
        "attempt 2 raised to 94 (90 / 92 / 94 gives 90 / 94 / 95)",
        snatch(90, 92, 94),
        2,
        94,
        [90, 94, 95],
        [false, false, true],
      ],
      [
        "attempt 1 raised over attempt 2 moves both",
        snatch(90, 92, 94),
        1,
        93,
        [93, 94, 95],
        [false, true, true],
      ],
      [
        "attempt 1 raised to the weight of attempt 2",
        snatch(90, 92, 94),
        1,
        92,
        [92, 93, 94],
        [false, true, false],
      ],
      [
        "attempt 2 raised above attempt 3",
        snatch(90, 92, 94),
        2,
        100,
        [90, 100, 101],
        [false, false, true],
      ],
      [
        "a raise with room left changes nothing else",
        snatch(90, 95, 100),
        1,
        92,
        [92, 95, 100],
        [false, false, false],
      ],
      [
        "a raise after a no-lift lets the next attempt repeat the weight",
        snatch(noLift(90), 92, 94),
        1,
        93,
        [93, 93, 94],
        [false, true, false],
      ],
      [
        "a raise after a good lift moves the next attempt one kg above",
        snatch(good(90), 92, 94),
        1,
        93,
        [93, 94, 95],
        [false, true, true],
      ],
    ];

    it.each(cases)(
      "%s",
      (
        _description,
        lift,
        attemptNumber,
        newWeight,
        expectedWeights,
        expectedEstimated,
      ) => {
        const result = change(lift, attemptNumber, newWeight);

        expect(weights(result)).toEqual(expectedWeights);
        expect(estimated(result)).toEqual(expectedEstimated);
      },
    );
  });

  describe("lowering leaves the other attempts alone", () => {
    it("attempt 1", () => {
      const result = change(snatch(90, 92, 94), 1, 80);

      expect(weights(result)).toEqual([80, 92, 94]);
      expect(estimated(result)).toEqual([false, false, false]);
    });

    it("attempt 2, so attempt 3 gets no new percentage", () => {
      const result = change(snatch(100, 104, 108), 2, 101);

      expect(weights(result)).toEqual([100, 101, 108]);
      expect(estimated(result)).toEqual([false, false, false]);
    });
  });

  it("moves cancelled attempts too, and keeps them cancelled", () => {
    const lift = snatch(90, { weightKg: 92, cancelled: true }, 94);

    const result = change(lift, 1, 92);

    expect(result[1]).toMatchObject({
      weightKg: 93,
      cancelled: true,
      isEstimated: true,
    });
  });

  it("keeps the estimate marker on an attempt that was already an estimate and does not need to move", () => {
    const lift = snatch(90, 92, { weightKg: 100, isEstimated: true });

    const result = change(lift, 1, 91);

    expect(estimated(result)).toEqual([false, false, true]);
  });

  it("never moves an attempt that has a result", () => {
    const lift = snatch(good(90), good(93), 100);

    const result = change(lift, 1, 92);

    expect(result[1]).toEqual(lift[1]);
  });

  it("does not change the input", () => {
    const lift = snatch(90, 92, 94);

    change(lift, 2, 94);

    expect(weights(lift)).toEqual([90, 92, 94]);
    expect(estimated(lift)).toEqual([false, false, false]);
  });
});

describe("applyResultChange", () => {
  const weights = (lift: ReturnType<typeof snatch>) =>
    lift.map((attempt) => attempt.weightKg);
  const estimated = (lift: ReturnType<typeof snatch>) =>
    lift.map((attempt) => attempt.isEstimated);

  it("moves a repeated weight up when a no-lift is corrected to a good lift", () => {
    const lift = snatch(good(90), 90, 94);

    const result = applyResultChange(lift);

    expect(weights(result)).toEqual([90, 91, 94]);
    expect(estimated(result)).toEqual([false, true, false]);
  });

  it("moves the following attempts up as well", () => {
    const result = applyResultChange(snatch(good(90), 90, 91));

    expect(weights(result)).toEqual([90, 91, 92]);
    expect(estimated(result)).toEqual([false, true, true]);
  });

  it("moves cancelled attempts too, and keeps them cancelled", () => {
    const lift = snatch(good(90), { weightKg: 90, cancelled: true }, 94);

    const result = applyResultChange(lift);

    expect(result[1]).toMatchObject({
      weightKg: 91,
      cancelled: true,
      isEstimated: true,
    });
  });

  it("leaves a repeated weight alone while the result is still a no-lift", () => {
    const lift = snatch(noLift(90), 90, 94);

    expect(weights(applyResultChange(lift))).toEqual([90, 90, 94]);
  });

  it("does not move anything when a good lift is corrected to a no-lift", () => {
    const lift = snatch(noLift(90), 91, 94);

    expect(weights(applyResultChange(lift))).toEqual([90, 91, 94]);
  });

  it("never moves an attempt that has a result, and does not refuse the correction", () => {
    const lift = snatch(good(90), good(90), 90);

    const result = applyResultChange(lift);

    expect(result[1]).toEqual(lift[1]);
    expect(weights(result)).toEqual([90, 90, 91]);
  });

  it("keeps the flags and the result time of every attempt", () => {
    const lift = snatch(good(90), 90, 94);

    expect(applyResultChange(lift)[0]).toEqual(lift[0]);
  });

  it("does not change the input", () => {
    const lift = snatch(good(90), 90, 94);

    applyResultChange(lift);

    expect(weights(lift)).toEqual([90, 90, 94]);
    expect(estimated(lift)).toEqual([false, false, false]);
  });
});

describe("applyResultChange: a missed lift is repeated (R16)", () => {
  const estimate = (weightKg: number): Exclude<AttemptSpec, number> => ({
    weightKg,
    isEstimated: true,
  });
  const weights = (lift: ReturnType<typeof snatch>) =>
    lift.map((attempt) => attempt.weightKg);
  const estimated = (lift: ReturnType<typeof snatch>) =>
    lift.map((attempt) => attempt.isEstimated);

  it("takes the failed weight for the next attempt, which stays an estimate", () => {
    const result = applyResultChange(
      snatch(noLift(100), estimate(104), estimate(108)),
    );

    expect(weights(result)).toEqual([100, 100, 108]);
    expect(estimated(result)).toEqual([false, true, true]);
  });

  it("only changes the next attempt, so attempt 3 keeps its own estimate", () => {
    const result = applyResultChange(
      snatch(good(100), noLift(104), estimate(108)),
    );

    expect(weights(result)).toEqual([100, 104, 104]);
  });

  it("never overwrites a weight that someone confirmed", () => {
    const result = applyResultChange(snatch(noLift(100), 104, estimate(108)));

    expect(weights(result)).toEqual([100, 104, 108]);
  });

  it("leaves the estimates alone after a good lift", () => {
    const result = applyResultChange(
      snatch(good(100), estimate(104), estimate(108)),
    );

    expect(weights(result)).toEqual([100, 104, 108]);
  });

  it("leaves an estimate that is already at the failed weight, or below it for R10 to raise", () => {
    const result = applyResultChange(
      snatch(noLift(100), estimate(100), estimate(98)),
    );

    expect(weights(result)).toEqual([100, 100, 101]);
  });

  it("never moves an attempt that has a result", () => {
    const lift = snatch(noLift(100), { ...good(104), isEstimated: true }, 108);

    expect(applyResultChange(lift)[1]).toEqual(lift[1]);
  });

  it("moves the repeated weight up by 1 kg when the no-lift is corrected to a good lift", () => {
    const repeated = applyResultChange(
      snatch(noLift(100), estimate(104), estimate(108)),
    );
    const corrected = [{ ...repeated[0], ...good(100) }, ...repeated.slice(1)];

    expect(weights(applyResultChange(corrected))).toEqual([100, 101, 108]);
  });

  it("gives the same lift when applied twice", () => {
    const once = applyResultChange(
      snatch(noLift(100), estimate(104), estimate(108)),
    );

    expect(applyResultChange(once)).toEqual(once);
  });

  it("does not change the input", () => {
    const lift = snatch(noLift(100), estimate(104), estimate(108));

    applyResultChange(lift);

    expect(weights(lift)).toEqual([100, 104, 108]);
  });
});
