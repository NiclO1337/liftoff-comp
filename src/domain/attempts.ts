import type { AttemptNumber, Flags, Result } from "./types";

const WHITE_FLAGS_FOR_GOOD_LIFT = 2;
const ESTIMATE_STEP_PERCENT = 4;
const LOWEST_WEIGHT_KG = 1;

/** R3: at least two white flags is a good lift. Which judge shows red does not matter. */
export function resolveResult(flags: Flags): Result {
  const whites = flags.filter((flag) => flag === "WHITE").length;
  return whites >= WHITE_FLAGS_FOR_GOOD_LIFT ? "GOOD" : "NO_LIFT";
}

/**
 * R2: +4 % for attempt 2 and +8 % for attempt 3 over the opening, in whole kg
 * and at least 1 kg over the previous attempt. Only used once, when a lifter
 * is added. Later edits never apply a percentage again.
 */
export function estimateWeight(
  attemptNumber: Exclude<AttemptNumber, 1>,
  opening: number,
  previousWeight: number,
): number {
  const percent = 100 + ESTIMATE_STEP_PERCENT * (attemptNumber - 1);
  return Math.max(Math.round((opening * percent) / 100), previousWeight + 1);
}

/**
 * R10: the lowest weight the next attempt of a lift may have. +1 kg after a
 * good lift, and also while the previous attempt has no result (the app
 * assumes it will be good). The same weight may be repeated after a no-lift.
 * Attempt 1 (no previous attempt) has no lower limit.
 */
export function minWeight(
  previous: { weightKg: number; result: Result | null } | null,
): number {
  if (previous === null) return LOWEST_WEIGHT_KG;
  return previous.result === "NO_LIFT"
    ? previous.weightKg
    : previous.weightKg + 1;
}
