// @vitest-environment node
import { describe, expect, it } from "vitest";
import { auth } from "@/server/auth";

describe("auth", () => {
  it("refuses public sign-up", async () => {
    const signUp = auth.api.signUpEmail({
      body: {
        name: "Mallory",
        email: "mallory@example.com",
        password: "password123",
      },
    });

    await expect(signUp).rejects.toMatchObject({
      body: { code: "EMAIL_PASSWORD_SIGN_UP_DISABLED" },
    });
  });

  it("does not let a user choose their own role or club", () => {
    const { additionalFields } = auth.options.user;

    expect(additionalFields.role.input).toBe(false);
    expect(additionalFields.clubId.input).toBe(false);
  });
});
