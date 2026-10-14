import type { Sex } from "./types";

/**
 * Competition plates, heaviest first. Metal plates only, so the 5 kg plate is
 * the white metal one, and there is no 1.25 kg plate (decision 6).
 */
export const PLATE_SIZES_KG = [25, 20, 15, 10, 5, 2.5, 2, 1.5, 1, 0.5];

/** Competitions use a 2.5 kg collar on each side of the bar (§5). */
export const COLLAR_KG = 2.5;

const MEN_BAR_KG = 20;
const WOMEN_BAR_KG = 15;

/** The smallest plate, which every plate is a whole multiple of. */
const UNIT_KG = 0.5;

export function barWeightKg(sex: Sex): number {
  return sex === "MALE" ? MEN_BAR_KG : WOMEN_BAR_KG;
}

/** The bar with both collars: 25 kg for men and 20 kg for women, before any plate. */
export function loadedBarKg(sex: Sex): number {
  return barWeightKg(sex) + 2 * COLLAR_KG;
}

/**
 * The plates on one side of the bar for a total weight, heaviest first:
 * `(weight − bar − 5) / 2`. The lifter's own sex decides the bar (R14).
 *
 * Whole kg only. At or below the bar with collars there are no plates, and
 * neither are there for a weight that is not a whole number of kg. Every
 * whole-kg weight above that can be loaded, because the smallest plate is
 * 0.5 kg and each side carries half of a whole number.
 */
export function platesPerSide(weightKg: number, sex: Sex): number[] {
  if (!Number.isInteger(weightKg)) return [];

  const perSideKg = (weightKg - loadedBarKg(sex)) / 2;
  if (perSideKg <= 0) return [];

  let remainingUnits = Math.round(perSideKg / UNIT_KG);
  const plates: number[] = [];
  for (const plate of PLATE_SIZES_KG) {
    const plateUnits = Math.round(plate / UNIT_KG);
    while (remainingUnits >= plateUnits) {
      plates.push(plate);
      remainingUnits -= plateUnits;
    }
  }
  return plates;
}
