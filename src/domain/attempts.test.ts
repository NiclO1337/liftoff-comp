import { describe, expect, it } from "vitest";

import { resolveResult } from "./attempts";
import type { Flags, Result } from "./types";

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
