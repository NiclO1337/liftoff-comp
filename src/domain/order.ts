import type { EntryState, LiftType, QueuedAttempt } from "./types";

/** R6: lowest weight first, then lower attempt number, then lower lot number. */
function compareQueued(a: QueuedAttempt, b: QueuedAttempt): number {
  return (
    a.attempt.weightKg - b.attempt.weightKg ||
    a.attempt.number - b.attempt.number ||
    a.lotNumber - b.lotNumber
  );
}

/** The attempts of one lift that are still to be lifted, in attempt order. */
function queueOf(entry: EntryState, lift: LiftType): QueuedAttempt[] {
  return entry.attempts
    .filter(
      (attempt) =>
        attempt.lift === lift && attempt.flags === null && !attempt.cancelled,
    )
    .sort((a, b) => a.number - b.number)
    .map((attempt) => ({
      entryId: entry.id,
      lotNumber: entry.lotNumber,
      attempt,
    }));
}

/**
 * §6.1: simulate the rest of the lift. Repeatedly take the lowest next
 * attempt of all lifters (R6) and move that lifter on to their following
 * attempt. Every attempt is assumed to happen at the weight entered now, so
 * nothing about the order is stored: it is recalculated after every change.
 */
export function predictOrder(
  entries: EntryState[],
  lift: LiftType,
): QueuedAttempt[] {
  const queues = entries.map((entry) => queueOf(entry, lift));
  const order: QueuedAttempt[] = [];

  for (;;) {
    const active = queues.filter((queue) => queue.length > 0);
    if (active.length === 0) return order;

    const next = active.reduce((best, queue) =>
      compareQueued(queue[0], best[0]) < 0 ? queue : best,
    );
    order.push(next.shift()!);
  }
}

/**
 * R6, R7: the rows of one lift's table. Lifters sort by their next pending
 * attempt. Lifters with nothing left in this lift (finished, stopped or
 * withdrawn) go to the bottom, by lot number.
 */
export function sortForDisplay(
  entries: EntryState[],
  lift: LiftType,
): EntryState[] {
  const rows = entries.map((entry) => ({
    entry,
    next: queueOf(entry, lift)[0] as QueuedAttempt | undefined,
  }));

  rows.sort((a, b) => {
    if (a.next && b.next) return compareQueued(a.next, b.next);
    if (a.next) return -1;
    if (b.next) return 1;
    return a.entry.lotNumber - b.entry.lotNumber;
  });

  return rows.map((row) => row.entry);
}
