import type { Sex } from "./types";

/**
 * R14: groups can mix men and women, so every lifter may enter every group.
 * Keep the check in this one place: restricting a group later means reading
 * `group.allowedSex` here.
 */
export const canEnterGroup: (
  group: { allowedSex: Sex | null },
  lifter: { sex: Sex },
) => boolean = () => true;
