import { describe, expect, it } from "vitest";
import { createClubSchema } from "@/server/validation/club";

const empty = { name: "", coachName: "", coachEmail: "", coachPassword: "" };

function errorsFor(input: Partial<typeof empty>) {
  const result = createClubSchema.safeParse({ ...empty, ...input });
  if (result.success) return null;
  return Object.fromEntries(
    result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
  );
}

describe("createClubSchema: valid input", () => {
  it("accepts a club without a coach", () => {
    expect(createClubSchema.parse({ ...empty, name: "Hammar AK" })).toEqual({
      name: "Hammar AK",
      coach: null,
    });
  });

  it("accepts a club with a complete coach", () => {
    expect(
      createClubSchema.parse({
        name: "Hammar AK",
        coachName: "Eva Karlsson",
        coachEmail: "eva@hammar.se",
        coachPassword: "secret123",
      }),
    ).toEqual({
      name: "Hammar AK",
      coach: {
        name: "Eva Karlsson",
        email: "eva@hammar.se",
        password: "secret123",
      },
    });
  });

  it("trims the name, coach name and email but not the password", () => {
    expect(
      createClubSchema.parse({
        name: "  Hammar AK ",
        coachName: " Eva ",
        coachEmail: " eva@hammar.se ",
        coachPassword: "  spaces  ",
      }),
    ).toEqual({
      name: "Hammar AK",
      coach: { name: "Eva", email: "eva@hammar.se", password: "  spaces  " },
    });
  });

  it("ignores fields it does not know", () => {
    expect(
      createClubSchema.parse({ ...empty, name: "Hammar AK", $ACTION_ID: "x" }),
    ).toEqual({ name: "Hammar AK", coach: null });
  });
});

describe("createClubSchema: the club name", () => {
  it.each([
    ["is empty", ""],
    ["is only spaces", "   "],
  ])("is required: %s", (_case, name) => {
    expect(errorsFor({ name })).toEqual({ name: "Enter the club name" });
  });

  it("has a length limit", () => {
    expect(errorsFor({ name: "x".repeat(81) })).toEqual({
      name: "At most 80 characters",
    });
  });
});

describe("createClubSchema: the first coach is all-or-none", () => {
  const club = { name: "Hammar AK" };
  const whole = {
    coachName: "Eva",
    coachEmail: "eva@hammar.se",
    coachPassword: "secret123",
  };

  it.each([
    [
      "only a name",
      { coachName: whole.coachName },
      {
        coachEmail: "Enter the coach's email",
        coachPassword: "Enter a password",
      },
    ],
    [
      "only an email",
      { coachEmail: whole.coachEmail },
      {
        coachName: "Enter the coach's name",
        coachPassword: "Enter a password",
      },
    ],
    [
      "only a password",
      { coachPassword: whole.coachPassword },
      {
        coachName: "Enter the coach's name",
        coachEmail: "Enter the coach's email",
      },
    ],
    [
      "name and email, no password",
      { coachName: whole.coachName, coachEmail: whole.coachEmail },
      { coachPassword: "Enter a password" },
    ],
  ])("asks for what is missing: %s", (_case, coach, expected) => {
    expect(errorsFor({ ...club, ...coach })).toEqual(expected);
  });

  it("treats a coach name of only spaces as empty", () => {
    expect(errorsFor({ ...club, ...whole, coachName: "   " })).toEqual({
      coachName: "Enter the coach's name",
    });
  });

  it.each(["eva", "eva@", "@hammar.se", "eva hammar.se"])(
    "refuses the email %j",
    (coachEmail) => {
      expect(errorsFor({ ...club, ...whole, coachEmail })).toEqual({
        coachEmail: "Enter a valid email address",
      });
    },
  );

  it("needs a password of at least 8 characters", () => {
    expect(errorsFor({ ...club, ...whole, coachPassword: "short12" })).toEqual({
      coachPassword: "At least 8 characters",
    });
    expect(
      errorsFor({ ...club, ...whole, coachPassword: "eight888" }),
    ).toBeNull();
  });

  it("has a password length limit", () => {
    expect(
      errorsFor({ ...club, ...whole, coachPassword: "x".repeat(129) }),
    ).toEqual({ coachPassword: "At most 128 characters" });
  });

  it("reports the club name and the coach problems together", () => {
    expect(errorsFor({ coachName: "Eva" })).toEqual({
      name: "Enter the club name",
      coachEmail: "Enter the coach's email",
      coachPassword: "Enter a password",
    });
  });
});
