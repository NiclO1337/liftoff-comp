import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export type CreateClubField =
  "name" | "coachName" | "coachEmail" | "coachPassword";

// The first coach is optional, but all-or-none: name, email and password are
// either all empty or all filled in. Each missing part gets its own message,
// next to its field.
export const createClubSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter the club name")
      .max(80, "At most 80 characters"),
    coachName: z.string().trim().max(80, "At most 80 characters"),
    coachEmail: z.string().trim().max(254, "At most 254 characters"),
    // Not trimmed: spaces can be part of a password.
    coachPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const { coachName, coachEmail, coachPassword } = data;
    if (!coachName && !coachEmail && !coachPassword) return;

    const problem = (path: CreateClubField, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (!coachName) problem("coachName", "Enter the coach's name");

    if (!coachEmail) problem("coachEmail", "Enter the coach's email");
    else if (!z.email().safeParse(coachEmail).success)
      problem("coachEmail", "Enter a valid email address");

    if (!coachPassword) problem("coachPassword", "Enter a password");
    else if (coachPassword.length < MIN_PASSWORD_LENGTH)
      problem("coachPassword", `At least ${MIN_PASSWORD_LENGTH} characters`);
    else if (coachPassword.length > MAX_PASSWORD_LENGTH)
      problem("coachPassword", `At most ${MAX_PASSWORD_LENGTH} characters`);
  })
  .transform(({ name, coachName, coachEmail, coachPassword }) => ({
    name,
    coach: coachName
      ? { name: coachName, email: coachEmail, password: coachPassword }
      : null,
  }));
