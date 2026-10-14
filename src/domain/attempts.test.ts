import { describe, expect, it } from "vitest";

import { estimateWeight, minWeight, resolveResult } from "./attempts";
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
