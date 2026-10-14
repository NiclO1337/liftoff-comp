export type Sex = "MALE" | "FEMALE";
export type LiftType = "SNATCH" | "CLEAN_JERK";
export type Flag = "WHITE" | "RED";
export type Result = "GOOD" | "NO_LIFT";

export type AttemptNumber = 1 | 2 | 3;

/** One judge decision per position, in fixed order: left, centre, right. */
export type Flags = readonly [Flag, Flag, Flag];

export type AttemptState = {
  id: string;
  lift: LiftType;
  number: AttemptNumber;
  weightKg: number;
  isEstimated: boolean;
  cancelled: boolean;
  /** `null` until a result is entered. The three flags are always set together. */
  flags: Flags | null;
  /** Set once, when the result is first entered. */
  resultAt: Date | null;
};

export type EntryState = {
  id: string;
  lotNumber: number;
  attempts: AttemptState[];
};

export type PaceRange = {
  minSeconds: number;
  maxSeconds: number;
};

export type Pace = {
  /** Consecutive attempts by different lifters. */
  different: PaceRange;
  /** A lifter following themselves (2-minute clock). */
  same: PaceRange;
};

/** One pending attempt in the predicted order of a lift. */
export type QueuedAttempt = {
  entryId: string;
  lotNumber: number;
  attempt: AttemptState;
};
