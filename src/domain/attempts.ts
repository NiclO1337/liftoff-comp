import type { AttemptNumber, AttemptState, Flags, Result } from "./types";

const WHITE_FLAGS_FOR_GOOD_LIFT = 2;
const ESTIMATE_STEP_PERCENT = 4;
const LOWEST_WEIGHT_KG = 1;

export type WeightChange =
  | { ok: true; lift: AttemptState[] }
  | {
      ok: false;
      reason: "NOT_WHOLE" | "TOO_LOW" | "TOO_HIGH";
      /** The lowest (TOO_LOW) or highest (TOO_HIGH) weight that would have been accepted. */
      limit?: number;
    };

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

function resultOf(attempt: AttemptState): Result | null {
  return attempt.flags === null ? null : resolveResult(attempt.flags);
}

function findAttempt(
  lift: AttemptState[],
  number: number,
): AttemptState | undefined {
  return lift.find((attempt) => attempt.number === number);
}

/**
 * R10: walk the lift in order and move every attempt without a result up to
 * the minimum that follows its predecessor. Moved attempts become estimates,
 * because nobody has confirmed them. Cancelled attempts move too, so Restore
 * never gives an invalid sequence. Attempts with a result never move, and an
 * attempt that is already high enough is left exactly as it is.
 */
function raiseLaterAttempts(lift: AttemptState[]): AttemptState[] {
  const byNumber = [...lift].sort((a, b) => a.number - b.number);
  const raised = new Map<AttemptState, AttemptState>();
  let previous: AttemptState | null = null;

  for (const attempt of byNumber) {
    let current = attempt;
    if (previous && attempt.flags === null) {
      const min = minWeight({
        weightKg: previous.weightKg,
        result: resultOf(previous),
      });
      if (attempt.weightKg < min) {
        current = { ...attempt, weightKg: min, isEstimated: true };
        raised.set(attempt, current);
      }
    }
    previous = current;
  }

  return lift.map((attempt) => raised.get(attempt) ?? attempt);
}

/**
 * R10: call this after a result or its flags changed. A correction is never
 * refused. Later attempts move up when the new result needs it, for example
 * a repeated weight after a no-lift that is corrected to a good lift.
 */
export function applyResultChange(lift: AttemptState[]): AttemptState[] {
  return raiseLaterAttempts(lift);
}

/**
 * R10: change the weight of one attempt in one lift. Refuses a weight that is
 * not whole kg, lower than the minimum after the previous attempt, or so high
 * that the next attempt, which already has a result, could no longer follow it.
 * A refusal carries the real limit for the message.
 *
 * Raising an attempt to or above the next one moves the later attempts up.
 * Lowering never changes the other attempts: the 4 % / 8 % estimate is only
 * used when a lifter is added (R2).
 */
export function applyWeightChange(
  lift: AttemptState[],
  attemptNumber: AttemptNumber,
  newWeight: number,
): WeightChange {
  const edited = findAttempt(lift, attemptNumber);
  if (!edited) throw new Error(`Attempt ${attemptNumber} is not in this lift`);

  if (!Number.isInteger(newWeight)) return { ok: false, reason: "NOT_WHOLE" };

  const previous = findAttempt(lift, attemptNumber - 1);
  const min = minWeight(
    previous
      ? { weightKg: previous.weightKg, result: resultOf(previous) }
      : null,
  );
  if (newWeight < min) return { ok: false, reason: "TOO_LOW", limit: min };

  const next = findAttempt(lift, attemptNumber + 1);
  if (next?.flags) {
    const max =
      resultOf(edited) === "NO_LIFT" ? next.weightKg : next.weightKg - 1;
    if (newWeight > max) return { ok: false, reason: "TOO_HIGH", limit: max };
  }

  const changed = lift.map((attempt) =>
    attempt === edited
      ? { ...attempt, weightKg: newWeight, isEstimated: false }
      : attempt,
  );
  return { ok: true, lift: raiseLaterAttempts(changed) };
}
