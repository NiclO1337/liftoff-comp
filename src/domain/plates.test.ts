import { describe, expect, it } from "vitest";

import {
  barWeightKg,
  COLLAR_KG,
  loadedBarKg,
  PLATE_SIZES_KG,
  platesPerSide,
} from "./plates";
import type { Sex } from "./types";

describe("barWeightKg and loadedBarKg", () => {
  it("is a 20 kg bar for men and a 15 kg bar for women", () => {
    expect(barWeightKg("MALE")).toBe(20);
    expect(barWeightKg("FEMALE")).toBe(15);
  });

  it("adds a 2.5 kg collar on each side before any plate", () => {
    expect(COLLAR_KG).toBe(2.5);
    expect(loadedBarKg("MALE")).toBe(25);
    expect(loadedBarKg("FEMALE")).toBe(20);
  });
});

describe("platesPerSide", () => {
  const cases: [sex: Sex, weightKg: number, perSide: number[]][] = [
    // men: (weight − 20 − 5) / 2 per side
    ["MALE", 26, [0.5]],
    ["MALE", 27, [1]],
    ["MALE", 30, [2.5]],
    ["MALE", 31, [2.5, 0.5]],
    ["MALE", 35, [5]],
    ["MALE", 60, [15, 2.5]],
    ["MALE", 61, [15, 2.5, 0.5]],
    ["MALE", 100, [25, 10, 2.5]],
    ["MALE", 150, [25, 25, 10, 2.5]],
    ["MALE", 250, [25, 25, 25, 25, 10, 2.5]],
    // women: (weight − 15 − 5) / 2 per side
    ["FEMALE", 21, [0.5]],
    ["FEMALE", 60, [20]],
    ["FEMALE", 61, [20, 0.5]],
    ["FEMALE", 100, [25, 15]],
  ];

  it.each(cases)("%s %s kg", (sex, weightKg, perSide) => {
    expect(platesPerSide(weightKg, sex)).toEqual(perSide);
  });

  describe("has no plates", () => {
    const empty: [sex: Sex, weightKg: number][] = [
      ["MALE", 25],
      ["MALE", 24],
      ["MALE", 1],
      ["FEMALE", 20],
      ["FEMALE", 19],
      ["MALE", 0],
      ["MALE", -10],
    ];

    it.each(empty)("%s %s kg: at or below the bar and collars", (sex, kg) => {
      expect(platesPerSide(kg, sex)).toEqual([]);
    });

    it.each([60.5, NaN, Infinity, -Infinity])(
      "for %s, which is not a whole number of kg",
      (weightKg) => {
        expect(platesPerSide(weightKg, "MALE")).toEqual([]);
      },
    );
  });

  describe("for every whole kg weight from 1 to 400", () => {
    const weights = Array.from({ length: 400 }, (_, index) => index + 1);
    const sexes: Sex[] = ["MALE", "FEMALE"];

    it.each(sexes)("%s: the loaded bar adds up to the weight", (sex) => {
      for (const weightKg of weights) {
        const perSide = platesPerSide(weightKg, sex);

        if (weightKg <= loadedBarKg(sex)) {
          expect(perSide).toEqual([]);
          continue;
        }
        const platesKg = 2 * perSide.reduce((sum, plate) => sum + plate, 0);
        expect(loadedBarKg(sex) + platesKg).toBe(weightKg);
      }
    });

    it.each(sexes)(
      "%s: uses only competition plates, heaviest first",
      (sex) => {
        for (const weightKg of weights) {
          const perSide = platesPerSide(weightKg, sex);

          expect(perSide.every((plate) => PLATE_SIZES_KG.includes(plate))).toBe(
            true,
          );
          expect(perSide).toEqual([...perSide].sort((a, b) => b - a));
        }
      },
    );
  });

  it("never uses a 1.25 kg plate", () => {
    expect(PLATE_SIZES_KG).not.toContain(1.25);
  });

  it("includes the metal 5 kg plate and the 25 kg competition plate", () => {
    expect(PLATE_SIZES_KG).toEqual([25, 20, 15, 10, 5, 2.5, 2, 1.5, 1, 0.5]);
  });
});
