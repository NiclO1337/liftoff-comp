import { auth } from "@/server/auth";

type NewAccount = {
  name: string;
  email: string;
  password: string;
} & (
  | { role: "ADMIN" }
  // Coaches and lifters always belong to a club.
  | { role: "COACH" | "LIFTER"; clubId: string }
);

export type CreateAccountResult =
  { ok: true; userId: string } | { ok: false; error: string };

// Public sign-up is off, so this is the only way an account is created.
// Callers check the session and role first (context doc §19, decision 35).
export async function createAccount(
  account: NewAccount,
): Promise<CreateAccountResult> {
  const { internalAdapter, password } = await auth.$context;
  const { minPasswordLength, maxPasswordLength } = password.config;

  if (
    account.password.length < minPasswordLength ||
    account.password.length > maxPasswordLength
  ) {
    return {
      ok: false,
      error: `Password must be ${minPasswordLength}-${maxPasswordLength} characters`,
    };
  }

  const email = account.email.trim().toLowerCase();
  if (await internalAdapter.findUserByEmail(email)) {
    return { ok: false, error: "That email is already in use" };
  }

  const user = await internalAdapter.createUser(
    {
      name: account.name,
      email,
      emailVerified: true,
      role: account.role,
      clubId: account.role === "ADMIN" ? null : account.clubId,
    },
    { method: "email-password" },
  );
  await internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await password.hash(account.password),
  });

  return { ok: true, userId: user.id };
}
