import type {
  LastResult,
  Pace,
  PaceRange,
  QueuedAttempt,
  WaitRange,
} from "./types";

/**
 * §6.2: the number of attempts before this lifter's next attempt in the
 * predicted order of the lift in play. 0 means "you are next".
 *
 * `null` when the lifter has nothing left in this order: not entered,
 * finished, stopped or withdrawn, or their next attempt is in the other lift.
 */
export function liftsAhead(
  order: QueuedAttempt[],
  entryId: string,
): number | null {
  const index = order.findIndex((queued) => queued.entryId === entryId);
  return index === -1 ? null : index;
}

/**
 * §6.3: the interval before each of the first `count` attempts of the order,
 * measured from the attempt before it. A lifter following themselves gets the
 * longer same-lifter interval (2-minute clock instead of 1).
 */
function stepRanges(
  order: QueuedAttempt[],
  count: number,
  pace: Pace,
  previousEntryId: string | null,
): PaceRange[] {
  return order.slice(0, count).map((queued) => {
    const range =
      queued.entryId === previousEntryId ? pace.same : pace.different;
    previousEntryId = queued.entryId;
    return range;
  });
}

/**
 * §6.3: how long until this lifter is up, as a range in seconds. N lifts
 * ahead take N steps. The time already waited since the last result comes off
 * the first step only, so a long pause cannot wipe out the other steps.
 *
 * `null` until the lift in play has a result (`last` is null), and for a
 * lifter who is not in the order. Before the first result the UI shows a
 * clock time instead (`estimateClock`, R12).
 */
export function estimateWait(
  order: QueuedAttempt[],
  entryId: string,
  pace: Pace,
  last: LastResult | null,
  now: Date,
): WaitRange | null {
  const ahead = liftsAhead(order, entryId);
  if (ahead === null || last === null) return null;

  const waitedSeconds = Math.max(0, (now.getTime() - last.at.getTime()) / 1000);
  const steps = stepRanges(order, ahead, pace, last.entryId);

  return {
    minSeconds: sumSteps(
      steps.map((step) => step.minSeconds),
      waitedSeconds,
    ),
    maxSeconds: sumSteps(
      steps.map((step) => step.maxSeconds),
      waitedSeconds,
    ),
  };
}

function sumSteps(seconds: number[], waitedSeconds: number): number {
  return seconds.reduce(
    (total, step, index) =>
      total + (index === 0 ? Math.max(0, step - waitedSeconds) : step),
    0,
  );
}

const MS_PER_MINUTE = 60_000;

/**
 * R12: a fixed clock time for a tracked lifter before the lift's first result:
 * `max(startsAt, now)` plus the middle of each step's interval, rounded to the
 * nearest minute (13:50 and 7 lifts ahead is around 14:00). It does not count
 * down, so it is the same on every refresh. If the scheduled start has passed
 * without a result, it counts from now.
 *
 * `startsAt` is built on the device from the group's date and `HH:mm`, which
 * keeps this function pure. `null` for a lifter who is not in the order.
 */
export function estimateClock(
  order: QueuedAttempt[],
  entryId: string,
  pace: Pace,
  startsAt: Date,
  now: Date,
): Date | null {
  const ahead = liftsAhead(order, entryId);
  if (ahead === null) return null;

  // Nobody has lifted yet in this lift, so the first step is not a repeat.
  const middleSeconds = stepRanges(order, ahead, pace, null).reduce(
    (total, step) => total + (step.minSeconds + step.maxSeconds) / 2,
    0,
  );
  const startMs = Math.max(startsAt.getTime(), now.getTime());
  const clockMs = startMs + middleSeconds * 1000;

  return new Date(Math.round(clockMs / MS_PER_MINUTE) * MS_PER_MINUTE);
}
