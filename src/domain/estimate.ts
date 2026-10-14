import type { QueuedAttempt } from "./types";

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
