import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  // No public sign-up: accounts are created on the server (context doc §19).
  emailAndPassword: { enabled: true, disableSignUp: true },
  user: {
    // `input: false` means a user can never set their own role or club.
    additionalFields: {
      role: {
        type: ["ADMIN", "COACH", "LIFTER"],
        required: false,
        defaultValue: "COACH",
        input: false,
      },
      clubId: { type: "string", required: false, input: false },
    },
  },
  // Must be last: lets Server Actions set the session cookie.
  plugins: [nextCookies()],
});
