import type { Flags, Result } from "./types";

const WHITE_FLAGS_FOR_GOOD_LIFT = 2;

/** R3: at least two white flags is a good lift. Which judge shows red does not matter. */
export function resolveResult(flags: Flags): Result {
  const whites = flags.filter((flag) => flag === "WHITE").length;
  return whites >= WHITE_FLAGS_FOR_GOOD_LIFT ? "GOOD" : "NO_LIFT";
}
