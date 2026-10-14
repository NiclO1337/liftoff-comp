import { describe, expect, it } from "vitest";

import { canEnterGroup } from "./groups";
import type { Sex } from "./types";

describe("canEnterGroup", () => {
  it.each<Sex>(["MALE", "FEMALE"])(
    "lets a %s lifter into a mixed group",
    (sex) => {
      expect(canEnterGroup({ allowedSex: null }, { sex })).toBe(true);
    },
  );

  it.each<[Sex, Sex]>([
    ["MALE", "MALE"],
    ["FEMALE", "FEMALE"],
  ])(
    "lets a lifter into a group for their own sex (%s, %s)",
    (allowedSex, sex) => {
      expect(canEnterGroup({ allowedSex }, { sex })).toBe(true);
    },
  );

  // R14: `allowedSex` is not enforced in this version. Change this test when it is.
  it.each<[Sex, Sex]>([
    ["MALE", "FEMALE"],
    ["FEMALE", "MALE"],
  ])(
    "does not enforce allowedSex yet (group %s, lifter %s)",
    (allowedSex, sex) => {
      expect(canEnterGroup({ allowedSex }, { sex })).toBe(true);
    },
  );
});
