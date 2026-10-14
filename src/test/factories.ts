import type {
  AttemptNumber,
  AttemptState,
  EntryState,
  LiftType,
} from "@/domain/types";

/** A bare weight, or the fields to override on that attempt (a result, `cancelled`, ...). */
export type AttemptSpec =
  number | Partial<Omit<AttemptState, "id" | "lift" | "number">>;

export function makeAttempt(
  overrides: Partial<AttemptState> = {},
): AttemptState {
  return {
    id: "attempt-1",
    lift: "SNATCH",
    number: 1,
    weightKg: 100,
    isEstimated: false,
    cancelled: false,
    flags: null,
    resultAt: null,
    ...overrides,
  };
}

type MakeEntryOptions = {
  id?: string;
  lotNumber?: number;
  snatch?: AttemptSpec[];
  cleanJerk?: AttemptSpec[];
};

function makeLift(
  entryId: string,
  lift: LiftType,
  specs: AttemptSpec[],
): AttemptState[] {
  return specs.map((spec, index) => {
    const number = (index + 1) as AttemptNumber;
    return makeAttempt({
      id: `${entryId}-${lift}-${number}`,
      lift,
      number,
      ...(typeof spec === "number" ? { weightKg: spec } : spec),
    });
  });
}

/** `makeEntry({ snatch: [100, 104, 108] })`. Both lifts get three attempts unless told otherwise. */
export function makeEntry({
  id = "entry-1",
  lotNumber = 1,
  snatch = [100, 104, 108],
  cleanJerk = [120, 125, 130],
}: MakeEntryOptions = {}): EntryState {
  return {
    id,
    lotNumber,
    attempts: [
      ...makeLift(id, "SNATCH", snatch),
      ...makeLift(id, "CLEAN_JERK", cleanJerk),
    ],
  };
}
